import { z } from 'zod';
import { BRANCH_OPTIONS } from '../../shared/constants/branches.js';

const objectId = z.string().trim().min(1);

export const lockersQuerySchema = z.object({
  branch: z.enum(BRANCH_OPTIONS).optional(),
  status: z.enum(['available', 'unavailable']).optional(),
  search: z.string().trim().max(60).optional(),
});

export const lockerIdParamsSchema = z.object({
  id: objectId,
});

export const createLockerSchema = z.object({
  branch: z.enum(BRANCH_OPTIONS),
  code: z.string().trim().min(1).max(30),
  section: z.string().trim().max(120).optional().default(''),
  status: z.enum(['available', 'unavailable']).optional().default('available'),
  notes: z.string().trim().max(500).optional().default(''),
});

export const updateLockerSchema = z.object({
  branch: z.enum(BRANCH_OPTIONS).optional(),
  code: z.string().trim().min(1).max(30).optional(),
  section: z.string().trim().max(120).optional(),
  status: z.enum(['available', 'unavailable']).optional(),
  notes: z.string().trim().max(500).optional(),
  bookedByUserId: z.string().trim().max(64).optional(),
  bookedByName: z.string().trim().max(120).optional(),
}).refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' },
);

export const createLockerBookingSchema = z.object({
  lockerId: objectId,
  userId: objectId,
  userName: z.string().trim().min(2).max(120),
  userEmail: z.string().trim().email().optional().default(''),
  message: z.string().trim().max(500).optional().default(''),
});

export const bookingQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  branch: z.enum(BRANCH_OPTIONS).optional(),
  userId: objectId.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(60),
});

export const bookingIdParamsSchema = z.object({
  id: objectId,
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminMessage: z.string().trim().max(500).optional().default(''),
});
