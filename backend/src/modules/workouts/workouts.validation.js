import { z } from 'zod';

const idSchema = z
  .union([
    z.string({ required_error: 'is required' }).trim().min(1, 'is required'),
    z.coerce.number({ required_error: 'is required' }).int().nonnegative(),
  ])
  .transform((value) => String(value));

const exerciseSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(120),
  amount: z.string().trim().min(1, 'amount is required').max(80),
  description: z.string().trim().max(1000).optional().default(''),
  assignedMinutes: z.coerce.number().int().min(1).max(600).optional().default(45),
  sourceType: z.enum(['manual', 'category']).optional().default('manual'),
  suggestionKey: z.string().trim().max(120).optional().default(''),
});

const programDaySchema = z.object({
  dayNumber: z.coerce.number().int().min(1),
  date: z.string().trim().min(1),
  isRest: z.boolean().optional().default(false),
  title: z.string().trim().max(150).optional().default(''),
  muscles: z.string().trim().max(200).optional().default(''),
  durationMinutes: z.coerce.number().int().min(1).max(600).optional().default(45),
  level: z.string().trim().max(80).optional().default('Coach Plan'),
  rating: z.coerce.number().min(0).max(5).optional().default(4.7),
  exerciseIndexes: z.array(z.coerce.number().int().min(0)).optional().default([]),
  assigned: z.boolean().optional().default(false),
  assignedAt: z.union([z.string().trim(), z.date()]).optional().nullable(),
  assignedExerciseIndexes: z.array(z.coerce.number().int().min(0)).optional().default([]),
  done: z.boolean().optional().default(false),
});

export const workoutQuerySchema = z.object({
  coachId: idSchema.optional(),
  userId: idSchema.optional(),
  submitted: z
    .union([
      z.boolean(),
      z.enum(['true', 'false']).transform((v) => v === 'true'),
    ])
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

export const createWorkoutPlanSchema = z.object({
  coachId: idSchema,
  userId: idSchema,
  appointmentId: z.string().trim().optional().default(''),
  planTitle: z.string().trim().min(1, 'planTitle is required').max(150),
  planNote: z.string().trim().max(1000).optional().default(''),
  planDurationMinutes: z.coerce.number().int().min(1).max(600).optional().default(45),
  durationDays: z.coerce.number().int().refine((value) => value === 30 || value === 60, {
    message: 'durationDays must be 30 or 60',
  }).optional().default(30),
  daysPerWeek: z.coerce.number().int().min(1).max(7).optional().default(4),
  startDate: z.string().trim().optional().default(''),
  builderType: z.enum(['template']).optional().default('template'),
  templateKey: z.string().trim().max(120).optional().default(''),
  exercises: z.array(exerciseSchema).min(1, 'at least one exercise is required'),
  programDays: z.array(programDaySchema).optional().default([]),
});

export const updateWorkoutPlanSchema = z.object({
  planTitle: z.string().trim().min(1).max(150).optional(),
  planNote: z.string().trim().max(1000).optional(),
  planDurationMinutes: z.coerce.number().int().min(1).max(600).optional(),
  durationDays: z.coerce.number().int().refine((value) => value === 30 || value === 60, {
    message: 'durationDays must be 30 or 60',
  }).optional(),
  daysPerWeek: z.coerce.number().int().min(1).max(7).optional(),
  startDate: z.string().trim().optional(),
  builderType: z.enum(['template']).optional(),
  templateKey: z.string().trim().max(120).optional(),
  status: z.enum(['assigned', 'completed']).optional(),
  exercises: z.array(exerciseSchema).min(1).optional(),
  programDays: z.array(programDaySchema).optional(),
});

export const planIdParamsSchema = z.object({
  id: z.string().trim().min(1, 'id is required'),
});

export const submitWorkoutPlanSchema = z.object({
  submitted: z.boolean().optional().default(true),
  mode: z.enum(['all', 'week']).optional().default('all'),
  weekNumber: z.coerce.number().int().min(1).optional(),
});

export const workoutSessionStartSchema = z.object({
  userId: idSchema,
});

export const workoutSessionProgressSchema = z.object({
  userId: idSchema,
  exerciseIndex: z.coerce.number().int().min(0),
  done: z.boolean(),
  elapsedSeconds: z.coerce.number().int().min(0).optional(),
});

export const workoutSessionFinishSchema = z.object({
  userId: idSchema,
  elapsedSeconds: z.coerce.number().int().min(0).optional(),
  dayDate: z.string().trim().optional(),
});

export const categoryQuerySchema = z.object({
  coachId: idSchema,
});

export const exerciseSuggestionQuerySchema = z.object({
  coachId: idSchema.optional(),
  q: z.string().trim().min(2).max(80),
  limit: z.coerce.number().int().min(1).max(20).optional().default(8),
});

export const createCategorySchema = z.object({
  coachId: idSchema,
  categoryKey: z.enum(['weightGain', 'weightLoss']),
  name: z.string().trim().min(1).max(120),
  amount: z.string().trim().min(1).max(80),
  description: z.string().trim().max(1000).optional().default(''),
});

export const updateCategorySchema = z.object({
  categoryKey: z.enum(['weightGain', 'weightLoss']).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  amount: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(1000).optional(),
});

export const categoryIdParamsSchema = z.object({
  id: z.string().trim().min(1, 'id is required'),
});
