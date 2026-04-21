import {
  escapeRegExp,
  getTotalWeeks,
  getWeekNumberFromDay,
  isOnlineAppointment,
  isWorkoutDayAssigned,
  normalizePublishedWeeks,
  toIsoDate,
} from '../../src/modules/workouts/workouts.service.js';

describe('workouts.service utilities', () => {
  it('extracts online appointment type from notes', () => {
    const appointment = { notes: 'Appointment Type: Online | Priority: High' };
    expect(isOnlineAppointment(appointment)).toBe(true);
  });

  it('returns iso date for valid date and null for invalid', () => {
    expect(toIsoDate('2026-03-21T10:30:00Z')).toBe('2026-03-21');
    expect(toIsoDate('not-a-date')).toBeNull();
  });

  it('calculates total weeks and week number correctly', () => {
    expect(getTotalWeeks({ durationDays: 30 })).toBe(5);
    expect(getWeekNumberFromDay(8)).toBe(2);
  });

  it('normalizes published week list', () => {
    expect(normalizePublishedWeeks([3, '1', 3, 8, -1], 5)).toEqual([1, 3]);
  });

  it('escapes regex chars safely', () => {
    expect(escapeRegExp('a+b?')).toBe('a\\+b\\?');
  });

  it('checks workout day assignment correctly', () => {
    expect(isWorkoutDayAssigned({ isRest: true })).toBe(true);
    expect(isWorkoutDayAssigned({ assigned: true, assignedExerciseIndexes: [0] })).toBe(true);
    expect(isWorkoutDayAssigned({ assigned: true, assignedExerciseIndexes: [] })).toBe(false);
  });
});
