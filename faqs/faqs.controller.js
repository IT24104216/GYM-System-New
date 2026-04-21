import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { createNotificationsForRole } from '../notifications/notifications.service.js';
import { Faq } from './faqs.model.js';
import {
  createFaqSchema,
  deleteFaqSchema,
  faqIdParamsSchema,
  faqQuerySchema,
  updateFaqSchema,
} from './faqs.validation.js';

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

const toDto = (row) => ({
  id: String(row._id),
  question: row.question,
  answer: row.answer,
  authorRole: row.authorRole,
  authorId: row.authorId,
  authorName: row.authorName || '',
  isActive: Boolean(row.isActive),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const getfaqsStatus = (_req, res) => {
  res.json({
    module: 'faqs',
    status: 'ready',
  });
};

export const getFaqs = asyncHandler(async (req, res) => {
  const query = parseOrThrow(faqQuerySchema, req.query || {});
  const filter = {};
  if (query.authorRole) filter.authorRole = query.authorRole;
  if (query.authorId) filter.authorId = query.authorId;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.search) {
    filter.$or = [
      { question: { $regex: query.search, $options: 'i' } },
      { answer: { $regex: query.search, $options: 'i' } },
      { authorName: { $regex: query.search, $options: 'i' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [rows, total] = await Promise.all([
    Faq.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    Faq.countDocuments(filter),
  ]);

  res.status(HTTP_STATUS.OK).json({
    data: rows.map(toDto),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  });
});

export const createFaq = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(createFaqSchema, req.body || {});
  const created = await Faq.create(payload);

  await Promise.allSettled([
    createNotificationsForRole('user', {
      type: 'faq',
      title: 'New FAQ Added',
      message: `A new help answer was published: "${created.question}"`,
      entityType: 'faq',
      entityId: String(created._id),
    }),
  ]);

  res.status(HTTP_STATUS.CREATED).json({
    message: 'FAQ added successfully',
    data: toDto(created),
  });
});

export const updateFaq = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(faqIdParamsSchema, req.params || {});
  const payload = parseOrThrow(updateFaqSchema, req.body || {});
  const row = await Faq.findById(id);
  if (!row) {
    throw new AppError('FAQ not found', HTTP_STATUS.NOT_FOUND);
  }
  if (String(row.authorId) !== String(payload.authorId) || row.authorRole !== payload.authorRole) {
    throw new AppError('Only owner can edit this FAQ', HTTP_STATUS.FORBIDDEN);
  }

  if (payload.question !== undefined) row.question = payload.question;
  if (payload.answer !== undefined) row.answer = payload.answer;
  if (payload.isActive !== undefined) row.isActive = payload.isActive;
  await row.save();

  await Promise.allSettled([
    createNotificationsForRole('user', {
      type: 'faq',
      title: row.isActive ? 'FAQ Updated' : 'FAQ Hidden',
      message: row.isActive
        ? `An FAQ was updated: "${row.question}"`
        : `An FAQ was hidden: "${row.question}"`,
      entityType: 'faq',
      entityId: String(row._id),
    }),
  ]);

  res.status(HTTP_STATUS.OK).json({
    message: 'FAQ updated successfully',
    data: toDto(row),
  });
});

export const deleteFaq = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(faqIdParamsSchema, req.params || {});
  const payload = parseOrThrow(deleteFaqSchema, req.body || {});
  const row = await Faq.findById(id);
  if (!row) {
    throw new AppError('FAQ not found', HTTP_STATUS.NOT_FOUND);
  }
  if (String(row.authorId) !== String(payload.authorId) || row.authorRole !== payload.authorRole) {
    throw new AppError('Only owner can delete this FAQ', HTTP_STATUS.FORBIDDEN);
  }

  const deletedQuestion = row.question;
  await Faq.findByIdAndDelete(id);

  await Promise.allSettled([
    createNotificationsForRole('user', {
      type: 'faq',
      title: 'FAQ Removed',
      message: `An FAQ was removed: "${deletedQuestion}"`,
      entityType: 'faq',
      entityId: String(id),
    }),
  ]);

  res.status(HTTP_STATUS.OK).json({
    message: 'FAQ deleted successfully',
  });
});
