export const MIN_SESSION_SECONDS_ABSOLUTE = 120;
export const MIN_SESSION_COMPLETION_RATIO = 0.2;

export const toPositiveIntOrZero = (value) => {
  const next = Number(value);
  if (!Number.isFinite(next) || next <= 0) return 0;
  return Math.floor(next);
};

export const resolveAssignedMinutesForDay = (plan, day) => {
  if (!day) return toPositiveIntOrZero(plan?.planDurationMinutes) || 45;
  const directDayMinutes = toPositiveIntOrZero(day.durationMinutes);
  if (directDayMinutes > 0) return directDayMinutes;

  const allExercises = Array.isArray(plan?.exercises) ? plan.exercises : [];
  const indexes = (
    Array.isArray(day.assignedExerciseIndexes) && day.assignedExerciseIndexes.length
      ? day.assignedExerciseIndexes
      : (Array.isArray(day.exerciseIndexes) ? day.exerciseIndexes : [])
  );

  const summed = indexes.reduce((total, index) => {
    const row = allExercises[Number(index)];
    return total + toPositiveIntOrZero(row?.assignedMinutes);
  }, 0);
  if (summed > 0) return summed;

  return toPositiveIntOrZero(plan?.planDurationMinutes) || 45;
};

export const getMinimumRequiredSessionSeconds = (assignedMinutes) =>
  Math.max(
    MIN_SESSION_SECONDS_ABSOLUTE,
    Math.floor(Number(assignedMinutes || 0) * 60 * MIN_SESSION_COMPLETION_RATIO),
  );
