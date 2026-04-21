import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import {
  createNotification,
  createNotificationForAdmins,
} from '../notifications/notifications.service.js';
import { Locker, LockerBooking } from './lockers.model.js';
import {
  bookingIdParamsSchema,
  bookingQuerySchema,
  createLockerBookingSchema,
  createLockerSchema,
  lockerIdParamsSchema,
  lockersQuerySchema,
  updateBookingStatusSchema,
  updateLockerSchema,
} from './lockers.validation.js';

function parseOrThrow(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new AppError(
      'Validation failed',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      result.error.flatten(),
    );
  }
  return result.data;
}

const toLockerDto = (row) => ({
  id: String(row._id),
  branch: row.branch,
  code: row.code,
  section: row.section || '',
  status: row.status,
  notes: row.notes || '',
  bookedByUserId: row.bookedByUserId || '',
  bookedByName: row.bookedByName || '',
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const toBookingDto = (row) => ({
  id: String(row._id),
  lockerId: row.lockerId,
  lockerCode: row.lockerCode,
  branch: row.branch,
  userId: row.userId,
  userName: row.userName,
  userEmail: row.userEmail || '',
  status: row.status,
  message: row.message || '',
  adminMessage: row.adminMessage || '',
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const getlockersStatus = (_req, res) => {
  res.json({
    module: 'lockers',
    status: 'ready',
  });
};

export const getLockers = asyncHandler(async (req, res) => {
  const query = parseOrThrow(lockersQuerySchema, req.query || {});
  const filter = {};
  if (query.branch) filter.branch = query.branch;
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { code: { $regex: query.search, $options: 'i' } },
      { section: { $regex: query.search, $options: 'i' } },
    ];
  }

  const rows = await Locker.find(filter).sort({ branch: 1, code: 1, createdAt: -1 });
  res.status(HTTP_STATUS.OK).json({ data: rows.map(toLockerDto) });
});

export const createLocker = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(createLockerSchema, req.body || {});
  const code = payload.code.toUpperCase();

  const existing = await Locker.findOne({ branch: payload.branch, code });
  if (existing) {
    throw new AppError('Locker code already exists in this branch', HTTP_STATUS.CONFLICT);
  }

  const created = await Locker.create({
    ...payload,
    code,
  });

  res.status(HTTP_STATUS.CREATED).json({
    message: 'Locker created successfully',
    data: toLockerDto(created),
  });
});

export const updateLocker = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(lockerIdParamsSchema, req.params || {});
  const payload = parseOrThrow(updateLockerSchema, req.body || {});

  const row = await Locker.findById(id);
  if (!row) {
    throw new AppError('Locker not found', HTTP_STATUS.NOT_FOUND);
  }
  const prevStatus = row.status;
  const prevBookedByUserId = row.bookedByUserId;
  const prevCode = row.code;

  if (payload.branch !== undefined) row.branch = payload.branch;
  if (payload.code !== undefined) row.code = payload.code.toUpperCase();
  if (payload.section !== undefined) row.section = payload.section;
  if (payload.status !== undefined) row.status = payload.status;
  if (payload.notes !== undefined) row.notes = payload.notes;
  if (payload.bookedByUserId !== undefined) row.bookedByUserId = payload.bookedByUserId;
  if (payload.bookedByName !== undefined) row.bookedByName = payload.bookedByName;

  if (row.status === 'available') {
    row.bookedByUserId = '';
    row.bookedByName = '';
  }

  try {
    await row.save();
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError('Locker code already exists in this branch', HTTP_STATUS.CONFLICT);
    }
    throw error;
  }

  const becameUnavailable = prevStatus !== 'unavailable' && row.status === 'unavailable';
  const assignedUserId = row.bookedByUserId || prevBookedByUserId;
  if (becameUnavailable && assignedUserId) {
    await Promise.allSettled([
      createNotification({
        recipientId: assignedUserId,
        recipientRole: 'user',
        type: 'locker',
        title: 'Locker Status Updated',
        message: `Locker ${row.code || prevCode} was marked unavailable by admin.`,
        entityType: 'locker',
        entityId: String(row._id),
      }),
    ]);
  }

  res.status(HTTP_STATUS.OK).json({
    message: 'Locker updated successfully',
    data: toLockerDto(row),
  });
});

export const deleteLocker = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(lockerIdParamsSchema, req.params || {});
  const deleted = await Locker.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError('Locker not found', HTTP_STATUS.NOT_FOUND);
  }

  await LockerBooking.updateMany(
    { lockerId: String(id), status: 'pending' },
    { $set: { status: 'rejected', adminMessage: 'Locker removed by admin' } },
  );

  res.status(HTTP_STATUS.OK).json({
    message: 'Locker deleted successfully',
  });
});

export const createLockerBookingRequest = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(createLockerBookingSchema, req.body || {});
  const approvedBooking = await LockerBooking.findOne({
    userId: payload.userId,
    status: 'approved',
  });
  if (approvedBooking) {
    throw new AppError(
      `You already have an approved locker (${approvedBooking.lockerCode}).`,
      HTTP_STATUS.CONFLICT,
    );
  }

  const locker = await Locker.findById(payload.lockerId);
  if (!locker) {
    throw new AppError('Locker not found', HTTP_STATUS.NOT_FOUND);
  }
  if (locker.status !== 'available') {
    throw new AppError('Locker is currently unavailable', HTTP_STATUS.CONFLICT);
  }

  const existingPending = await LockerBooking.findOne({
    lockerId: String(locker._id),
    userId: payload.userId,
    status: { $in: ['pending', 'approved'] },
  });
  if (existingPending) {
    throw new AppError('You already requested this locker', HTTP_STATUS.CONFLICT);
  }

  const created = await LockerBooking.create({
    lockerId: String(locker._id),
    lockerCode: locker.code,
    branch: locker.branch,
    userId: payload.userId,
    userName: payload.userName,
    userEmail: payload.userEmail,
    message: payload.message,
    status: 'pending',
  });

  await Promise.allSettled([
    createNotification({
      recipientId: payload.userId,
      recipientRole: 'user',
      type: 'locker',
      title: 'Locker Request Submitted',
      message: `Your request for locker ${locker.code} is pending admin approval.`,
      entityType: 'lockerBooking',
      entityId: String(created._id),
    }),
    createNotificationForAdmins({
      type: 'admin',
      title: 'New Locker Booking Request',
      message: `${payload.userName} requested locker ${locker.code} (${locker.branch}).`,
      entityType: 'lockerBooking',
      entityId: String(created._id),
    }),
  ]);

  res.status(HTTP_STATUS.CREATED).json({
    message: 'Locker booking request sent',
    data: toBookingDto(created),
  });
});

export const getLockerBookings = asyncHandler(async (req, res) => {
  const query = parseOrThrow(bookingQuerySchema, req.query || {});
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.branch) filter.branch = query.branch;
  if (query.userId) filter.userId = query.userId;

  const rows = await LockerBooking.find(filter)
    .sort({ createdAt: -1 })
    .limit(query.limit);

  res.status(HTTP_STATUS.OK).json({
    data: rows.map(toBookingDto),
  });
});

export const updateLockerBookingStatus = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(bookingIdParamsSchema, req.params || {});
  const payload = parseOrThrow(updateBookingStatusSchema, req.body || {});

  const booking = await LockerBooking.findById(id);
  if (!booking) {
    throw new AppError('Locker booking request not found', HTTP_STATUS.NOT_FOUND);
  }
  if (booking.status !== 'pending') {
    throw new AppError('Only pending requests can be updated', HTTP_STATUS.CONFLICT);
  }

  const locker = await Locker.findById(booking.lockerId);
  if (!locker) {
    throw new AppError('Locker not found', HTTP_STATUS.NOT_FOUND);
  }

  booking.status = payload.status;
  booking.adminMessage = payload.adminMessage || '';

  if (payload.status === 'approved') {
    const existingApprovedForUser = await LockerBooking.findOne({
      _id: { $ne: booking._id },
      userId: booking.userId,
      status: 'approved',
    });
    if (existingApprovedForUser) {
      throw new AppError(
        `User already has an approved locker (${existingApprovedForUser.lockerCode}).`,
        HTTP_STATUS.CONFLICT,
      );
    }

    if (locker.status !== 'available') {
      throw new AppError('Locker is already unavailable', HTTP_STATUS.CONFLICT);
    }
    locker.status = 'unavailable';
    locker.bookedByUserId = booking.userId;
    locker.bookedByName = booking.userName;
    await locker.save();

    await LockerBooking.updateMany(
      {
        _id: { $ne: booking._id },
        lockerId: booking.lockerId,
        status: 'pending',
      },
      {
        $set: {
          status: 'rejected',
          adminMessage: 'Locker already assigned to another member',
        },
      },
    );
  }

  await booking.save();

  const defaultMessage = payload.status === 'approved'
    ? 'Locker booking approved. Get your keys from reception when you go to the gym.'
    : `Locker request for ${booking.lockerCode} was rejected.`;

  await createNotification({
    recipientId: booking.userId,
    recipientRole: 'user',
    type: 'locker',
    title: payload.status === 'approved' ? 'Locker Request Approved' : 'Locker Request Rejected',
    message: payload.adminMessage || defaultMessage,
    entityType: 'lockerBooking',
    entityId: String(booking._id),
  });

  res.status(HTTP_STATUS.OK).json({
    message: 'Locker request updated successfully',
    data: toBookingDto(booking),
  });
});
