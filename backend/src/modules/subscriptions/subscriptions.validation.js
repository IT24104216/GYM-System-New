import { z } from 'zod';

const planTypeSchema = z.enum(['3month', '6month', '12month']);

const objectIdLikeSchema = z.string().trim().min(1);

export const createSubscriptionSchema = z.object({
  planType: planTypeSchema,
  paymentMethod: z.string().trim().max(40).optional().default('card'),
  last4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'last4 must be 4 digits')
    .optional()
    .default('0000'),
});

export const renewSubscriptionSchema = createSubscriptionSchema;

export const toggleAutoRenewSchema = z.object({
  autoRenew: z.boolean(),
});

export const grantSubscriptionSchema = z.object({
  userId: objectIdLikeSchema,
  planType: planTypeSchema,
  paymentMethod: z.string().trim().max(40).optional().default('cash'),
  last4: z.string().trim().max(8).optional().default('CASH'),
});

export const userIdParamsSchema = z.object({
  userId: objectIdLikeSchema,
});
