import { User } from '../users/users.model.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Appointment } from '../appointments/appointments.model.js';
import { CoachProfile } from '../coach/coachProfile.model.js';
import { DietitianProfile } from '../dietitian/dietitianProfile.model.js';
import { Subscription } from '../subscriptions/subscriptions.model.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { AppError } from '../../shared/errors/AppError.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { formatTrend, getMonthRange, REPORT_MONTHS, toUserDto } from './admin.utils.js';

const ROLE_SET = new Set(['user', 'coach', 'dietitian', 'admin']);
const STATUS_SET = new Set(['active', 'inactive', 'suspended']);
const COACH_ROLE_SET = new Set(['head', 'sub']);
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;
const LEGACY_USD_TO_LKR_RATE = 315.5;
const LEGACY_PRICE_THRESHOLD = 1000;

const adminSettingsSchema = z.object({
  adminId: z.string().trim().min(1),
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
});

const adminPasswordSchema = z.object({
  adminId: z.string().trim().min(1),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
  confirmPassword: z.string().min(1),
}).superRefine((value, ctx) => {
  if (!PASSWORD_RULE.test(value.newPassword)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'New password must include uppercase, lowercase, and a number.',
      path: ['newPassword'],
    });
  }
  if (value.newPassword !== value.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'New password and confirm password do not match.',
      path: ['confirmPassword'],
    });
  }
});

function parseOrThrow(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new AppError(
      'Validation failed',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      result.error.flatten()
    );
  }
  return result.data;
}

async function getAdminByIdOrThrow(adminId) {
  if (!mongoose.isValidObjectId(adminId)) {
    throw new AppError('Invalid admin id', HTTP_STATUS.BAD_REQUEST);
  }

  const admin = await User.findById(adminId);
  if (!admin || admin.role !== 'admin') {
    throw new AppError('Admin not found', HTTP_STATUS.NOT_FOUND);
  }

  return admin;
}

export const getAdminStatus = (_req, res) => {
  res.json({
    module: 'admin',
    status: 'ready',
  });
};

export const getAdminSettings = asyncHandler(async (req, res) => {
  const adminId = String(req.query.adminId || '').trim();
  if (!adminId) {
    throw new AppError('adminId is required', HTTP_STATUS.BAD_REQUEST);
  }

  const admin = await getAdminByIdOrThrow(adminId);
  const prefs = admin.notificationPreferences || {};

  res.status(HTTP_STATUS.OK).json({
    data: {
      adminId: String(admin._id),
      fullName: admin.name,
      email: admin.email,
      emailNotifications: prefs.email ?? true,
      pushNotifications: prefs.push ?? true,
    },
  });
});

export const updateAdminSettings = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(adminSettingsSchema, req.body);
  const admin = await getAdminByIdOrThrow(payload.adminId);

  if (admin.email !== payload.email.toLowerCase()) {
    const existing = await User.findOne({
      email: payload.email.toLowerCase(),
      _id: { $ne: admin._id },
    });
    if (existing) {
      throw new AppError('Email is already in use', HTTP_STATUS.CONFLICT);
    }
  }

  admin.name = payload.fullName;
  admin.email = payload.email.toLowerCase();
  admin.notificationPreferences = {
    email: payload.emailNotifications,
    push: payload.pushNotifications,
  };
  await admin.save();

  res.status(HTTP_STATUS.OK).json({
    message: 'Admin settings updated successfully',
    data: {
      adminId: String(admin._id),
      fullName: admin.name,
      email: admin.email,
      emailNotifications: admin.notificationPreferences?.email ?? true,
      pushNotifications: admin.notificationPreferences?.push ?? true,
    },
  });
});

export const changeAdminPassword = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(adminPasswordSchema, req.body);
  const admin = await getAdminByIdOrThrow(payload.adminId);

  const isCurrentPasswordValid = await bcrypt.compare(
    payload.currentPassword,
    admin.passwordHash
  );
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', HTTP_STATUS.UNAUTHORIZED);
  }

  const isSamePassword = await bcrypt.compare(
    payload.newPassword,
    admin.passwordHash
  );
  if (isSamePassword) {
    throw new AppError(
      'New password must be different from current password',
      HTTP_STATUS.CONFLICT
    );
  }

  admin.passwordHash = await bcrypt.hash(payload.newPassword, 10);
  await admin.save();

  res.status(HTTP_STATUS.OK).json({
    message: 'Password updated successfully',
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const role = String(req.query.role || '').trim().toLowerCase();
  const status = String(req.query.status || '').trim().toLowerCase();

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { branchUserId: { $regex: search, $options: 'i' } },
      { branch: { $regex: search, $options: 'i' } },
    ];
  }
  if (role && ROLE_SET.has(role)) {
    filter.role = role;
  }
  if (status && STATUS_SET.has(status)) {
    filter.status = status;
  }

  const users = await User.find(filter)
    .populate('headCoachId', 'name email role coachRole')
    .sort({ createdAt: -1 });

  res.status(HTTP_STATUS.OK).json({
    data: users.map(toUserDto),
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('headCoachId', 'name email role coachRole');
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    data: toUserDto(user),
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  const nextRole = String(req.body?.role || '').trim().toLowerCase();
  const nextStatus = String(req.body?.status || '').trim().toLowerCase();
  const nextCoachRoleRaw = String(req.body?.coachRole || '').trim().toLowerCase();
  const nextHeadCoachIdRaw = String(req.body?.headCoachId || '').trim();

  if (nextRole) {
    if (!ROLE_SET.has(nextRole)) {
      throw new AppError('Invalid role value', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
    if (user.role !== nextRole) {
      user.role = nextRole;
      user.roleChangedAt = new Date();
      if (nextRole !== 'coach') {
        user.coachRole = 'head';
        user.headCoachId = null;
      }
    }
  }

  if (nextStatus) {
    if (!STATUS_SET.has(nextStatus)) {
      throw new AppError('Invalid status value', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
    user.status = nextStatus;
  }

  if (req.body?.name) {
    user.name = String(req.body.name).trim();
  }

  if (nextCoachRoleRaw) {
    if (user.role !== 'coach') {
      throw new AppError('coachRole can be set only for coach users', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
    if (!COACH_ROLE_SET.has(nextCoachRoleRaw)) {
      throw new AppError('Invalid coachRole value', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
    user.coachRole = nextCoachRoleRaw;
    if (nextCoachRoleRaw === 'head') {
      user.headCoachId = null;
    }
  }

  if (nextHeadCoachIdRaw || req.body?.headCoachId === null || req.body?.headCoachId === '') {
    if (user.role !== 'coach') {
      // Non-coach role transitions can send null/empty headCoachId from UI reset payloads.
      // Ignore empty reset values, but still reject explicit non-empty values.
      if (nextHeadCoachIdRaw) {
        throw new AppError('headCoachId can be set only for coach users', HTTP_STATUS.UNPROCESSABLE_ENTITY);
      }
    } else {
      if (!nextHeadCoachIdRaw) {
        user.headCoachId = null;
      } else {
        if (!mongoose.isValidObjectId(nextHeadCoachIdRaw)) {
          throw new AppError('Invalid headCoachId', HTTP_STATUS.BAD_REQUEST);
        }
        if (String(user._id) === nextHeadCoachIdRaw) {
          throw new AppError('A coach cannot report to themselves', HTTP_STATUS.UNPROCESSABLE_ENTITY);
        }
        const headCoach = await User.findById(nextHeadCoachIdRaw);
        if (!headCoach || headCoach.role !== 'coach') {
          throw new AppError('Head coach not found', HTTP_STATUS.NOT_FOUND);
        }
        const headCoachRole = String(headCoach.coachRole || 'head').toLowerCase();
        if (headCoachRole !== 'head') {
          throw new AppError('Selected head coach must have coachRole=head', HTTP_STATUS.UNPROCESSABLE_ENTITY);
        }
        user.headCoachId = headCoach._id;
        user.coachRole = 'sub';
      }
    }
  }

  if (user.role === 'coach') {
    const normalizedCoachRole = String(user.coachRole || 'head').toLowerCase();
    if (normalizedCoachRole === 'sub' && !user.headCoachId) {
      throw new AppError('Sub-coach must have a headCoachId', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
  }

  await user.save();
  await user.populate('headCoachId', 'name email role coachRole');

  res.status(HTTP_STATUS.OK).json({
    message: 'User updated successfully',
    data: toUserDto(user),
  });
});

export const getSubCoaches = async (headCoachId) => {
  const safeHeadCoachId = String(headCoachId || '').trim();
  if (!safeHeadCoachId || !mongoose.isValidObjectId(safeHeadCoachId)) {
    return [];
  }
  return User.find({
    role: 'coach',
    coachRole: 'sub',
    headCoachId: safeHeadCoachId,
  })
    .select('_id name email coachRole headCoachId status')
    .sort({ name: 1 })
    .lean();
};

export const deleteUser = asyncHandler(async (req, res) => {
  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    message: 'User deleted successfully',
  });
});

export const getAdminStats = asyncHandler(async (_req, res) => {
  const [total, staff, diet, verified, activeCoaches, pendingReviews] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: { $in: ['coach', 'admin'] } }),
    User.countDocuments({ role: 'dietitian' }),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'coach', status: 'active' }),
    Appointment.countDocuments({ status: 'pending' }),
  ]);

  let mealPlans = 0;
  const db = mongoose.connection?.db;
  if (db) {
    try {
      mealPlans = await db.collection('mealplans').countDocuments();
    } catch {
      mealPlans = 0;
    }
  }

  res.status(HTTP_STATUS.OK).json({
    data: {
      total,
      staff,
      diet,
      verified,
      activeCoaches,
      mealPlans,
      pendingReviews,
    },
  });
});

export const getAdminReportsOverview = asyncHandler(async (_req, res) => {
  const legacyRows = await Subscription.find({
    $or: [
      { price: { $gt: 0, $lt: LEGACY_PRICE_THRESHOLD } },
      { 'paymentHistory.amount': { $gt: 0, $lt: LEGACY_PRICE_THRESHOLD } },
    ],
  }).select('_id price paymentHistory').lean();

  if (legacyRows.length) {
    await Promise.all(legacyRows.map(async (row) => {
      const nextPrice = Number(row.price || 0) > 0 && Number(row.price || 0) < LEGACY_PRICE_THRESHOLD
        ? Number((Number(row.price) * LEGACY_USD_TO_LKR_RATE).toFixed(2))
        : Number(row.price || 0);
      const nextHistory = (Array.isArray(row.paymentHistory) ? row.paymentHistory : []).map((entry) => {
        const amount = Number(entry?.amount || 0);
        if (amount > 0 && amount < LEGACY_PRICE_THRESHOLD) {
          return { ...entry, amount: Number((amount * LEGACY_USD_TO_LKR_RATE).toFixed(2)) };
        }
        return entry;
      });

      await Subscription.updateOne(
        { _id: row._id },
        { $set: { price: nextPrice, paymentHistory: nextHistory } },
      );
    }));
  }

  const months = getMonthRange(REPORT_MONTHS);
  const startDate = months[0].start;

  const [
    totalMembers,
    activeMembers,
    totalSubscriptionRevenue,
    subscriptionRevenueByMonth,
    newUsersByMonth,
    coachRatings,
    dietitianRatings,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', status: 'active' }),
    Subscription.aggregate([
      { $unwind: '$paymentHistory' },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$paymentHistory.amount', 0] } },
        },
      },
    ]),
    Subscription.aggregate([
      { $unwind: '$paymentHistory' },
      {
        $match: {
          'paymentHistory.date': { $gte: startDate },
        },
      },
      {
        $project: {
          ym: { $dateToString: { format: '%Y-%m', date: '$paymentHistory.date' } },
          amount: { $ifNull: ['$paymentHistory.amount', 0] },
        },
      },
      {
        $group: {
          _id: '$ym',
          revenue: { $sum: '$amount' },
        },
      },
    ]),
    User.aggregate([
      {
        $match: {
          role: 'user',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
    CoachProfile.find({ rating: { $gt: 0 } }).select('rating').lean(),
    DietitianProfile.find({ rating: { $gt: 0 } }).select('rating').lean(),
  ]);

  const revenueByMonth = new Map(subscriptionRevenueByMonth.map((row) => [row._id, Number(row.revenue || 0)]));
  const usersByMonth = new Map(newUsersByMonth.map((row) => [row._id, Number(row.count || 0)]));

  const revenueTrend = months.map((m) => ({
    month: m.label,
    value: Math.round(revenueByMonth.get(m.key) || 0),
  }));

  let runningUsers = 0;
  const userGrowth = months.map((m) => {
    runningUsers += Number(usersByMonth.get(m.key) || 0);
    return {
      month: m.label,
      value: runningUsers,
    };
  });

  const totalRevenue = Number(totalSubscriptionRevenue?.[0]?.total || 0);
  const firstRevenueHalf = revenueTrend.slice(0, Math.floor(revenueTrend.length / 2))
    .reduce((sum, item) => sum + Number(item.value || 0), 0);
  const secondRevenueHalf = revenueTrend.slice(Math.floor(revenueTrend.length / 2))
    .reduce((sum, item) => sum + Number(item.value || 0), 0);
  const revenueTrendPct = formatTrend(secondRevenueHalf, firstRevenueHalf);

  const currentUsers = userGrowth[userGrowth.length - 1]?.value || 0;
  const previousUsers = userGrowth[userGrowth.length - 2]?.value || 0;
  const activeMembersTrend = formatTrend(currentUsers, previousUsers || 1);

  const retentionRate = totalMembers ? Number(((activeMembers / totalMembers) * 100).toFixed(1)) : 0;
  const retentionTrend = formatTrend(retentionRate, Math.max(retentionRate - 3, 1));

  const ratingList = [...coachRatings, ...dietitianRatings]
    .map((r) => Number(r.rating || 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  const avgSatisfaction = ratingList.length
    ? Number((ratingList.reduce((s, n) => s + n, 0) / ratingList.length).toFixed(1))
    : 0;
  const satisfactionTrend = formatTrend(avgSatisfaction, Math.max(avgSatisfaction - 0.2, 0.1));

  res.status(HTTP_STATUS.OK).json({
    data: {
      kpis: {
        totalRevenue: { value: totalRevenue, trend: revenueTrendPct },
        activeMembers: { value: activeMembers, trend: activeMembersTrend },
        retentionRate: { value: retentionRate, trend: retentionTrend },
        avgSatisfaction: { value: avgSatisfaction, trend: satisfactionTrend },
      },
      charts: {
        revenueTrend,
        userGrowth,
      },
    },
  });
});
