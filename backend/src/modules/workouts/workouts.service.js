export function getNoteValue(notes, key) {
  if (!notes) return '';
  const pattern = new RegExp(`${key}:\\s*([^|]+)`, 'i');
  const match = notes.match(pattern);
  return match?.[1]?.trim() || '';
}

export function derivePriority(appointment) {
  const notePriority = getNoteValue(appointment.notes, 'Priority');
  if (['high', 'urgent'].includes(notePriority.toLowerCase())) return 'High';
  if (notePriority.toLowerCase() === 'low') return 'Low';
  return 'Medium';
}

export function isOnlineAppointment(appointment) {
  const byNote = getNoteValue(appointment.notes, 'Appointment Type').toLowerCase();
  return byNote === 'online';
}

export const toIsoDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const todayIso = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTotalWeeks = (planOrPayload) => {
  const durationDays = Number(planOrPayload?.durationDays) || 30;
  return Math.max(1, Math.ceil(durationDays / 7));
};

export const normalizePublishedWeeks = (weeks = [], totalWeeks = 1) => (
  [...new Set((Array.isArray(weeks) ? weeks : [])
    .map((w) => Number(w))
    .filter((w) => Number.isInteger(w) && w >= 1 && w <= totalWeeks))]
    .sort((a, b) => a - b)
);

export const getWeekNumberFromDay = (dayNumber) => Math.max(1, Math.ceil(Number(dayNumber) / 7));

export const escapeRegExp = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isWorkoutDayAssigned = (day) => {
  if (day?.isRest) return true;
  const hasAssignedExercises = Array.isArray(day?.assignedExerciseIndexes)
    && day.assignedExerciseIndexes.length > 0;
  return Boolean(day?.assigned) && hasAssignedExercises;
};

export const buildProgramDays = (payload) => {
  if (Array.isArray(payload.programDays) && payload.programDays.length) {
    return payload.programDays
      .map((day, idx) => ({
        dayNumber: Number(day.dayNumber) || idx + 1,
        date: toIsoDate(day.date) || todayIso(),
        isRest: Boolean(day.isRest),
        title: String(day.title || ''),
        muscles: String(day.muscles || ''),
        durationMinutes: Number(day.durationMinutes) || Number(payload.planDurationMinutes) || 45,
        level: String(day.level || 'Coach Plan'),
        rating: Number(day.rating || 4.7),
        exerciseIndexes: Array.isArray(day.exerciseIndexes) ? day.exerciseIndexes.map((i) => Number(i)).filter((i) => Number.isInteger(i) && i >= 0) : [],
        assigned: Boolean(day.assigned),
        assignedAt: day.assignedAt ? new Date(day.assignedAt) : null,
        assignedExerciseIndexes: Array.isArray(day.assignedExerciseIndexes)
          ? day.assignedExerciseIndexes.map((i) => Number(i)).filter((i) => Number.isInteger(i) && i >= 0)
          : [],
        done: Boolean(day.done),
        completedAt: day.done ? (day.completedAt ? new Date(day.completedAt) : new Date()) : null,
      }))
      .sort((a, b) => a.dayNumber - b.dayNumber);
  }

  const durationDays = Number(payload.durationDays) || 30;
  const daysPerWeek = Math.max(1, Math.min(7, Number(payload.daysPerWeek) || 4));
  const start = toIsoDate(payload.startDate) || todayIso();
  const startDate = new Date(`${start}T00:00:00`);
  const exercises = Array.isArray(payload.exercises) ? payload.exercises : [];
  const builderType = String(payload.builderType || 'template');

  const splitByDaysPerWeek = {
    1: ['Full Body'],
    2: ['Upper Body', 'Lower Body'],
    3: ['Push', 'Pull', 'Legs'],
    4: ['Upper Body', 'Lower Body', 'Push', 'Pull'],
    5: ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body'],
    6: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'],
    7: ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Core', 'Conditioning'],
  };
  const splitCycle = splitByDaysPerWeek[daysPerWeek] || splitByDaysPerWeek[4];
  const splitToMuscles = {
    Push: 'Chest, Shoulders, Triceps',
    Pull: 'Back, Rear Delts, Biceps',
    Legs: 'Quads, Hamstrings, Glutes, Calves',
    'Upper Body': 'Chest, Back, Shoulders, Arms',
    'Lower Body': 'Quads, Hamstrings, Glutes, Calves',
    'Full Body': 'Full Body',
    Core: 'Core, Stability',
    Conditioning: 'Cardio, Conditioning',
  };

  const days = [];
  let workoutDayCount = 0;
  for (let offset = 0; offset < durationDays; offset += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + offset);
    const dateIso = toIsoDate(date) || start;
    const dayOfWeek = date.getDay();
    const positionInWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    const isWorkout = positionInWeek <= daysPerWeek;

    let dayTitle = 'Rest Day';
    let dayMuscles = 'Recovery';
    const exerciseIndexes = [];

    if (isWorkout) {
      const splitName = splitCycle[workoutDayCount % splitCycle.length] || 'Workout';
      const weekNumber = Math.floor(offset / 7) + 1;
      const phaseLabel =
        weekNumber <= 1
          ? 'Foundation'
          : weekNumber <= 2
            ? 'Progressive Load'
            : weekNumber <= 3
              ? 'Intensity'
              : 'Review';

      dayTitle = `${splitName} - ${phaseLabel}`;
      dayMuscles = splitToMuscles[splitName] || (payload.planTitle || 'Coach Plan');

      workoutDayCount += 1;
    }

    days.push({
      dayNumber: offset + 1,
      date: dateIso,
      isRest: !isWorkout,
      title:
        builderType === 'custom'
          ? isWorkout
            ? (payload.planTitle || `Day ${offset + 1} Workout`)
            : 'Rest Day'
          : dayTitle,
      muscles:
        builderType === 'custom'
          ? isWorkout
            ? (payload.planTitle || 'Coach Plan')
            : 'Recovery'
          : dayMuscles,
      durationMinutes: Number(payload.planDurationMinutes) || 45,
      level: 'Coach Plan',
      rating: 4.7,
      exerciseIndexes: isWorkout && exercises.length ? exerciseIndexes : [],
      assigned: !isWorkout,
      assignedAt: !isWorkout ? new Date() : null,
      assignedExerciseIndexes: [],
      done: false,
      completedAt: null,
    });
  }

  return days;
};
