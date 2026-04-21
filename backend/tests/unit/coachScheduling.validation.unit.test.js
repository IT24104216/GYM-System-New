import {
  coachIdParamsSchema,
  createCoachSlotSchema,
  slotIdParamsSchema,
  updateCoachSlotSchema,
} from '../../src/modules/coach/coachScheduling.validation.js';

describe('coachScheduling.validation schemas', () => {
  it('accepts valid params schemas', () => {
    expect(coachIdParamsSchema.safeParse({ coachId: 'abc123' }).success).toBe(true);
    expect(slotIdParamsSchema.safeParse({ coachId: 'abc123', slotId: 'slot456' }).success).toBe(true);
  });

  it('accepts valid create slot payload', () => {
    const result = createCoachSlotSchema.safeParse({
      date: '2026-03-25',
      startTime: '09:00',
      endTime: '10:00',
      sessionType: 'Online',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid create slot payload', () => {
    const result = createCoachSlotSchema.safeParse({
      date: '25-03-2026',
      startTime: '9AM',
      endTime: '10AM',
    });
    expect(result.success).toBe(false);
  });

  it('requires at least one field for update payload', () => {
    expect(updateCoachSlotSchema.safeParse({}).success).toBe(false);
    expect(updateCoachSlotSchema.safeParse({ notes: 'updated' }).success).toBe(true);
  });
});
