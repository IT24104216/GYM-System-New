import { z } from 'zod';

const PLACEMENTS = ['Dashboard Hero', 'Promotions Page'];

const urlOrEmptySchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .default('')
  .refine((value) => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, { message: 'link must be a valid URL' });

const promotionFieldsSchema = z.object({
  title: z.string().trim().min(1).max(140),
  placement: z.enum(PLACEMENTS),
  target: z.string().trim().min(1).max(120),
  status: z.enum(['ACTIVE', 'DRAFT', 'PAUSED']).optional().default('DRAFT'),
  budget: z.coerce.number().finite().gt(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  link: urlOrEmptySchema,
  description: z.string().trim().max(1200).optional().default(''),
  image: z.string().trim().max(5000000).optional().default(''),
});

const basePromotionSchema = promotionFieldsSchema.superRefine((data, ctx) => {
  if (data.endDate < data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'endDate must be later than or equal to startDate',
    });
  }
});

export const createPromotionSchema = basePromotionSchema;

export const updatePromotionSchema = promotionFieldsSchema.partial().superRefine((data, ctx) => {
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'endDate must be later than or equal to startDate',
    });
  }
});

export const promotionIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const promotionQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'DRAFT', 'PAUSED']).optional(),
  placement: z.enum(PLACEMENTS).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

export const publicPromotionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).optional().default(3),
  placement: z.enum(PLACEMENTS).optional(),
});
