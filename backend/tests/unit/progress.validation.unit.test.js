import {
  progressCoachParamsSchema,
  progressScoreQuerySchema,
  progressUserParamsSchema,
  upsertMeasurementSchema,
} from '../../src/modules/progress/progress.validation.js';

describe('progress.validation schemas', () => {
  it('normalizes user and coach ids to string', () => {
    const user = progressUserParamsSchema.safeParse({ userId: 101 });
    const coach = progressCoachParamsSchema.safeParse({ coachId: 202 });

    expect(user.success).toBe(true);
    expect(coach.success).toBe(true);
    expect(user.data.userId).toBe('101');
    expect(coach.data.coachId).toBe('202');
  });

  it('applies days default and validates range', () => {
    const withDefault = progressScoreQuerySchema.safeParse({});
    const tooSmall = progressScoreQuerySchema.safeParse({ days: 3 });
    const tooLarge = progressScoreQuerySchema.safeParse({ days: 200 });

    expect(withDefault.success).toBe(true);
    expect(withDefault.data.days).toBe(7);
    expect(tooSmall.success).toBe(false);
    expect(tooLarge.success).toBe(false);
  });

  it('accepts valid measurement payload and rejects invalid date/negative values', () => {
    const valid = upsertMeasurementSchema.safeParse({
      date: '2026-03-21',
      chest: 95,
      waist: 82,
      arms: 34,
      thighs: 54,
      bodyFat: 19,
      weight: 72,
    });
    const invalid = upsertMeasurementSchema.safeParse({
      date: '21-03-2026',
      chest: -1,
      waist: 82,
      arms: 34,
      thighs: 54,
      bodyFat: 19,
      weight: 72,
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });
});
