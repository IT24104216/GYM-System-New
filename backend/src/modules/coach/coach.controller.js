import { z } from 'zod';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { AppError } from '../../shared/errors/AppError.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { User } from '../users/users.model.js';
import {
  createNotification,
  createNotificationForAdmins,
} from '../notifications/notifications.service.js';
import { CoachProfile } from './coachProfile.model.js';
import { CoachScheduling } from './coachScheduling.model.js';

const PHONE_REGEX = /^\d{10}$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SLASH_DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

const isValidDateInput = (value) => {
  if (!value) return true;

  if (ISO_DATE_REGEX.test(value)) {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed.toISOString().slice(0, 10) === value;
  }

  if (SLASH_DATE_REGEX.test(value)) {
    const [mmRaw, ddRaw, yyyyRaw] = value.split('/').map(Number);
    if (!mmRaw || !ddRaw || !yyyyRaw) return false;
    const parsed = new Date(Date.UTC(yyyyRaw, mmRaw - 1, ddRaw));
    return (
      parsed.getUTCFullYear() === yyyyRaw
      && parsed.getUTCMonth() === mmRaw - 1
      && parsed.getUTCDate() === ddRaw
    );
  }

  return false;
};

const profileSchema = z
  .object({
    specialization: z.string().trim().max(120).optional(),
    experienceYears: z.coerce.number().min(0).max(80).optional(),
    certifications: z.string().trim().max(300).optional(),
    phone: z
      .string()
      .trim()
      .max(30)
      .refine(
        (value) => !value || PHONE_REGEX.test(value),
        { message: 'Invalid phone format. Use exactly 10 digits.' },
      )
      .optional(),
    preferredTrainingType: z.string().trim().max(120).optional(),
    coachingStyle: z.string().trim().max(500).optional(),
    joinedDate: z
      .string()
      .trim()
      .max(40)
      .refine(
        (value) => isValidDateInput(value),
        { message: 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY.' },
      )
      .optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    slots: z.string().trim().max(120).optional(),
  })
  .superRefine((data, ctx) => {
    if (!String(data.certifications || '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['certifications'],
        message: 'Qualifications/Certifications are required.',
      });
    }
    const exp = Number(data.experienceYears || 0);
    if (!exp || exp <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['experienceYears'],
        message: 'Experience is required.',
      });
    }
  });

const parsePayload = (schema, payload) => {
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

const toAvatar = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'C';

const toTags = (preferredTrainingType = '', specialization = '') => {
  const base = preferredTrainingType || specialization;
  if (!base) return ['General'];
  return base
    .split(/[/,]/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
};

const toLocalIsoDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeTo12h = (time24h = '') => {
  const [hoursRaw, minutesRaw] = time24h.split(':').map(Number);
  if (Number.isNaN(hoursRaw) || Number.isNaN(minutesRaw)) return time24h;
  const meridiem = hoursRaw >= 12 ? 'PM' : 'AM';
  const hours12 = hoursRaw % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutesRaw).padStart(2, '0')} ${meridiem}`;
};

const toDateLabel = (slotDate, todayIso) => {
  if (slotDate === todayIso) return 'Today';

  const date = new Date(`${slotDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return slotDate;

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const buildAvailabilityMap = (slots = []) => {
  const perCoach = new Map();

  slots.forEach((slot) => {
    const coachId = String(slot.coachId);
    if (!perCoach.has(coachId)) perCoach.set(coachId, new Map());
    const byDate = perCoach.get(coachId);
    if (!byDate.has(slot.date)) byDate.set(slot.date, []);
    byDate.get(slot.date).push({
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
  });

  return perCoach;
};

const toProfileDto = (userDoc, profileDoc, availability = {}) => ({
  id: String(userDoc._id),
  name: userDoc.name,
  email: userDoc.email,
  avatar: toAvatar(userDoc.name),
  specialty: profileDoc.specialization || 'General Fitness',
  experience: `${profileDoc.experienceYears || 0} years`,
  rating: Number(profileDoc.rating || 4.8),
  slots: availability.slotsLabel || profileDoc.slots || 'No upcoming slots',
  slotDate: availability.slotDate || '',
  slotRanges: availability.slotRanges || [],
  todaySlotDate: availability.todaySlotDate || '',
  todaySlotRanges: availability.todaySlotRanges || [],
  qualification: profileDoc.preferredTrainingType || 'Certified Fitness Coach',
  certificates: profileDoc.certifications || '-',
  tags: toTags(profileDoc.preferredTrainingType, profileDoc.specialization),
  profile: {
    specialization: profileDoc.specialization || '',
    experienceYears: String(profileDoc.experienceYears ?? ''),
    certifications: profileDoc.certifications || '',
    phone: profileDoc.phone || '',
    preferredTrainingType: profileDoc.preferredTrainingType || '',
    coachingStyle: profileDoc.coachingStyle || '',
    joinedDate: profileDoc.joinedDate || '',
    slots: profileDoc.slots || '',
    rating: Number(profileDoc.rating || 4.8),
  },
});

export const getcoachStatus = (_req, res) => {
  res.json({
    module: 'coach',
    status: 'ready',
  });
};

export const getCoachProfile = asyncHandler(async (req, res) => {
  const coachId = String(req.params.coachId || '').trim();
  if (!coachId) {
    throw new AppError('Coach id is required', HTTP_STATUS.BAD_REQUEST);
  }

  const [coachUser, profile] = await Promise.all([
    User.findOne({ _id: coachId, role: 'coach' }),
    CoachProfile.findOne({ coachId }),
  ]);

  if (!coachUser) {
    throw new AppError('Coach not found', HTTP_STATUS.NOT_FOUND);
  }

  if (!profile) {
    return res.status(HTTP_STATUS.OK).json({
      data: null,
    });
  }

  res.status(HTTP_STATUS.OK).json({
    data: toProfileDto(coachUser, profile),
  });
});

export const upsertCoachProfile = asyncHandler(async (req, res) => {
  const coachId = String(req.params.coachId || '').trim();
  if (!coachId) {
    throw new AppError('Coach id is required', HTTP_STATUS.BAD_REQUEST);
  }

  const coachUser = await User.findOne({ _id: coachId, role: 'coach' });
  if (!coachUser) {
    throw new AppError('Coach not found', HTTP_STATUS.NOT_FOUND);
  }

  const payload = parsePayload(profileSchema, req.body || {});
  const update = {
    ...payload,
    coachId,
  };

  const profile = await CoachProfile.findOneAndUpdate(
    { coachId },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await Promise.allSettled([
    createNotification({
      recipientId: coachId,
      recipientRole: 'coach',
      type: 'profile',
      title: 'Profile Updated',
      message: 'Your coach profile was updated successfully.',
      entityType: 'coach-profile',
      entityId: String(profile?._id || ''),
    }),
    createNotificationForAdmins({
      title: 'Coach Profile Updated',
      message: `${coachUser.name} updated coach profile details.`,
      entityType: 'coach-profile',
      entityId: String(profile?._id || ''),
    }),
  ]);

  res.status(HTTP_STATUS.OK).json({
    message: 'Coach profile saved successfully',
    data: toProfileDto(coachUser, profile),
  });
});

export const deleteCoachProfile = asyncHandler(async (req, res) => {
  const coachId = String(req.params.coachId || '').trim();
  if (!coachId) {
    throw new AppError('Coach id is required', HTTP_STATUS.BAD_REQUEST);
  }

  await CoachProfile.findOneAndDelete({ coachId });

  await Promise.allSettled([
    createNotification({
      recipientId: coachId,
      recipientRole: 'coach',
      type: 'profile',
      title: 'Profile Deleted',
      message: 'Your coach profile was deleted.',
      entityType: 'coach-profile',
      entityId: coachId,
    }),
    createNotificationForAdmins({
      title: 'Coach Profile Deleted',
      message: `A coach profile was deleted for coach id ${coachId}.`,
      entityType: 'coach-profile',
      entityId: coachId,
    }),
  ]);

  res.status(HTTP_STATUS.OK).json({
    message: 'Coach profile deleted successfully',
  });
});

export const getPublicCoaches = asyncHandler(async (_req, res) => {
  const todayIso = toLocalIsoDate(new Date());

  const [coachUsers, profiles] = await Promise.all([
    User.find({ role: 'coach', status: 'active' }).sort({ createdAt: -1 }),
    CoachProfile.find({}).sort({ updatedAt: -1 }),
  ]);

  const coachIds = coachUsers.map((coach) => String(coach._id));
  const scheduleSlots = await CoachScheduling.find({
    coachId: { $in: coachIds },
    date: { $gte: todayIso },
  }).sort({ date: 1, startTime: 1 });

  const profileByCoachId = new Map(
    profiles.map((profile) => [String(profile.coachId), profile]),
  );
  const availabilityByCoachId = buildAvailabilityMap(scheduleSlots);

  const coaches = coachUsers
    .map((coachUser) => {
      const profile = profileByCoachId.get(String(coachUser._id));
      if (!profile) return null;

      const coachAvailability = availabilityByCoachId.get(String(coachUser._id));
      let availability = {};

      if (coachAvailability && coachAvailability.size > 0) {
        const todaySlotRanges = (coachAvailability.get(todayIso) || []).sort(
          (a, b) => a.startTime.localeCompare(b.startTime),
        );
        const firstDate = Array.from(coachAvailability.keys()).sort()[0];
        const slotRanges = (coachAvailability.get(firstDate) || []).sort(
          (a, b) => a.startTime.localeCompare(b.startTime),
        );

        const firstRange = slotRanges[0];
        const moreCount = Math.max(slotRanges.length - 1, 0);
        const dateLabel = toDateLabel(firstDate, todayIso);
        const timeLabel = firstRange
          ? `${formatTimeTo12h(firstRange.startTime)} - ${formatTimeTo12h(firstRange.endTime)}`
          : '';

        availability = {
          slotDate: firstDate,
          slotRanges,
          todaySlotDate: todaySlotRanges.length > 0 ? todayIso : '',
          todaySlotRanges,
          slotsLabel: `${dateLabel}, ${timeLabel}${moreCount ? ` (+${moreCount} more)` : ''}`,
        };
      }

      return toProfileDto(coachUser, profile, availability);
    })
    .filter(Boolean);

  res.status(HTTP_STATUS.OK).json({
    data: coaches,
  });
});
