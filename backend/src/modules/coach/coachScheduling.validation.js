import { z } from 'zod';

const idSchema = z.string().trim().min(1, 'is required');
const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');
const timeSchema = z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'must be HH:mm');

export const coachIdParamsSchema = z.object({
  coachId: idSchema,
});

export const slotIdParamsSchema = z.object({
  coachId: idSchema,
  slotId: idSchema,
});

export const createCoachSlotSchema = z.object({
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  sessionType: z.enum(['In-Person', 'Online', 'Hybrid']).default('In-Person'),
  notes: z.string().trim().max(500).optional().default(''),
});

export const updateCoachSlotSchema = z.object({
  date: dateSchema.optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  sessionType: z.enum(['In-Person', 'Online', 'Hybrid']).optional(),
  notes: z.string().trim().max(500).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required for update' },
);
