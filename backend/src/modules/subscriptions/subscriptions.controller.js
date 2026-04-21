import mongoose from 'mongoose';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { User } from '../users/users.model.js';
import { Subscription } from './subscriptions.model.js';
import {
  createSubscriptionSchema,
  grantSubscriptionSchema,
  renewSubscriptionSchema,
  toggleAutoRenewSchema,
  userIdParamsSchema,
} from './subscriptions.validation.js';

const PLAN_MONTHS = {
  '3month': 3,
  '6month': 6,
  '12month': 12,
};

const USD_TO_LKR_RATE = 315.5;
const MONTHLY_RATES = {
  // Converted from original USD catalog using USD_TO_LKR_RATE.
  '3month': Number((29.99 * USD_TO_LKR_RATE).toFixed(2)),
  '6month': Number((24.99 * USD_TO_LKR_RATE).toFixed(2)),
  '12month': Number((19.99 * USD_TO_LKR_RATE).toFixed(2)),
};

const parseOrThrow = (schema, payload) => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new AppError(
      'Validation failed',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      result.error.flatten(),
    );
  }
  return result.data;
};

const toObjectIdOrThrow = (rawId) => {
  const safe = String(rawId || '').trim();
  if (!mongoose.isValidObjectId(safe)) {
    throw new AppError('Invalid user id', HTTP_STATUS.BAD_REQUEST);
  }
  return new mongoose.Types.ObjectId(safe);
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const toAmount = (planType) => {
  const monthly = Number(MONTHLY_RATES[planType] || 0);
  const months = Number(PLAN_MONTHS[planType] || 0);
  return Number((monthly * months).toFixed(2));
};

const maybeConvertLegacyUsdAmounts = async (subscription) => {
  if (!subscription) return subscription;

  let changed = false;
  const legacyThreshold = 1000;

  const currentPrice = Number(subscription.price || 0);
  if (currentPrice > 0 && currentPrice < legacyThreshold) {
    subscription.price = Number((currentPrice * USD_TO_LKR_RATE).toFixed(2));
    changed = true;
  }

  if (Array.isArray(subscription.paymentHistory) && subscription.paymentHistory.length) {
    subscription.paymentHistory = subscription.paymentHistory.map((entry) => {
      const amount = Number(entry?.amount || 0);
      if (amount > 0 && amount < legacyThreshold) {
        changed = true;
        return {
          ...entry,
          amount: Number((amount * USD_TO_LKR_RATE).toFixed(2)),
        };
      }
      return entry;
    });
  }

  if (changed) {
    await subscription.save();
  }

  return subscription;
};

const ensureFreshStatus = async (subscription) => {
  if (!subscription) return null;
  await maybeConvertLegacyUsdAmounts(subscription);
  if (subscription.status !== 'active') return subscription;
  if (new Date(subscription.endDate).getTime() >= Date.now()) return subscription;
  subscription.status = 'expired';
  await subscription.save();
  return subscription;
};

const toDto = (subscription) => {
  if (!subscription) return null;
  return {
    id: String(subscription._id),
    userId: String(subscription.userId),
    planType: subscription.planType,
    price: Number(subscription.price || 0),
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    status: subscription.status,
    autoRenew: Boolean(subscription.autoRenew),
    paymentHistory: (Array.isArray(subscription.paymentHistory) ? subscription.paymentHistory : []).map((item) => ({
      date: item.date,
      amount: Number(item.amount || 0),
      method: item.method,
      last4: item.last4,
    })),
  };
};

const applyPlan = ({
  existing,
  planType,
  paymentMethod,
  last4,
  startsAt,
}) => {
  const now = startsAt || new Date();
  const startDate = new Date(now);
  const endDate = addMonths(startDate, PLAN_MONTHS[planType]);
  const price = toAmount(planType);
  const paymentEntry = {
    date: now,
    amount: price,
    method: paymentMethod,
    last4,
  };

  if (!existing) {
    return {
      planType,
      price,
      startDate,
      endDate,
      status: 'active',
      autoRenew: true,
      paymentHistory: [paymentEntry],
    };
  }

  const history = Array.isArray(existing.paymentHistory) ? [...existing.paymentHistory] : [];
  history.push(paymentEntry);

  return {
    planType,
    price,
    startDate,
    endDate,
    status: 'active',
    autoRenew: true,
    paymentHistory: history,
  };
};

export const getsubscriptionsStatus = (_req, res) => {
  res.json({
    module: 'subscriptions',
    status: 'ready',
  });
};

export const createSubscription = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(createSubscriptionSchema, req.body || {});
  const userObjectId = toObjectIdOrThrow(req.user?.id);

  const member = await User.findById(userObjectId).select('_id role');
  if (!member || member.role !== 'user') {
    throw new AppError('Member account not found', HTTP_STATUS.NOT_FOUND);
  }

  const existing = await Subscription.findOne({ userId: userObjectId });
  const fresh = await ensureFreshStatus(existing);
  if (fresh?.status === 'active') {
    throw new AppError('You already have an active subscription plan', HTTP_STATUS.CONFLICT);
  }

  const nextState = applyPlan({
    existing: fresh,
    planType: payload.planType,
    paymentMethod: payload.paymentMethod,
    last4: payload.last4,
    startsAt: new Date(),
  });

  const saved = await Subscription.findOneAndUpdate(
    { userId: userObjectId },
    { $set: { ...nextState, userId: userObjectId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  res.status(HTTP_STATUS.CREATED).json({
    message: 'Subscription activated successfully',
    data: toDto(saved),
  });
});

export const getMySubscription = asyncHandler(async (req, res) => {
  const userObjectId = toObjectIdOrThrow(req.user?.id);
  const existing = await Subscription.findOne({ userId: userObjectId });
  const fresh = await ensureFreshStatus(existing);

  res.status(HTTP_STATUS.OK).json({
    data: toDto(fresh),
  });
});

export const renewSubscription = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(renewSubscriptionSchema, req.body || {});
  const userObjectId = toObjectIdOrThrow(req.user?.id);

  const member = await User.findById(userObjectId).select('_id role');
  if (!member || member.role !== 'user') {
    throw new AppError('Member account not found', HTTP_STATUS.NOT_FOUND);
  }

  const existing = await Subscription.findOne({ userId: userObjectId });
  const fresh = await ensureFreshStatus(existing);

  if (!fresh) {
    throw new AppError('No subscription found to renew', HTTP_STATUS.NOT_FOUND);
  }

  const now = new Date();
  const startsAt = fresh.status === 'active' && new Date(fresh.endDate).getTime() > now.getTime()
    ? new Date(fresh.endDate)
    : now;
  const nextEnd = addMonths(startsAt, PLAN_MONTHS[payload.planType]);
  const price = toAmount(payload.planType);

  fresh.planType = payload.planType;
  fresh.price = price;
  fresh.startDate = startsAt;
  fresh.endDate = nextEnd;
  fresh.status = 'active';
  fresh.paymentHistory = [
    ...(Array.isArray(fresh.paymentHistory) ? fresh.paymentHistory : []),
    {
      date: now,
      amount: price,
      method: payload.paymentMethod,
      last4: payload.last4,
    },
  ];
  await fresh.save();

  res.status(HTTP_STATUS.OK).json({
    message: 'Subscription renewed successfully',
    data: toDto(fresh),
  });
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const userObjectId = toObjectIdOrThrow(req.user?.id);
  const existing = await Subscription.findOne({ userId: userObjectId });
  const fresh = await ensureFreshStatus(existing);
  if (!fresh) {
    throw new AppError('No subscription found', HTTP_STATUS.NOT_FOUND);
  }

  fresh.status = 'cancelled';
  fresh.autoRenew = false;
  await fresh.save();

  res.status(HTTP_STATUS.OK).json({
    message: 'Subscription cancelled successfully',
    data: toDto(fresh),
  });
});

export const toggleAutoRenew = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(toggleAutoRenewSchema, req.body || {});
  const userObjectId = toObjectIdOrThrow(req.user?.id);

  const existing = await Subscription.findOne({ userId: userObjectId });
  const fresh = await ensureFreshStatus(existing);
  if (!fresh) {
    throw new AppError('No subscription found', HTTP_STATUS.NOT_FOUND);
  }
  if (fresh.status === 'cancelled') {
    throw new AppError('Cancelled subscription cannot enable auto-renew', HTTP_STATUS.CONFLICT);
  }

  fresh.autoRenew = payload.autoRenew;
  await fresh.save();

  res.status(HTTP_STATUS.OK).json({
    message: 'Auto-renew preference updated',
    data: toDto(fresh),
  });
});

export const grantSubscription = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(grantSubscriptionSchema, req.body || {});
  const targetUserId = toObjectIdOrThrow(payload.userId);

  const member = await User.findById(targetUserId).select('_id role');
  if (!member || member.role !== 'user') {
    throw new AppError('Member account not found', HTTP_STATUS.NOT_FOUND);
  }

  const existing = await Subscription.findOne({ userId: targetUserId });
  const fresh = await ensureFreshStatus(existing);

  const nextState = applyPlan({
    existing: fresh,
    planType: payload.planType,
    paymentMethod: payload.paymentMethod || 'cash',
    last4: payload.last4 || 'CASH',
    startsAt: new Date(),
  });

  const saved = await Subscription.findOneAndUpdate(
    { userId: targetUserId },
    { $set: { ...nextState, userId: targetUserId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  res.status(HTTP_STATUS.OK).json({
    message: 'Subscription granted successfully',
    data: toDto(saved),
  });
});

export const getUserSubscription = asyncHandler(async (req, res) => {
  const { userId } = parseOrThrow(userIdParamsSchema, req.params || {});
  const targetUserId = toObjectIdOrThrow(userId);
  const existing = await Subscription.findOne({ userId: targetUserId });
  const fresh = await ensureFreshStatus(existing);

  res.status(HTTP_STATUS.OK).json({
    data: toDto(fresh),
  });
});
