import { z } from 'zod';

const idSchema = z.string().trim().min(1);

export const faqIdParamsSchema = z.object({
  id: idSchema,
});

export const faqQuerySchema = z.object({
  authorRole: z.enum(['coach', 'dietitian', 'admin']).optional(),
  authorId: z.string().trim().min(1).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(50),
});

export const createFaqSchema = z.object({
  question: z.string().trim()
    .min(4, 'Question must be at least 4 characters.')
    .max(220, 'Question must be 220 characters or less.'),
  answer: z.string().trim()
    .min(4, 'Answer must be at least 4 characters.')
    .max(4000, 'Answer must be 4000 characters or less.'),
  authorRole: z.enum(['coach', 'dietitian', 'admin']),
  authorId: idSchema,
  authorName: z.string().trim().max(120).optional().default(''),
  isActive: z.boolean().optional().default(true),
});

export const updateFaqSchema = z.object({
  authorId: idSchema,
  authorRole: z.enum(['coach', 'dietitian', 'admin']),
  question: z.string().trim()
    .min(4, 'Question must be at least 4 characters.')
    .max(220, 'Question must be 220 characters or less.')
    .optional(),
  answer: z.string().trim()
    .min(4, 'Answer must be at least 4 characters.')
    .max(4000, 'Answer must be 4000 characters or less.')
    .optional(),
  isActive: z.boolean().optional(),
}).refine(
  (value) => value.question !== undefined || value.answer !== undefined || value.isActive !== undefined,
  { message: 'At least one field is required to update' },
);

export const deleteFaqSchema = z.object({
  authorId: idSchema,
  authorRole: z.enum(['coach', 'dietitian', 'admin']),
});
