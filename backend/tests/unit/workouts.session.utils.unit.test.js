import {
  getMinimumRequiredSessionSeconds,
  resolveAssignedMinutesForDay,
  toPositiveIntOrZero,
} from '../../src/modules/workouts/workouts.session.utils.js';

describe('workouts.session.utils', () => {
  it('normalizes positive int values', () => {
    expect(toPositiveIntOrZero('12.7')).toBe(12);
    expect(toPositiveIntOrZero('x')).toBe(0);
    expect(toPositiveIntOrZero(-5)).toBe(0);
  });

  it('resolves assigned minutes from direct day duration', () => {
    const plan = { planDurationMinutes: 45 };
    const day = { durationMinutes: 60 };
    expect(resolveAssignedMinutesForDay(plan, day)).toBe(60);
  });

  it('resolves assigned minutes from assigned exercise indexes', () => {
    const plan = {
      planDurationMinutes: 45,
      exercises: [
        { assignedMinutes: 20 },
        { assignedMinutes: 25 },
      ],
    };
    const day = { assignedExerciseIndexes: [0, 1], exerciseIndexes: [] };
    expect(resolveAssignedMinutesForDay(plan, day)).toBe(45);
  });

  it('falls back to planDurationMinutes/default when day is missing', () => {
    expect(resolveAssignedMinutesForDay({ planDurationMinutes: 50 }, null)).toBe(50);
    expect(resolveAssignedMinutesForDay({}, null)).toBe(45);
  });

  it('calculates minimum required session seconds', () => {
    expect(getMinimumRequiredSessionSeconds(1)).toBe(120);
    expect(getMinimumRequiredSessionSeconds(45)).toBe(540);
  });
});
