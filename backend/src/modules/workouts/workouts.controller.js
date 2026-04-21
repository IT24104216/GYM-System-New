import { Appointment } from '../appointments/appointments.model.js';
import { User } from '../users/users.model.js';
import { env } from '../../config/env.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import {
  createNotification,
  createNotificationForAdmins,
} from '../notifications/notifications.service.js';
import { ExerciseCategory, WorkoutPlan } from './workouts.model.js';
import {
  categoryIdParamsSchema,
  categoryQuerySchema,
  createCategorySchema,
  createWorkoutPlanSchema,
  exerciseSuggestionQuerySchema,
  planIdParamsSchema,
  submitWorkoutPlanSchema,
  updateCategorySchema,
  updateWorkoutPlanSchema,
  workoutSessionFinishSchema,
  workoutSessionProgressSchema,
  workoutSessionStartSchema,
  workoutQuerySchema,
} from './workouts.validation.js';
import {
  buildProgramDays,
  escapeRegExp,
  getTotalWeeks,
  getWeekNumberFromDay,
  isOnlineAppointment,
  isWorkoutDayAssigned,
  normalizePublishedWeeks,
  toIsoDate,
  todayIso,
} from './workouts.service.js';
import { mapWorkoutRequest } from './workouts.mapper.js';
import {
  getMinimumRequiredSessionSeconds,
  resolveAssignedMinutesForDay,
} from './workouts.session.utils.js';

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

export const getworkoutsStatus = (_req, res) => {
  res.json({
    module: 'workouts',
    status: 'ready',
  });
};

export const getWorkoutRequests = asyncHandler(async (req, res) => {
  const query = parseOrThrow(workoutQuerySchema, req.query);
  if (!query.coachId) {
    throw new AppError('coachId is required', HTTP_STATUS.BAD_REQUEST);
  }

  const coachUser = await User.findOne({ _id: query.coachId, role: 'coach' }).select('_id');
  if (!coachUser) {
    throw new AppError('Coach not found', HTTP_STATUS.NOT_FOUND);
  }

  const approvedAppointments = await Appointment.find({
    coachId: query.coachId,
    status: { $in: ['approved', 'completed'] },
    sessionType: { $in: ['consultation', 'training', 'assessment', 'other'] },
  })
    .sort({ updatedAt: -1, startsAt: -1 })
    .limit(1000);

  const plans = await WorkoutPlan.find({ coachId: query.coachId }).select('userId isSubmitted');
  const plansByUser = new Map();
  plans.forEach((item) => {
    const userId = String(item.userId);
    if (!plansByUser.has(userId)) {
      plansByUser.set(userId, { hasPlan: true, hasSubmittedPlan: Boolean(item.isSubmitted) });
      return;
    }
    const prev = plansByUser.get(userId);
    plansByUser.set(userId, {
      hasPlan: true,
      hasSubmittedPlan: prev.hasSubmittedPlan || Boolean(item.isSubmitted),
    });
  });

  const dedupByUser = new Map();

  approvedAppointments.forEach((appointment) => {
    if (!isOnlineAppointment(appointment)) return;
    const userId = String(appointment.userId);
    if (!userId) return;
    if (!dedupByUser.has(userId)) dedupByUser.set(userId, appointment);
  });

  const requests = Array.from(dedupByUser.values())
    .map((appointment) => mapWorkoutRequest(appointment, plansByUser));

  res.status(HTTP_STATUS.OK).json({
    data: requests,
  });
});

export const getWorkoutPlans = asyncHandler(async (req, res) => {
  const query = parseOrThrow(workoutQuerySchema, req.query);
  const filter = {};
  if (query.coachId) filter.coachId = query.coachId;
  if (query.userId) filter.userId = query.userId;
  if (typeof query.submitted === 'boolean') filter.isSubmitted = query.submitted;

  const plans = await WorkoutPlan.find(filter)
    .sort({ createdAt: -1 })
    .limit(query.limit);

  res.status(HTTP_STATUS.OK).json({
    data: plans,
  });
});

export const createWorkoutPlan = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(createWorkoutPlanSchema, req.body);

  const coachUser = await User.findOne({ _id: payload.coachId, role: 'coach' }).select('_id');
  if (!coachUser) {
    throw new AppError('Coach not found', HTTP_STATUS.NOT_FOUND);
  }

  const memberUser = await User.findOne({ _id: payload.userId }).select('_id');
  if (!memberUser) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  const programDays = buildProgramDays(payload);
  const created = await WorkoutPlan.create({
    ...payload,
    startDate: toIsoDate(payload.startDate) || todayIso(),
    currentDayDate: toIsoDate(payload.startDate) || todayIso(),
    programDays,
    publishedWeeks: [],
  });

  res.status(HTTP_STATUS.CREATED).json({
    message: 'Workout plan created successfully',
    data: created,
  });
});

export const updateWorkoutPlan = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(planIdParamsSchema, req.params);
  const payload = parseOrThrow(updateWorkoutPlanSchema, req.body);

  const plan = await WorkoutPlan.findById(id);
  if (!plan) {
    throw new AppError('Workout plan not found', HTTP_STATUS.NOT_FOUND);
  }
  if (plan.isSubmitted) {
    throw new AppError('Submitted workout plan cannot be edited', HTTP_STATUS.CONFLICT);
  }

  Object.assign(plan, payload);
  const nextPayload = {
    ...plan.toObject(),
    ...payload,
    exercises: payload.exercises || plan.exercises || [],
  };
  const nextProgramDays = buildProgramDays(nextPayload);
  plan.programDays = nextProgramDays;
  plan.startDate = toIsoDate(nextPayload.startDate) || plan.startDate || todayIso();
  plan.currentDayDate = plan.currentDayDate || plan.startDate;
  plan.publishedWeeks = normalizePublishedWeeks(plan.publishedWeeks, getTotalWeeks(plan));
  await plan.save();

  res.status(HTTP_STATUS.OK).json({
    message: 'Workout plan updated successfully',
    data: plan,
  });
});

export const deleteWorkoutPlan = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(planIdParamsSchema, req.params);
  const plan = await WorkoutPlan.findById(id);
  if (!plan) {
    throw new AppError('Workout plan not found', HTTP_STATUS.NOT_FOUND);
  }
  if (plan.isSubmitted) {
    throw new AppError('Submitted workout plan cannot be deleted', HTTP_STATUS.CONFLICT);
  }
  const deleted = await WorkoutPlan.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError('Workout plan not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    message: 'Workout plan deleted successfully',
  });
});

export const submitWorkoutPlan = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(planIdParamsSchema, req.params);
  const payload = parseOrThrow(submitWorkoutPlanSchema, req.body || {});

  const plan = await WorkoutPlan.findById(id);
  if (!plan) {
    throw new AppError('Workout plan not found', HTTP_STATUS.NOT_FOUND);
  }
  if (plan.isSubmitted && payload.mode === 'all') {
    return res.status(HTTP_STATUS.OK).json({
      message: 'Workout plan already submitted',
      data: plan,
    });
  }
  if (!Array.isArray(plan.programDays) || !plan.programDays.length) {
    plan.programDays = buildProgramDays(plan);
  }
  if (!plan.currentDayDate) {
    plan.currentDayDate = plan.startDate || todayIso();
  }

  const totalWeeks = getTotalWeeks(plan);
  let publishedWeeks = normalizePublishedWeeks(plan.publishedWeeks, totalWeeks);

  if (payload.mode === 'week') {
    const weekNumber = Number(payload.weekNumber);
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > totalWeeks) {
      throw new AppError('Valid weekNumber is required for week publish', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
    const weekDays = (plan.programDays || []).filter((day) => getWeekNumberFromDay(day.dayNumber) === weekNumber);
    if (!weekDays.length) {
      throw new AppError(`No program days found for week ${weekNumber}`, HTTP_STATUS.CONFLICT);
    }
    const missingWeekDays = weekDays.filter((day) => !isWorkoutDayAssigned(day));
    if (missingWeekDays.length > 0) {
      const sample = missingWeekDays.slice(0, 6).map((day) => day.dayNumber).join(', ');
      throw new AppError(
        `Complete week ${weekNumber} before publish. Missing day assignments: ${sample}${missingWeekDays.length > 6 ? '...' : ''}`,
        HTTP_STATUS.CONFLICT,
      );
    }
    publishedWeeks = normalizePublishedWeeks([...publishedWeeks, weekNumber], totalWeeks);
    plan.publishedWeeks = publishedWeeks;
    const allWeeksPublished = publishedWeeks.length >= totalWeeks;
    plan.isSubmitted = allWeeksPublished ? Boolean(payload.submitted) : false;
    plan.submittedAt = allWeeksPublished ? new Date() : null;
    await plan.save();

    await Promise.allSettled([
      createNotification({
        recipientId: plan.userId,
        recipientRole: 'user',
        type: 'workout',
        title: `Week ${weekNumber} Workout Published`,
        message: `Your coach published week ${weekNumber} of your workout plan.`,
        entityType: 'workout-plan',
        entityId: String(plan._id),
      }),
      createNotificationForAdmins({
        title: 'Workout Week Published',
        message: `Coach published week ${weekNumber} for a client workout plan.`,
        entityType: 'workout-plan',
        entityId: String(plan._id),
      }),
    ]);

    return res.status(HTTP_STATUS.OK).json({
      message: allWeeksPublished
        ? 'Workout plan submitted successfully'
        : `Week ${weekNumber} published successfully`,
      data: plan,
    });
  }

  const unassignedWorkoutDays = (plan.programDays || []).filter((day) => !isWorkoutDayAssigned(day));
  if (unassignedWorkoutDays.length > 0) {
    const sample = unassignedWorkoutDays.slice(0, 6).map((day) => day.dayNumber).join(', ');
    throw new AppError(
      `Complete all workout days before publish. Missing day assignments: ${sample}${unassignedWorkoutDays.length > 6 ? '...' : ''}`,
      HTTP_STATUS.CONFLICT,
    );
  }
  plan.publishedWeeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  plan.isSubmitted = Boolean(payload.submitted);
  plan.submittedAt = plan.isSubmitted ? new Date() : null;

  await plan.save();

  await Promise.allSettled([
    createNotification({
      recipientId: plan.userId,
      recipientRole: 'user',
      type: 'workout',
      title: 'Workout Plan Published',
      message: 'Your coach published your full workout plan.',
      entityType: 'workout-plan',
      entityId: String(plan._id),
    }),
    createNotificationForAdmins({
      title: 'Workout Plan Submitted',
      message: 'A coach submitted a full workout plan for a client.',
      entityType: 'workout-plan',
      entityId: String(plan._id),
    }),
  ]);

  res.status(HTTP_STATUS.OK).json({
    message: 'Workout plan submitted successfully',
    data: plan,
  });
});

export const startWorkoutSession = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(planIdParamsSchema, req.params);
  const payload = parseOrThrow(workoutSessionStartSchema, req.body || {});

  const plan = await WorkoutPlan.findById(id);
  if (!plan) {
    throw new AppError('Workout plan not found', HTTP_STATUS.NOT_FOUND);
  }
  const publishedWeeks = normalizePublishedWeeks(plan.publishedWeeks, getTotalWeeks(plan));
  if (!plan.isSubmitted && !publishedWeeks.length) {
    throw new AppError('Workout plan is not published yet', HTTP_STATUS.CONFLICT);
  }
  if (String(plan.userId) !== payload.userId) {
    throw new AppError('Workout plan does not belong to this user', HTTP_STATUS.FORBIDDEN);
  }
  if (plan.session?.status === 'completed') {
    throw new AppError('Workout session is already completed', HTTP_STATUS.CONFLICT);
  }

  if (plan.session?.status !== 'ongoing') {
    plan.session = {
      ...(plan.session?.toObject ? plan.session.toObject() : plan.session || {}),
      status: 'ongoing',
      startedAt: plan.session?.startedAt || new Date(),
      completedAt: null,
      elapsedSeconds: Number(plan.session?.elapsedSeconds || 0),
      exerciseProgress: Array.isArray(plan.session?.exerciseProgress)
        ? plan.session.exerciseProgress
        : [],
    };
    await plan.save();
  }
  if (Array.isArray(plan.programDays) && plan.programDays.length) {
    const today = todayIso();
    const nextPending = plan.programDays.find((day) => !day.isRest && !day.done && day.date <= today)
      || plan.programDays.find((day) => !day.isRest && !day.done);
    if (nextPending?.date) {
      plan.currentDayDate = nextPending.date;
      await plan.save();
    }
  }

  res.status(HTTP_STATUS.OK).json({
    message: 'Workout session started',
    data: plan,
  });
});

export const updateWorkoutSessionProgress = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(planIdParamsSchema, req.params);
  const payload = parseOrThrow(workoutSessionProgressSchema, req.body || {});

  const plan = await WorkoutPlan.findById(id);
  if (!plan) {
    throw new AppError('Workout plan not found', HTTP_STATUS.NOT_FOUND);
  }
  const publishedWeeks = normalizePublishedWeeks(plan.publishedWeeks, getTotalWeeks(plan));
  if (!plan.isSubmitted && !publishedWeeks.length) {
    throw new AppError('Workout plan is not published yet', HTTP_STATUS.CONFLICT);
  }
  if (String(plan.userId) !== payload.userId) {
    throw new AppError('Workout plan does not belong to this user', HTTP_STATUS.FORBIDDEN);
  }
  if (plan.session?.status === 'completed') {
    throw new AppError('Workout session is already completed', HTTP_STATUS.CONFLICT);
  }
  if (!Array.isArray(plan.exercises) || payload.exerciseIndex >= plan.exercises.length) {
    throw new AppError('Exercise index is invalid', HTTP_STATUS.BAD_REQUEST);
  }

  const nextSession = {
    ...(plan.session?.toObject ? plan.session.toObject() : plan.session || {}),
    status: 'ongoing',
    startedAt: plan.session?.startedAt || new Date(),
    completedAt: null,
    elapsedSeconds: Number.isFinite(payload.elapsedSeconds)
      ? payload.elapsedSeconds
      : Number(plan.session?.elapsedSeconds || 0),
    exerciseProgress: Array.isArray(plan.session?.exerciseProgress)
      ? [...plan.session.exerciseProgress]
      : [],
  };

  const progressIndex = nextSession.exerciseProgress.findIndex(
    (item) => Number(item.index) === payload.exerciseIndex,
  );
  const nextProgressItem = {
    index: payload.exerciseIndex,
    done: payload.done,
    completedAt: payload.done ? new Date() : null,
  };

  if (progressIndex === -1) {
    nextSession.exerciseProgress.push(nextProgressItem);
  } else {
    nextSession.exerciseProgress[progressIndex] = nextProgressItem;
  }

  plan.session = nextSession;
  await plan.save();

  res.status(HTTP_STATUS.OK).json({
    message: 'Workout progress updated',
    data: plan,
  });
});

export const finishWorkoutSession = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(planIdParamsSchema, req.params);
  const payload = parseOrThrow(workoutSessionFinishSchema, req.body || {});

  const plan = await WorkoutPlan.findById(id);
  if (!plan) {
    throw new AppError('Workout plan not found', HTTP_STATUS.NOT_FOUND);
  }
  const publishedWeeks = normalizePublishedWeeks(plan.publishedWeeks, getTotalWeeks(plan));
  if (!plan.isSubmitted && !publishedWeeks.length) {
    throw new AppError('Workout plan is not published yet', HTTP_STATUS.CONFLICT);
  }
  if (String(plan.userId) !== payload.userId) {
    throw new AppError('Workout plan does not belong to this user', HTTP_STATUS.FORBIDDEN);
  }
  if (plan.session?.status === 'completed') {
    return res.status(HTTP_STATUS.OK).json({
      message: 'Workout session already completed',
      data: plan,
    });
  }
  if (!plan.session?.startedAt) {
    throw new AppError('Please start the workout session before finishing', HTTP_STATUS.CONFLICT);
  }

  const progressMap = new Map(
    (Array.isArray(plan.session?.exerciseProgress) ? plan.session.exerciseProgress : [])
      .map((item) => [Number(item.index), Boolean(item.done)]),
  );

  const effectiveDay = toIsoDate(payload.dayDate) || todayIso();
  const completedAtFromEffectiveDay = new Date(`${effectiveDay}T12:00:00.000Z`);
  const completedAtDate = Number.isNaN(completedAtFromEffectiveDay.getTime())
    ? new Date()
    : completedAtFromEffectiveDay;
  const effectiveElapsedSeconds = Number.isFinite(payload.elapsedSeconds)
    ? payload.elapsedSeconds
    : Number(plan.session?.elapsedSeconds || 0);
  const dayForFinish = Array.isArray(plan.programDays)
    ? plan.programDays.find((day) => !day.isRest && day.date === effectiveDay)
    : null;
  const requiredIndexes = (() => {
    if (!dayForFinish) {
      return plan.exercises.map((_, index) => index);
    }

    const assigned = Array.isArray(dayForFinish.assignedExerciseIndexes)
      ? dayForFinish.assignedExerciseIndexes
      : [];
    const legacy = Array.isArray(dayForFinish.exerciseIndexes)
      ? dayForFinish.exerciseIndexes
      : [];
    const source = assigned.length ? assigned : legacy;
    if (!source.length) {
      return plan.exercises.map((_, index) => index);
    }
    return [...new Set(source
      .map((index) => Number(index))
      .filter((index) => Number.isInteger(index) && index >= 0 && index < plan.exercises.length))];
  })();
  const incompleteExists = requiredIndexes.some((index) => !progressMap.get(index));
  if (incompleteExists) {
    throw new AppError('Complete all exercises for this day before finishing', HTTP_STATUS.CONFLICT);
  }
  const assignedMinutes = resolveAssignedMinutesForDay(plan, dayForFinish);
  const minimumRequiredSeconds = getMinimumRequiredSessionSeconds(assignedMinutes);
  // Do not block completion for real users; keep elapsed time metrics normalized.
  const normalizedElapsedSeconds = Math.max(effectiveElapsedSeconds, minimumRequiredSeconds);

  if (Array.isArray(plan.programDays) && plan.programDays.length) {
    let targetIndex = plan.programDays.findIndex(
      (day) => !day.isRest && !day.done && day.date === effectiveDay,
    );
    if (targetIndex < 0) {
      targetIndex = plan.programDays.findIndex(
        (day) => !day.isRest && !day.done && day.date <= effectiveDay,
      );
    }
    if (targetIndex >= 0) {
      plan.programDays[targetIndex].done = true;
      plan.programDays[targetIndex].completedAt = completedAtDate;
      const nextPending = plan.programDays.find(
        (day) => !day.isRest && !day.done && day.date >= plan.programDays[targetIndex].date,
      );
      plan.currentDayDate = nextPending?.date || plan.programDays[targetIndex].date;
    }
    const pendingWorkoutDays = plan.programDays.some((day) => !day.isRest && !day.done);
    plan.status = pendingWorkoutDays ? 'assigned' : 'completed';
  }

  plan.session = {
    ...(plan.session?.toObject ? plan.session.toObject() : plan.session || {}),
    status: 'completed',
    completedAt: completedAtDate,
    elapsedSeconds: normalizedElapsedSeconds,
  };
  await plan.save();

  res.status(HTTP_STATUS.OK).json({
    message: 'Workout session completed',
    data: {
      ...plan.toObject(),
      completedDate: effectiveDay,
    },
  });
});

export const getExerciseCategories = asyncHandler(async (req, res) => {
  const query = parseOrThrow(categoryQuerySchema, req.query);
  const categories = await ExerciseCategory.find({ coachId: query.coachId }).sort({
    categoryKey: 1,
    createdAt: -1,
  });

  res.status(HTTP_STATUS.OK).json({
    data: categories,
  });
});

export const getExerciseSuggestions = asyncHandler(async (req, res) => {
  const query = parseOrThrow(exerciseSuggestionQuerySchema, req.query || {});
  const limit = Number(query.limit) || 8;
  const searchRegex = new RegExp(escapeRegExp(query.q), 'i');

  const localFilter = { name: searchRegex };
  if (query.coachId) localFilter.coachId = query.coachId;

  const localItems = await ExerciseCategory.find(localFilter)
    .sort({ createdAt: -1 })
    .limit(limit);

  const suggestions = localItems.map((item) => ({
    name: item.name,
    amount: item.amount || '3 x 12',
    description: item.description || '',
    assignedMinutes: 45,
    source: 'local',
  }));

  if (suggestions.length < limit && env.API_NINJAS_KEY) {
    try {
      const url = `${env.API_NINJAS_BASE_URL}/v1/exercises?name=${encodeURIComponent(query.q)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Api-Key': env.API_NINJAS_KEY,
        },
      });

      if (response.ok) {
        const remoteItems = await response.json();
        const existingNames = new Set(suggestions.map((item) => String(item.name || '').trim().toLowerCase()));

        (Array.isArray(remoteItems) ? remoteItems : []).forEach((item) => {
          if (suggestions.length >= limit) return;
          const name = String(item?.name || '').trim();
          if (!name) return;
          const key = name.toLowerCase();
          if (existingNames.has(key)) return;

          suggestions.push({
            name,
            amount: '3 x 12',
            description: String(item?.instructions || '').trim().slice(0, 1000),
            assignedMinutes: 45,
            source: 'api-ninjas',
            meta: {
              muscle: item?.muscle || '',
              equipment: item?.equipment || '',
              difficulty: item?.difficulty || '',
            },
          });
          existingNames.add(key);
        });
      }
    } catch {
      // external provider is optional; return local suggestions even if it fails
    }
  }

  res.status(HTTP_STATUS.OK).json({
    data: suggestions.slice(0, limit),
  });
});

export const createExerciseCategoryItem = asyncHandler(async (req, res) => {
  const payload = parseOrThrow(createCategorySchema, req.body);
  const created = await ExerciseCategory.create(payload);

  res.status(HTTP_STATUS.CREATED).json({
    message: 'Exercise added successfully',
    data: created,
  });
});

export const updateExerciseCategoryItem = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(categoryIdParamsSchema, req.params);
  const payload = parseOrThrow(updateCategorySchema, req.body);

  const item = await ExerciseCategory.findById(id);
  if (!item) {
    throw new AppError('Exercise not found', HTTP_STATUS.NOT_FOUND);
  }

  Object.assign(item, payload);
  await item.save();

  res.status(HTTP_STATUS.OK).json({
    message: 'Exercise updated successfully',
    data: item,
  });
});

export const deleteExerciseCategoryItem = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(categoryIdParamsSchema, req.params);
  const deleted = await ExerciseCategory.findByIdAndDelete(id);

  if (!deleted) {
    throw new AppError('Exercise not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    message: 'Exercise deleted successfully',
  });
});
