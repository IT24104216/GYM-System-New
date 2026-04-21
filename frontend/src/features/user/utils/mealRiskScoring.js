const toIsoDate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const shiftIsoDate = (isoDate, offsetDays) => {
  const base = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return isoDate;
  base.setDate(base.getDate() + Number(offsetDays || 0));
  return toIsoDate(base);
};

export const RISK_WINDOW_DAYS = 7;

export const buildDailySummaries = (logs = [], endIso, days = RISK_WINDOW_DAYS) => {
  const grouped = new Map();
  (Array.isArray(logs) ? logs : []).forEach((log) => {
    const dateKey = String(log?.logDate || '').slice(0, 10);
    if (!dateKey) return;
    const prev = grouped.get(dateKey) || { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 };
    grouped.set(dateKey, {
      calories: prev.calories + Number(log?.calories || 0),
      protein: prev.protein + Number(log?.protein || 0),
      carbs: prev.carbs + Number(log?.carbs || 0),
      fat: prev.fat + Number(log?.fat || 0),
      mealCount: prev.mealCount + 1,
    });
  });

  return Array.from({ length: days }).map((_, idx) => {
    const offset = idx - (days - 1);
    const iso = shiftIsoDate(endIso, offset);
    const totals = grouped.get(iso) || { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 };
    return { iso, ...totals };
  });
};

export const evaluateMealQuality = (daySummary) => {
  const calories = Number(daySummary?.calories || 0);
  const protein = Number(daySummary?.protein || 0);
  const carbs = Number(daySummary?.carbs || 0);
  const fat = Number(daySummary?.fat || 0);
  const mealCount = Number(daySummary?.mealCount || 0);

  if (mealCount === 0) {
    return {
      level: 'neutral',
      score: 0,
      label: 'No logs yet',
      message: 'Add your meals to get personalized safety feedback for your My Plan.',
      reasons: [],
    };
  }

  const totalKcal = Math.max(calories, (protein * 4) + (carbs * 4) + (fat * 9), 1);
  const proteinShare = (protein * 4) / totalKcal;
  const carbShare = (carbs * 4) / totalKcal;
  const fatShare = (fat * 9) / totalKcal;

  let score = 100;
  const reasons = [];

  if (calories < 1000) {
    score -= 30;
    reasons.push('Calories are too low for training recovery.');
  } else if (calories < 1400) {
    score -= 15;
    reasons.push('Calories are a bit low for an active gym routine.');
  }

  if (protein < 60 || proteinShare < 0.15) {
    score -= 25;
    reasons.push('Protein is low for muscle recovery and performance.');
  }

  if (carbShare < 0.35) {
    score -= 12;
    reasons.push('Carbs are low, which can reduce workout energy.');
  } else if (carbShare > 0.65) {
    score -= 10;
    reasons.push('Carbs are high compared to the rest of your macros.');
  }

  if (fatShare > 0.4) {
    score -= 12;
    reasons.push('Fat ratio is high and may reduce macro balance.');
  }

  if (mealCount < 2) {
    score -= 8;
    reasons.push('Too few meals logged for a balanced daily pattern.');
  }

  score = Math.max(0, Math.round(score));

  if (score >= 80) {
    return {
      level: 'green',
      score,
      label: 'Balanced',
      message: 'Plan is balanced today. Keep this consistency for better gym results.',
      reasons,
    };
  }
  if (score >= 55) {
    return {
      level: 'yellow',
      score,
      label: 'Moderate risk',
      message: 'Moderate risk: your current meal balance may slow progress if repeated.',
      reasons,
    };
  }
  return {
    level: 'red',
    score,
    label: 'High risk',
    message: 'High risk if continued: poor recovery, fatigue risk, and possible muscle-loss trend.',
    reasons,
  };
};
