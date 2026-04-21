import { Appointment } from '../appointments/appointments.model.js';
import { DietPlan, FoodLog } from '../mealPlans/mealPlans.model.js';
import { WorkoutPlan } from '../workouts/workouts.model.js';
import { ProgressTracking } from './progress.model.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const toIsoDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const getDateNDaysAgo = (days) => {
  const now = new Date();
  return new Date(now.getTime() - (days * DAY_MS));
};

const getDateDiffDays = (startValue, endValue) => {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / DAY_MS));
};

const hasText = (value) => String(value || '').trim().length > 0;

const detectGoalType = (text) => {
  const normalized = String(text || '').toLowerCase();
  if (/(loss|reduce|reducing|cut|fat)/i.test(normalized)) return 'weight_loss';
  if (/(gain|bulk|mass)/i.test(normalized)) return 'weight_gain';
  return 'recomposition';
};

const getWorkoutComponent = async (userId, daysWindow) => {
  const windowStartIso = toIsoDate(getDateNDaysAgo(daysWindow));
  const todayIso = toIsoDate(new Date());
  const plans = await WorkoutPlan.find({ userId }).select('programDays');

  let scheduled = 0;
  let completed = 0;
  let missed = 0;
  let latestCompletedAt = null;

  plans.forEach((plan) => {
    const days = Array.isArray(plan.programDays) ? plan.programDays : [];
    days.forEach((day) => {
      if (!day?.assigned) return;
      if (!hasText(day?.date)) return;
      if (day.date < windowStartIso || day.date > todayIso) return;
      scheduled += 1;
      if (day.done) {
        completed += 1;
        if (day.completedAt) {
          const completedAt = new Date(day.completedAt);
          if (!Number.isNaN(completedAt.getTime())) {
            if (!latestCompletedAt || completedAt > latestCompletedAt) {
              latestCompletedAt = completedAt;
            }
          }
        }
      } else if (day.date < todayIso) {
        missed += 1;
      }
    });
  });

  if (scheduled === 0) {
    return {
      score: null,
      details: {
        scheduled,
        completed,
        missed,
        completionRate: 0,
        recency: 0,
      },
    };
  }

  const completionRate = clamp((completed / scheduled) * 100);
  const recency = latestCompletedAt
    ? clamp(100 - Math.min(14, getDateDiffDays(latestCompletedAt, new Date())) * 6)
    : 0;
  const missPenalty = clamp((missed / scheduled) * 100);
  const score = clamp((completionRate * 0.7) + (recency * 0.3) - (missPenalty * 0.2));

  return {
    score: Math.round(score),
    details: {
      scheduled,
      completed,
      missed,
      completionRate: Math.round(completionRate),
      recency: Math.round(recency),
    },
  };
};

const getMealTargetSummary = (plan) => {
  if (!plan) return null;
  const sections = ['breakfast', 'lunch', 'dinner', 'snacks'];
  const summary = sections.reduce(
    (acc, section) => {
      const items = Array.isArray(plan[section]) ? plan[section] : [];
      items.forEach((item) => {
        acc.calories += Number(item?.calories || 0);
        acc.protein += Number(item?.protein || 0);
      });
      return acc;
    },
    { calories: 0, protein: 0 },
  );

  if (summary.calories <= 0 && summary.protein <= 0) return null;
  return summary;
};

const getNutritionComponent = async (userId, daysWindow) => {
  const windowStartIso = toIsoDate(getDateNDaysAgo(daysWindow));
  const [activePlan, logs] = await Promise.all([
    DietPlan.findOne({ userId, isSubmitted: true }).sort({ submittedAt: -1, updatedAt: -1 }),
    FoodLog.find({ userId, logDate: { $gte: windowStartIso } }).sort({ logDate: 1 }),
  ]);

  const target = getMealTargetSummary(activePlan);
  if (!target) {
    return {
      score: null,
      details: {
        daysLogged: 0,
        activePlan: false,
        calorieAdherence: 0,
        proteinAdherence: 0,
      },
    };
  }

  const daily = new Map();
  logs.forEach((log) => {
    const key = String(log.logDate || '');
    if (!daily.has(key)) daily.set(key, { calories: 0, protein: 0 });
    const entry = daily.get(key);
    entry.calories += Number(log.calories || 0);
    entry.protein += Number(log.protein || 0);
  });

  const daysLogged = daily.size;
  if (daysLogged === 0) {
    return {
      score: 30,
      details: {
        daysLogged,
        activePlan: true,
        calorieAdherence: 0,
        proteinAdherence: 0,
      },
    };
  }

  let calorieAdherenceSum = 0;
  let proteinAdherenceSum = 0;
  daily.forEach((entry) => {
    const calorieDeltaRatio = target.calories > 0
      ? Math.abs(entry.calories - target.calories) / target.calories
      : 1;
    const proteinDeltaRatio = target.protein > 0
      ? Math.abs(entry.protein - target.protein) / target.protein
      : 1;
    calorieAdherenceSum += clamp(100 - (calorieDeltaRatio * 100));
    proteinAdherenceSum += clamp(100 - (proteinDeltaRatio * 100));
  });

  const calorieAdherence = calorieAdherenceSum / daysLogged;
  const proteinAdherence = proteinAdherenceSum / daysLogged;
  const consistency = clamp((daysLogged / Math.min(daysWindow, 14)) * 100);
  const score = clamp((calorieAdherence * 0.35) + (proteinAdherence * 0.45) + (consistency * 0.2));

  return {
    score: Math.round(score),
    details: {
      daysLogged,
      activePlan: true,
      calorieAdherence: Math.round(calorieAdherence),
      proteinAdherence: Math.round(proteinAdherence),
    },
  };
};

const getMeasurementComponent = async (userId, goalType) => {
  const doc = await ProgressTracking.findOne({ userId }).select('measurements');
  const measurements = Array.isArray(doc?.measurements) ? [...doc.measurements] : [];
  if (measurements.length < 2) {
    return {
      score: null,
      details: {
        entries: measurements.length,
        weightTrendScore: 0,
        bodyCompScore: 0,
      },
    };
  }

  measurements.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const first = measurements[0];
  const latest = measurements[measurements.length - 1];
  const days = Math.max(7, getDateDiffDays(first.date, latest.date));
  const weeks = days / 7;
  const firstWeight = Number(first.weight || 0);
  const latestWeight = Number(latest.weight || 0);
  const weightDeltaPctPerWeek = firstWeight > 0
    ? (((latestWeight - firstWeight) / firstWeight) * 100) / weeks
    : 0;

  let targetRate = 0;
  let tolerance = 0.75;
  if (goalType === 'weight_loss') targetRate = -0.6;
  if (goalType === 'weight_gain') targetRate = 0.3;
  const weightTrendScore = clamp(100 - ((Math.abs(weightDeltaPctPerWeek - targetRate) / tolerance) * 100));

  const waistStart = Number(first.waist || 0);
  const waistLatest = Number(latest.waist || 0);
  const bodyFatStart = Number(first.bodyFat || 0);
  const bodyFatLatest = Number(latest.bodyFat || 0);
  const waistChangePct = waistStart > 0 ? ((waistLatest - waistStart) / waistStart) * 100 : 0;
  const bodyFatChange = bodyFatLatest - bodyFatStart;

  let bodyCompScore = 60;
  if (goalType === 'weight_loss' || goalType === 'recomposition') {
    const waistScore = clamp(70 + ((-waistChangePct) * 8));
    const fatScore = clamp(70 + ((-bodyFatChange) * 10));
    bodyCompScore = clamp((waistScore * 0.55) + (fatScore * 0.45));
  } else {
    const waistGuard = clamp(100 - Math.max(0, waistChangePct - 2) * 15);
    const weightGainQuality = clamp(70 + (weightDeltaPctPerWeek * 45));
    bodyCompScore = clamp((waistGuard * 0.5) + (weightGainQuality * 0.5));
  }

  const freshnessCount = measurements.filter((entry) => getDateDiffDays(entry.date, new Date()) <= 30).length;
  const consistency = clamp((freshnessCount / 4) * 100);
  const score = clamp((weightTrendScore * 0.45) + (bodyCompScore * 0.4) + (consistency * 0.15));

  return {
    score: Math.round(score),
    details: {
      entries: measurements.length,
      weightTrendScore: Math.round(weightTrendScore),
      bodyCompScore: Math.round(bodyCompScore),
      weightDeltaPctPerWeek: Number(weightDeltaPctPerWeek.toFixed(3)),
    },
  };
};

const normalizeWeightedScore = (parts) => {
  const available = parts.filter((item) => Number.isFinite(item?.score));
  if (!available.length) return 0;
  const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
  if (!totalWeight) return 0;
  const value = available.reduce((sum, item) => sum + ((item.score * item.weight) / totalWeight), 0);
  return Math.round(clamp(value));
};

export const calculateUserProgressScore = async (userId, options = {}) => {
  const daysWindow = Number(options.daysWindow || 30);
  const latestWorkoutPlan = await WorkoutPlan.findOne({ userId }).sort({ updatedAt: -1 }).select('planTitle planNote');
  const goalType = detectGoalType(`${latestWorkoutPlan?.planTitle || ''} ${latestWorkoutPlan?.planNote || ''}`);

  const [workout, nutrition, measurement] = await Promise.all([
    getWorkoutComponent(userId, daysWindow),
    getNutritionComponent(userId, Math.min(daysWindow, 14)),
    getMeasurementComponent(userId, goalType),
  ]);

  const score = normalizeWeightedScore([
    { weight: 0.5, score: workout.score },
    { weight: 0.2, score: nutrition.score },
    { weight: 0.3, score: measurement.score },
  ]);

  return {
    userId: String(userId),
    score,
    goalType,
    breakdown: {
      workout,
      nutrition,
      measurement,
    },
    updatedAt: new Date().toISOString(),
  };
};

export const calculateCoachMemberScores = async (coachId, options = {}) => {
  const appointments = await Appointment.find({
    coachId: String(coachId),
    status: { $in: ['approved', 'completed'] },
  }).select('userId');

  const uniqueUserIds = Array.from(new Set(appointments.map((item) => String(item.userId)).filter(Boolean)));
  const rows = await Promise.all(uniqueUserIds.map((userId) => calculateUserProgressScore(userId, options)));
  const byUserId = rows.reduce((acc, row) => {
    acc[row.userId] = row;
    return acc;
  }, {});

  return {
    coachId: String(coachId),
    totalMembers: uniqueUserIds.length,
    byUserId,
    members: rows,
  };
};
