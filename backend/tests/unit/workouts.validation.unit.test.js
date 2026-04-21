import {
  createWorkoutPlanSchema,
  submitWorkoutPlanSchema,
  workoutQuerySchema,
  workoutSessionProgressSchema,
} from '../../src/modules/workouts/workouts.validation.js';

describe('workouts.validation schemas', () => {
  it('accepts valid workout query with string boolean and numeric ids', () => {
    const parsed = workoutQuerySchema.safeParse({
      coachId: 10,
      userId: 'u-1',
      submitted: 'true',
      limit: '20',
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data.submitted).toBe(true);
    expect(parsed.data.coachId).toBe('10');
  });

  it('accepts valid create workout plan payload', () => {
    const result = createWorkoutPlanSchema.safeParse({
      coachId: 'coach-1',
      userId: 'user-1',
      planTitle: 'Beginner Plan',
      durationDays: 30,
      daysPerWeek: 4,
      exercises: [{ name: 'Push Up', amount: '3 x 12' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects create workout payload without exercises', () => {
    const result = createWorkoutPlanSchema.safeParse({
      coachId: 'coach-1',
      userId: 'user-1',
      planTitle: 'Invalid Plan',
      exercises: [],
    });
    expect(result.success).toBe(false);
  });

  it('validates submit mode/week number shape', () => {
    expect(submitWorkoutPlanSchema.safeParse({ mode: 'week', weekNumber: 2 }).success).toBe(true);
    expect(submitWorkoutPlanSchema.safeParse({ mode: 'week', weekNumber: 0 }).success).toBe(false);
  });

  it('validates session progress payload', () => {
    expect(workoutSessionProgressSchema.safeParse({
      userId: 'user-1',
      exerciseIndex: 0,
      done: true,
      elapsedSeconds: 120,
    }).success).toBe(true);
    expect(workoutSessionProgressSchema.safeParse({
      userId: 'user-1',
      exerciseIndex: -1,
      done: true,
    }).success).toBe(false);
  });
});
