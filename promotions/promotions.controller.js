import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { Promotion } from './promotions.model.js';
import {
  createNotificationForAdmins,
  createNotificationsForRole,
} from '../notifications/notifications.service.js';
import {
  createPromotionSchema,
  promotionIdParamsSchema,
  promotionQuerySchema,
  publicPromotionQuerySchema,
  updatePromotionSchema,
} from './promotions.validation.js';

const normalizePlacement = (placement = '') => {
  if (placement === 'Dashboard Hero' || placement === 'Member App Banner') return 'Dashboard Hero';
  if (placement === 'Promotions Page') return 'Promotions Page';
  if (placement === 'PT Booking Page' || placement === 'Class Schedule Page' || placement === 'Email Footer') {
    return 'Promotions Page';
  }
  return 'Promotions Page';
};

const dbPlacementValues = (placement) => {
  if (placement === 'Dashboard Hero') return ['Dashboard Hero', 'Member App Banner'];
  if (placement === 'Promotions Page') {
    return ['Promotions Page', 'PT Booking Page', 'Class Schedule Page', 'Email Footer'];
  }
  return [];
};

const isHomepagePlacement = (placement = '') => normalizePlacement(placement) === 'Dashboard Hero';

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

const toDto = (doc) => ({
  id: String(doc._id),
  title: doc.title,
  placement: normalizePlacement(doc.placement),
  target: doc.target,
  status: doc.status,
  budget: Number(doc.budget || 0),
  startDate: doc.startDate ? new Date(doc.startDate).toISOString().slice(0, 10) : '',
  endDate: doc.endDate ? new Date(doc.endDate).toISOString().slice(0, 10) : '',
  link: doc.link || '',
  description: doc.description || '',
  image: doc.image || '',
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const getPromotionsStatus = (_req, res) => {
  res.json({ module: 'promotions', status: 'ready' });
};

export const getPromotions = asyncHandler(async (req, res) => {
  const query = parseOrThrow(promotionQuerySchema, req.query || {});
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.placement) filter.placement = { $in: dbPlacementValues(query.placement) };

  const promotions = await Promotion.find(filter)
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(query.limit);

  res.status(HTTP_STATUS.OK).json({
    data: promotions.map(toDto),
  });
});

export const createPromotion = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(createPromotionSchema, req.body || {});
  const created = await Promotion.create(payload);

  if (created.status === 'ACTIVE') {
    const homepagePromo = isHomepagePlacement(created.placement);
    await Promise.allSettled([
      createNotificationsForRole('user', {
        type: 'promotion',
        title: 'New Free Offer Available',
        message: `${created.title} is now live. Check latest offers in Promotions.`,
        entityType: homepagePromo ? 'promotion-homepage' : 'promotion',
        entityId: String(created._id),
        actionUrl: homepagePromo ? (created.link || '') : '',
      }),
      createNotificationForAdmins({
        title: 'Promotion Activated',
        message: `${created.title} was published for users.`,
        entityType: 'promotion',
        entityId: String(created._id),
      }),
    ]);
  }

  res.status(HTTP_STATUS.CREATED).json({
    message: 'Promotion created successfully',
    data: toDto(created),
  });
});

export const updatePromotion = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(promotionIdParamsSchema, req.params || {});
  const payload = parseOrThrow(updatePromotionSchema, req.body || {});

  const promotion = await Promotion.findById(id);
  if (!promotion) {
    throw new AppError('Promotion not found', HTTP_STATUS.NOT_FOUND);
  }

  if (payload.startDate && !payload.endDate && promotion.endDate && payload.startDate > promotion.endDate) {
    throw new AppError('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, {
      fieldErrors: { startDate: ['startDate must be earlier than endDate'] },
    });
  }
  if (payload.endDate && !payload.startDate && promotion.startDate && payload.endDate < promotion.startDate) {
    throw new AppError('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, {
      fieldErrors: { endDate: ['endDate must be later than startDate'] },
    });
  }

  Object.assign(promotion, payload);
  await promotion.save();

  if (promotion.status === 'ACTIVE') {
    const homepagePromo = isHomepagePlacement(promotion.placement);
    await Promise.allSettled([
      createNotificationsForRole('user', {
        type: 'promotion',
        title: 'New Free Offer Available',
        message: `${promotion.title} is now live. Check latest offers in Promotions.`,
        entityType: homepagePromo ? 'promotion-homepage' : 'promotion',
        entityId: String(promotion._id),
        actionUrl: homepagePromo ? (promotion.link || '') : '',
      }),
      createNotificationForAdmins({
        title: 'Promotion Updated',
        message: `${promotion.title} was updated while active.`,
        entityType: 'promotion',
        entityId: String(promotion._id),
      }),
    ]);
  }

  res.status(HTTP_STATUS.OK).json({
    message: 'Promotion updated successfully',
    data: toDto(promotion),
  });
});

export const deletePromotion = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(promotionIdParamsSchema, req.params || {});
  const deleted = await Promotion.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError('Promotion not found', HTTP_STATUS.NOT_FOUND);
  }
  res.status(HTTP_STATUS.OK).json({ message: 'Promotion deleted successfully' });
});

export const getPublicPromotions = asyncHandler(async (req, res) => {
  const { limit, placement } = parseOrThrow(publicPromotionQuerySchema, req.query || {});
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);
  const placementFilterValues = placement ? dbPlacementValues(placement) : [];

  const placementFilter = placementFilterValues.length
    ? { placement: { $in: placementFilterValues } }
    : {};

  let promotions = await Promotion.find({
    status: 'ACTIVE',
    startDate: { $lte: dayEnd },
    endDate: { $gte: dayStart },
    ...placementFilter,
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(limit);

  if (!promotions.length) {
    promotions = await Promotion.find({ status: 'ACTIVE', ...placementFilter })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit);
  }

  if (!promotions.length) {
    promotions = await Promotion.find({ ...placementFilter })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit);
  }

  res.status(HTTP_STATUS.OK).json({
    data: promotions.map(toDto),
  });
});
