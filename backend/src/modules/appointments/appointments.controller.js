import { Appointment } from './appointments.model.js';
import {
  delegateAppointmentSchema,
  appointmentIdParamsSchema,
  appointmentQuerySchema,
  createAppointmentSchema,
  snoozeAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
} from './appointments.validation.js';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { User } from '../users/users.model.js';
import {
  createNotification,
  createNotificationForAdmins,
} from '../notifications/notifications.service.js';
import {
  assignQueuePosition,
  calculateSlaDeadline,
  ensureQueueWorkerStarted,
  processSnooze,
  runEscalationCheck,
} from './appointments.queue.js';

function parseOrThrow(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new AppError('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, result.error.flatten());
  }
  return result.data;
}

function buildDateRange(dateText) {
  const start = new Date(`${dateText}T00:00:00.000Z`);
  const end = new Date(`${dateText}T23:59:59.999Z`);
  return { start, end };
}

function getProviderLabel(sessionType) {
  return sessionType === 'nutrition' ? 'dietitian' : 'coach';
}

function statusToTitle(status) {
  if (status === 'approved') return 'Booking Approved';
  if (status === 'rejected') return 'Booking Rejected';
  if (status === 'cancelled') return 'Booking Cancelled';
  if (status === 'completed') return 'Session Completed';
  return 'Booking Updated';
}

function normalizePriority(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'urgent' || normalized === 'low') return normalized;
  return 'normal';
}

const HOUR_MS = 60 * 60 * 1000;

function toHours(value) {
  return Number((Number(value || 0)).toFixed(2));
}

function asDate(value, fallback = null) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
}

function toQueueDto(item) {
  const queueEnteredAt = asDate(item.queueEnteredAt, asDate(item.createdAt, new Date()));
  const slaDeadline = asDate(item.slaDeadline, null);
  const now = Date.now();
  const waitTimeHours = toHours((now - queueEnteredAt.getTime()) / HOUR_MS);
  const slaRemainingHours = slaDeadline
    ? toHours((slaDeadline.getTime() - now) / HOUR_MS)
    : null;

  return {
    ...withPriorityFallback(item),
    waitTimeHours,
    slaRemainingHours,
  };
}

ensureQueueWorkerStarted();

function withPriorityFallback(record) {
  if (!record) return record;
  const data = typeof record.toObject === 'function' ? record.toObject() : { ...record };
  return {
    ...data,
    priority: normalizePriority(data.priority),
  };
}

function enforceAppointmentAccess(item, authUser) {
  const role = String(authUser?.role || '');
  const authUserId = String(authUser?.id || '');
  if (!item || !role || !authUserId) {
    throw new AppError('Forbidden', HTTP_STATUS.FORBIDDEN);
  }
  if (role === 'admin') return;
  if (role === 'user' && String(item.userId) === authUserId) return;
  if (role === 'coach' && String(item.coachId || '') === authUserId) return;
  if (role === 'dietitian' && String(item.dietitianId || '') === authUserId) return;
  throw new AppError('Forbidden', HTTP_STATUS.FORBIDDEN);
}

export const createAppointment = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(createAppointmentSchema, req.body);
  if (req.user?.role !== 'admin' && String(payload.userId) !== String(req.user?.id || '')) {
    throw new AppError('Forbidden: userId mismatch', HTTP_STATUS.FORBIDDEN);
  }
  const providerField = payload.sessionType === 'nutrition' ? 'dietitianId' : 'coachId';
  const providerValue = payload[providerField];

  const overlapping = await Appointment.findOne({
    [providerField]: providerValue,
    status: { $in: ['pending', 'approved'] },
    startsAt: { $lt: payload.endsAt },
    endsAt: { $gt: payload.startsAt },
  });

  if (overlapping) {
    throw new AppError(
      payload.sessionType === 'nutrition'
        ? 'Dietitian already has a booking in this time range'
        : 'Coach already has a booking in this time range',
      HTTP_STATUS.CONFLICT,
    );
  }

  const now = new Date();
  const normalizedPriority = normalizePriority(payload.priority);
  const created = await Appointment.create({
    ...payload,
    priority: normalizedPriority,
    queueEnteredAt: now,
    queuePosition: null,
    slaDeadline: calculateSlaDeadline(normalizedPriority, now),
    slaBreached: false,
    escalationHistory: [],
    lastEscalatedAt: null,
    snoozedUntil: null,
  });

  if (payload.coachId) {
    await assignQueuePosition(payload.coachId);
  }

  await Promise.allSettled([
    createNotification({
      recipientId: payload.userId,
      recipientRole: 'user',
      type: 'booking',
      title: 'Booking Request Sent',
      message: `Your ${payload.sessionType} booking request was submitted successfully.`,
      entityType: 'appointment',
      entityId: String(created._id),
    }),
    payload[providerField]
      ? createNotification({
          recipientId: payload[providerField],
          recipientRole: payload.sessionType === 'nutrition' ? 'dietitian' : 'coach',
          type: 'booking',
          title: 'New Booking Request',
          message: `You received a new ${payload.sessionType} booking request.`,
          entityType: 'appointment',
          entityId: String(created._id),
        })
      : Promise.resolve(null),
    createNotificationForAdmins({
      title: 'New Booking Received',
      message: `A new ${payload.sessionType} booking request was created.`,
      entityType: 'appointment',
      entityId: String(created._id),
    }),
  ]);

  res.status(HTTP_STATUS.CREATED).json({
    message: 'Appointment created successfully',
    data: withPriorityFallback(created),
  });
});

export const getAppointments = asyncHandler(async (req, res) => {
  const query = parseOrThrow(appointmentQuerySchema, req.query);
  const authRole = String(req.user?.role || '');
  const authUserId = String(req.user?.id || '');

  const filter = {};
  if (authRole === 'admin') {
    if (query.coachId) filter.coachId = query.coachId;
    if (query.dietitianId) filter.dietitianId = query.dietitianId;
    if (query.userId) filter.userId = query.userId;
  } else if (authRole === 'user') {
    filter.userId = authUserId;
  } else if (authRole === 'coach') {
    filter.coachId = authUserId;
  } else if (authRole === 'dietitian') {
    filter.dietitianId = authUserId;
  } else {
    throw new AppError('Forbidden', HTTP_STATUS.FORBIDDEN);
  }
  if (query.status) filter.status = query.status;
  if (query.sessionType) filter.sessionType = query.sessionType;

  if (query.date) {
    const { start, end } = buildDateRange(query.date);
    filter.startsAt = { $gte: start, $lte: end };
  }

  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    Appointment.find(filter).sort({ startsAt: 1 }).skip(skip).limit(query.limit),
    Appointment.countDocuments(filter),
  ]);

  res.status(HTTP_STATUS.OK).json({
    data: items.map(withPriorityFallback),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  });
});

export const getAppointmentById = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(appointmentIdParamsSchema, req.params);

  const item = await Appointment.findById(id);
  if (!item) {
    throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
  }
  enforceAppointmentAccess(item, req.user);

  res.status(HTTP_STATUS.OK).json({ data: withPriorityFallback(item) });
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(appointmentIdParamsSchema, req.params);
  const payload = parseOrThrow(updateAppointmentStatusSchema, req.body);

  const item = await Appointment.findById(id);
  if (!item) {
    throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
  }
  enforceAppointmentAccess(item, req.user);
  const role = String(req.user?.role || '');
  if (role === 'user') {
    throw new AppError('Forbidden', HTTP_STATUS.FORBIDDEN);
  }
  const nextStatus = typeof payload.status === 'string' ? payload.status : String(item.status);
  const isTerminalDecision = ['approved', 'rejected'].includes(String(item.status));
  const isDecisionUpdate = ['approved', 'rejected'].includes(String(nextStatus));
  if (payload.status && isTerminalDecision && isDecisionUpdate) {
    throw new AppError(
      'This booking is already decided and cannot be approved/rejected again.',
      HTTP_STATUS.CONFLICT,
    );
  }

  if (payload.status) {
    item.status = payload.status;
  }
  if (payload.priority) {
    if (!['admin', 'coach', 'dietitian'].includes(role)) {
      throw new AppError('Only providers or admins can change appointment priority.', HTTP_STATUS.FORBIDDEN);
    }
    item.priority = normalizePriority(payload.priority);
  }
  if (typeof payload.notes === 'string') {
    item.notes = payload.notes;
  }

  await item.save();

  await Promise.allSettled([
    createNotification({
      recipientId: item.userId,
      recipientRole: 'user',
      type: 'booking',
      title: statusToTitle(nextStatus),
      message: payload.status
        ? `Your booking was ${payload.status} by ${getProviderLabel(item.sessionType)}.`
        : 'Your booking details were updated by your provider.',
      entityType: 'appointment',
      entityId: String(item._id),
    }),
    createNotificationForAdmins({
      title: 'Booking Status Changed',
      message: payload.status
        ? `A booking was marked as ${payload.status}.`
        : 'A booking priority/details were updated.',
      entityType: 'appointment',
      entityId: String(item._id),
    }),
  ]);

  res.status(HTTP_STATUS.OK).json({
    message: 'Appointment status updated',
    data: withPriorityFallback(item),
  });
});

export const getCoachQueue = asyncHandler(async (req, res) => {
  const role = String(req.user?.role || '');
  const authUserId = String(req.user?.id || '');
  if (!['coach', 'admin'].includes(role)) {
    throw new AppError('Forbidden', HTTP_STATUS.FORBIDDEN);
  }

  const coachId = role === 'coach'
    ? authUserId
    : String(req.query?.coachId || '').trim();
  if (!coachId) {
    throw new AppError('coachId is required', HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  await runEscalationCheck(coachId);
  const activeQueue = await assignQueuePosition(coachId);
  const now = new Date();
  const snoozed = await Appointment.find({
    coachId,
    status: 'pending',
    snoozedUntil: { $gt: now },
  }).sort({ snoozedUntil: 1, queueEnteredAt: 1, createdAt: 1 });

  res.status(HTTP_STATUS.OK).json({
    data: activeQueue.map(toQueueDto),
    snoozed: snoozed.map(toQueueDto),
  });
});

export const snoozeAppointment = asyncHandler(async (req, res) => {
  const role = String(req.user?.role || '');
  const authUserId = String(req.user?.id || '');
  if (role !== 'coach') {
    throw new AppError('Forbidden', HTTP_STATUS.FORBIDDEN);
  }

  const { id } = parseOrThrow(appointmentIdParamsSchema, req.params);
  const { snoozeMinutes } = parseOrThrow(snoozeAppointmentSchema, req.body);

  const item = await Appointment.findById(id);
  if (!item) {
    throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
  }
  if (String(item.coachId || '') !== authUserId) {
    throw new AppError('Forbidden', HTTP_STATUS.FORBIDDEN);
  }
  if (String(item.status) !== 'pending') {
    throw new AppError('Only pending appointments can be snoozed', HTTP_STATUS.CONFLICT);
  }

  const updated = await processSnooze(id, snoozeMinutes);
  if (!updated) {
    throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
  }
  await assignQueuePosition(authUserId);

  res.status(HTTP_STATUS.OK).json({
    message: 'Appointment snoozed',
    data: toQueueDto(updated),
  });
});

export const getQueueStats = asyncHandler(async (req, res) => {
  const role = String(req.user?.role || '');
  const authUserId = String(req.user?.id || '');
  if (!['coach', 'admin'].includes(role)) {
    throw new AppError('Forbidden', HTTP_STATUS.FORBIDDEN);
  }

  const coachId = role === 'coach'
    ? authUserId
    : String(req.query?.coachId || '').trim();
  if (!coachId) {
    throw new AppError('coachId is required', HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  await runEscalationCheck(coachId);
  await assignQueuePosition(coachId);

  const pendingItems = await Appointment.find({
    coachId,
    status: 'pending',
  });
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const stats = pendingItems.reduce(
    (acc, item) => {
      const priority = normalizePriority(item.priority);
      if (priority === 'urgent') acc.urgentCount += 1;
      if (priority === 'normal') acc.normalCount += 1;
      if (priority === 'low') acc.lowCount += 1;
      if (item.slaBreached) acc.slaBreachedCount += 1;

      const enteredAt = asDate(item.queueEnteredAt, asDate(item.createdAt, new Date()));
      const waitHours = (now - enteredAt.getTime()) / HOUR_MS;
      acc.waitTotal += waitHours;
      acc.longestWaitHours = Math.max(acc.longestWaitHours, waitHours);

      const escalations = Array.isArray(item.escalationHistory) ? item.escalationHistory : [];
      escalations.forEach((entry) => {
        const escalatedAt = asDate(entry?.escalatedAt, null);
        if (escalatedAt && escalatedAt >= todayStart) {
          acc.escalatedTodayCount += 1;
        }
      });
      return acc;
    },
    {
      urgentCount: 0,
      normalCount: 0,
      lowCount: 0,
      slaBreachedCount: 0,
      waitTotal: 0,
      longestWaitHours: 0,
      escalatedTodayCount: 0,
    },
  );

  const itemCount = pendingItems.length;
  res.status(HTTP_STATUS.OK).json({
    data: {
      urgentCount: stats.urgentCount,
      normalCount: stats.normalCount,
      lowCount: stats.lowCount,
      slaBreachedCount: stats.slaBreachedCount,
      avgWaitHours: itemCount ? toHours(stats.waitTotal / itemCount) : 0,
      longestWaitHours: toHours(stats.longestWaitHours),
      escalatedTodayCount: stats.escalatedTodayCount,
    },
  });
});

export const updateAppointment = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(appointmentIdParamsSchema, req.params);
  const payload = parseOrThrow(updateAppointmentSchema, req.body);

  const item = await Appointment.findById(id);
  if (!item) {
    throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
  }
  enforceAppointmentAccess(item, req.user);
  if (!['admin', 'user'].includes(String(req.user?.role || ''))) {
    throw new AppError('Forbidden', HTTP_STATUS.FORBIDDEN);
  }
  if (typeof payload.priority === 'string' && String(req.user?.role || '') === 'user') {
    throw new AppError('Members cannot change appointment priority after booking.', HTTP_STATUS.FORBIDDEN);
  }
  if (String(item.status) !== 'pending') {
    throw new AppError(
      'Reschedule is allowed only before approval. This request is already processed.',
      HTTP_STATUS.CONFLICT,
    );
  }

  const providerField = item.sessionType === 'nutrition' ? 'dietitianId' : 'coachId';
  const providerValue = item[providerField];

  const overlapping = await Appointment.findOne({
    _id: { $ne: id },
    [providerField]: providerValue,
    status: { $in: ['pending', 'approved'] },
    startsAt: { $lt: payload.endsAt },
    endsAt: { $gt: payload.startsAt },
  });

  if (overlapping) {
    throw new AppError(
      item.sessionType === 'nutrition'
        ? 'Dietitian is already booked at that time. Please change the time.'
        : 'Coach is already booked at that time. Please change the time.',
      HTTP_STATUS.CONFLICT,
    );
  }

  item.startsAt = payload.startsAt;
  item.endsAt = payload.endsAt;
  if (payload.sessionType) item.sessionType = payload.sessionType;
  if (typeof payload.priority === 'string') item.priority = normalizePriority(payload.priority);
  if (typeof payload.notes === 'string') item.notes = payload.notes;
  await item.save();

  res.status(HTTP_STATUS.OK).json({
    message: 'Appointment updated successfully',
    data: withPriorityFallback(item),
  });
});

export const deleteAppointment = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(appointmentIdParamsSchema, req.params);

  const item = await Appointment.findById(id);
  if (!item) {
    throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
  }
  enforceAppointmentAccess(item, req.user);
  if (!['admin', 'user'].includes(String(req.user?.role || ''))) {
    throw new AppError('Forbidden', HTTP_STATUS.FORBIDDEN);
  }
  const coachId = String(item.coachId || '');
  await item.deleteOne();
  if (coachId) {
    await assignQueuePosition(coachId);
  }

  res.status(HTTP_STATUS.OK).json({
    message: 'Appointment deleted successfully',
  });
});

export const delegateAppointment = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(appointmentIdParamsSchema, req.params);
  const { subCoachId } = parseOrThrow(delegateAppointmentSchema, req.body);

  const role = String(req.user?.role || '');
  const authUserId = String(req.user?.id || '');
  if (!authUserId) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
  }
  if (!['coach', 'admin'].includes(role)) {
    throw new AppError('Forbidden', HTTP_STATUS.FORBIDDEN);
  }

  const item = await Appointment.findById(id);
  if (!item) {
    throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND);
  }
  if (String(item.sessionType) === 'nutrition') {
    throw new AppError('Only coach appointments can be delegated', HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
  if (String(item.status) !== 'pending') {
    throw new AppError('Only pending appointments can be delegated', HTTP_STATUS.CONFLICT);
  }

  const [subCoach, actorCoach] = await Promise.all([
    User.findById(subCoachId).select('_id name role coachRole headCoachId status'),
    role === 'coach'
      ? User.findById(authUserId).select('_id name role coachRole status')
      : Promise.resolve(null),
  ]);

  if (!subCoach || subCoach.role !== 'coach' || subCoach.status !== 'active') {
    throw new AppError('Sub-coach not found or inactive', HTTP_STATUS.NOT_FOUND);
  }
  if (String(subCoach.coachRole || 'head').toLowerCase() !== 'sub') {
    throw new AppError('Selected coach is not a sub-coach', HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  const overlap = await Appointment.findOne({
    _id: { $ne: item._id },
    coachId: String(subCoach._id),
    status: { $in: ['pending', 'approved'] },
    startsAt: { $lt: item.endsAt },
    endsAt: { $gt: item.startsAt },
  });
  if (overlap) {
    throw new AppError('Selected sub-coach is already booked in this slot', HTTP_STATUS.CONFLICT);
  }

  const previousCoachId = String(item.coachId || '');
  if (role === 'coach') {
    if (!actorCoach || actorCoach.role !== 'coach') {
      throw new AppError('Coach not found', HTTP_STATUS.NOT_FOUND);
    }
    if (String(actorCoach.coachRole || 'head').toLowerCase() !== 'head') {
      throw new AppError('Only head coaches can delegate appointments', HTTP_STATUS.FORBIDDEN);
    }
    if (String(item.coachId || '') !== authUserId) {
      throw new AppError('You can only delegate your own pending appointments', HTTP_STATUS.FORBIDDEN);
    }
    if (String(subCoach.headCoachId || '') !== authUserId) {
      throw new AppError('You can only delegate to your own sub-coaches', HTTP_STATUS.FORBIDDEN);
    }

    item.coachId = String(subCoach._id);
    item.delegatedByCoachId = String(actorCoach._id);
    item.delegatedByCoachName = String(actorCoach.name || '');
  } else {
    item.coachId = String(subCoach._id);
    item.delegatedByCoachId = String(item.delegatedByCoachId || '');
    item.delegatedByCoachName = String(item.delegatedByCoachName || '');
  }
  item.delegatedAt = new Date();
  await item.save();
  await Promise.allSettled([
    previousCoachId ? assignQueuePosition(previousCoachId) : Promise.resolve(null),
    item.coachId ? assignQueuePosition(item.coachId) : Promise.resolve(null),
  ]);
  if (item.coachId) {
    await assignQueuePosition(item.coachId);
  }

  await Promise.allSettled([
    createNotification({
      recipientId: String(subCoach._id),
      recipientRole: 'coach',
      type: 'booking',
      title: 'Appointment Delegated To You',
      message: `A pending appointment was delegated to you${item.delegatedByCoachName ? ` by ${item.delegatedByCoachName}` : ''}.`,
      entityType: 'appointment',
      entityId: String(item._id),
    }),
    createNotificationForAdmins({
      title: 'Appointment Delegated',
      message: `Appointment ${String(item._id)} was delegated to coach ${subCoach.name}.`,
      entityType: 'appointment',
      entityId: String(item._id),
    }),
  ]);

  res.status(HTTP_STATUS.OK).json({
    message: 'Appointment delegated successfully',
    data: withPriorityFallback(item),
  });
});
