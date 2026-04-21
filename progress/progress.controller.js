import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { User } from '../users/users.model.js';
import { WorkoutPlan } from '../workouts/workouts.model.js';
import { ProgressTracking } from './progress.model.js';
import {
  calculateCoachMemberScores,
  calculateUserProgressScore,
} from './progress.scoring.js';
import {
  progressCoachParamsSchema,
  progressScoreQuerySchema,
  progressUserParamsSchema,
  upsertMeasurementSchema,
} from './progress.validation.js';

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

const toIsoDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};
const MAX_PROGRESS_PHOTO_BYTES = 5 * 1024 * 1024;

const toPhotosDto = (photos = []) =>
  (Array.isArray(photos) ? photos : [])
    .map((photo) => ({
      slot: Number(photo?.slot || 0),
      base64Image: String(photo?.base64Image || ''),
      fileName: String(photo?.fileName || ''),
      fileSize: Number(photo?.fileSize || 0),
      uploadedAt: photo?.uploadedAt || null,
      label: String(photo?.label || ''),
      note: String(photo?.note || ''),
    }))
    .filter((photo) => [1, 2, 3, 4].includes(photo.slot))
    .sort((a, b) => a.slot - b.slot);

const getAuthUserProgressDoc = async (req) => {
  const userId = String(req.user?.id || '').trim();
  if (!userId) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
  }
  const memberUser = await User.findById(userId).select('_id');
  if (!memberUser) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  let doc = await ProgressTracking.findOne({ userId });
  if (!doc) {
    doc = await ProgressTracking.create({
      userId,
      measurements: [],
      photos: [],
    });
  }
  return doc;
};

const mapMeasurementsByDate = (measurements = []) => {
  const sorted = [...measurements].sort((a, b) => a.date.localeCompare(b.date));
  const weightHistoryByDate = {};
  const measurementsByDate = {};

  sorted.forEach((entry) => {
    weightHistoryByDate[entry.date] = Number(entry.weight);
    measurementsByDate[entry.date] = {
      chest: Number(entry.chest),
      waist: Number(entry.waist),
      arms: Number(entry.arms),
      thighs: Number(entry.thighs),
      bodyFat: Number(entry.bodyFat),
    };
  });

  return {
    weightHistoryByDate,
    measurementsByDate,
  };
};

const getWorkoutCompletionDates = async (userId) => {
  const plans = await WorkoutPlan.find({ userId }).select(
    'status session.status session.completedAt programDays.date programDays.done updatedAt createdAt',
  );

  const dates = [];
  plans.forEach((plan) => {
    const sessionStatus = String(plan?.session?.status || '').toLowerCase();
    const planStatus = String(plan?.status || '').toLowerCase();
    const sessionCompletedAt = toIsoDate(plan?.session?.completedAt || '');

    if (sessionStatus === 'completed' || sessionStatus === 'finished') {
      if (sessionCompletedAt) {
        dates.push(sessionCompletedAt);
      } else {
        const fallbackSessionDate = toIsoDate(plan?.updatedAt || plan?.createdAt || '');
        if (fallbackSessionDate) dates.push(fallbackSessionDate);
      }
    } else if (planStatus === 'completed' || planStatus === 'finished') {
      const fallbackPlanDate = toIsoDate(plan?.updatedAt || plan?.createdAt || '');
      if (fallbackPlanDate) dates.push(fallbackPlanDate);
    }

    const dayDates = (Array.isArray(plan?.programDays) ? plan.programDays : [])
      .filter((day) => Boolean(day?.done))
      .map((day) => toIsoDate(day?.date || ''))
      .filter(Boolean);
    dates.push(...dayDates);
  });

  const uniqueSorted = Array.from(new Set(dates)).sort();
  return {
    workoutCompletionDates: uniqueSorted,
    completionDate: uniqueSorted.length ? uniqueSorted[uniqueSorted.length - 1] : '',
  };
};

export const getProgressStatus = (_req, res) => {
  res.json({
    module: 'progress',
    status: 'ready',
  });
};

export const getUserProgress = asyncHandler(async (req, res) => {
  const { userId } = parseOrThrow(progressUserParamsSchema, req.params);
  const { days } = parseOrThrow(progressScoreQuerySchema, req.query || {});

  const memberUser = await User.findById(userId).select('_id');
  if (!memberUser) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  const progressDoc = await ProgressTracking.findOne({ userId });
  const { weightHistoryByDate, measurementsByDate } = mapMeasurementsByDate(progressDoc?.measurements || []);
  const [completion, score] = await Promise.all([
    getWorkoutCompletionDates(userId),
    calculateUserProgressScore(userId, { daysWindow: days }),
  ]);

  res.status(HTTP_STATUS.OK).json({
    data: {
      userId,
      weightHistoryByDate,
      measurementsByDate,
      photos: toPhotosDto(progressDoc?.photos || []),
      ...completion,
      score,
    },
  });
});

export const upsertUserMeasurement = asyncHandler(async (req, res) => {
  const { userId } = parseOrThrow(progressUserParamsSchema, req.params);
  const { days } = parseOrThrow(progressScoreQuerySchema, req.query || {});
  const payload = parseOrThrow(upsertMeasurementSchema, req.body || {});

  const memberUser = await User.findById(userId).select('_id');
  if (!memberUser) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  const doc = await ProgressTracking.findOne({ userId });
  if (!doc) {
    await ProgressTracking.create({
      userId,
      measurements: [payload],
    });
  } else {
    const idx = doc.measurements.findIndex((item) => item.date === payload.date);
    if (idx === -1) {
      doc.measurements.push(payload);
    } else {
      doc.measurements[idx] = payload;
    }
    await doc.save();
  }

  const latestDoc = await ProgressTracking.findOne({ userId });
  const { weightHistoryByDate, measurementsByDate } = mapMeasurementsByDate(latestDoc?.measurements || []);
  const [completion, score] = await Promise.all([
    getWorkoutCompletionDates(userId),
    calculateUserProgressScore(userId, { daysWindow: days }),
  ]);

  res.status(HTTP_STATUS.OK).json({
    message: `Progress updated for ${payload.date}`,
    data: {
      userId,
      weightHistoryByDate,
      measurementsByDate,
      ...completion,
      score,
    },
  });
});

export const getUserProgressScore = asyncHandler(async (req, res) => {
  const { userId } = parseOrThrow(progressUserParamsSchema, req.params);
  const { days } = parseOrThrow(progressScoreQuerySchema, req.query || {});

  const memberUser = await User.findById(userId).select('_id');
  if (!memberUser) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  const score = await calculateUserProgressScore(userId, { daysWindow: days });

  res.status(HTTP_STATUS.OK).json({
    data: score,
  });
});

export const getCoachMemberScores = asyncHandler(async (req, res) => {
  const { coachId } = parseOrThrow(progressCoachParamsSchema, req.params);
  const { days } = parseOrThrow(progressScoreQuerySchema, req.query || {});

  const scoreData = await calculateCoachMemberScores(coachId, { daysWindow: days });

  res.status(HTTP_STATUS.OK).json({
    data: scoreData,
  });
});

export const uploadProgressPhoto = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const slot = Number(payload.slot);
  const base64Image = String(payload.base64Image || '').trim();
  const fileName = String(payload.fileName || '').trim();
  const fileSize = Number(payload.fileSize || 0);
  const label = String(payload.label || '').trim();
  const note = String(payload.note || '').trim();
  const uploadedAtRaw = payload.uploadedAt;

  if (![1, 2, 3, 4].includes(slot)) {
    throw new AppError('Invalid slot. Allowed values are 1 to 4.', HTTP_STATUS.BAD_REQUEST);
  }
  if (!base64Image.startsWith('data:image/')) {
    throw new AppError('Invalid file type.', HTTP_STATUS.BAD_REQUEST);
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    throw new AppError('Invalid file size.', HTTP_STATUS.BAD_REQUEST);
  }
  if (fileSize > MAX_PROGRESS_PHOTO_BYTES) {
    throw new AppError('File too large. Max 5MB allowed.', HTTP_STATUS.BAD_REQUEST);
  }

  const uploadedAt = (() => {
    const parsed = new Date(uploadedAtRaw || Date.now());
    if (Number.isNaN(parsed.getTime())) return new Date();
    return parsed;
  })();

  const doc = await getAuthUserProgressDoc(req);
  const currentPhotos = Array.isArray(doc.photos) ? doc.photos : [];
  doc.photos = currentPhotos.filter((photo) => Number(photo?.slot) !== slot);
  doc.photos.push({
    slot,
    base64Image,
    fileName,
    fileSize,
    uploadedAt,
    label,
    note,
  });
  await doc.save();

  res.status(HTTP_STATUS.OK).json({
    message: 'Progress photo uploaded successfully',
    photos: toPhotosDto(doc.photos),
  });
});

export const deleteProgressPhoto = asyncHandler(async (req, res) => {
  const slot = Number(req.params?.slot);
  if (![1, 2, 3, 4].includes(slot)) {
    throw new AppError('Invalid slot. Allowed values are 1 to 4.', HTTP_STATUS.BAD_REQUEST);
  }

  const doc = await getAuthUserProgressDoc(req);
  doc.photos = (Array.isArray(doc.photos) ? doc.photos : []).filter(
    (photo) => Number(photo?.slot) !== slot,
  );
  await doc.save();

  res.status(HTTP_STATUS.OK).json({
    message: 'Progress photo deleted successfully',
    photos: toPhotosDto(doc.photos),
  });
});

export const updatePhotoNote = asyncHandler(async (req, res) => {
  const slot = Number(req.params?.slot);
  const note = String(req.body?.note || '').trim();
  if (![1, 2, 3, 4].includes(slot)) {
    throw new AppError('Invalid slot. Allowed values are 1 to 4.', HTTP_STATUS.BAD_REQUEST);
  }

  const doc = await getAuthUserProgressDoc(req);
  const photos = Array.isArray(doc.photos) ? doc.photos : [];
  const index = photos.findIndex((photo) => Number(photo?.slot) === slot);
  if (index === -1) {
    throw new AppError('Photo not found for this slot.', HTTP_STATUS.NOT_FOUND);
  }

  photos[index].note = note;
  await doc.save();

  res.status(HTTP_STATUS.OK).json({
    message: 'Photo note updated successfully',
    photo: toPhotosDto([photos[index]])[0] || null,
    photos: toPhotosDto(doc.photos),
  });
});
