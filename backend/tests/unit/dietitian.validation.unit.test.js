import {
  createDietitianSlotSchema,
  dietitianProfileSchema,
  updateDietitianSlotSchema,
} from '../../src/modules/dietitian/dietitian.validation.js';

describe('dietitian.validation schemas', () => {
  it('accepts valid dietitian profile payload', () => {
    const result = dietitianProfileSchema.safeParse({
      qualifications: 'BSc Nutrition',
      specialization: 'Weight Loss',
      experienceYears: 3,
      phone: '0771234567',
      joinDate: '2026-03-21',
      rating: 4.8,
    });
    expect(result.success).toBe(true);
  });

  it('rejects profile when qualifications/experience are missing', () => {
    const result = dietitianProfileSchema.safeParse({
      qualifications: '',
      experienceYears: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects profile with invalid phone/date format', () => {
    const result = dietitianProfileSchema.safeParse({
      qualifications: 'BSc Nutrition',
      experienceYears: 4,
      phone: 'abc',
      joinDate: '21-03-2026',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid create slot payload', () => {
    const result = createDietitianSlotSchema.safeParse({
      date: '2026-03-25',
      startTime: '09:00',
      endTime: '10:00',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid create slot payload', () => {
    const result = createDietitianSlotSchema.safeParse({
      date: '2026-02-31',
      startTime: '9AM',
      endTime: '10AM',
    });
    expect(result.success).toBe(false);
  });

  it('requires at least one field for slot update', () => {
    const empty = updateDietitianSlotSchema.safeParse({});
    const valid = updateDietitianSlotSchema.safeParse({ notes: 'Updated note' });
    expect(empty.success).toBe(false);
    expect(valid.success).toBe(true);
  });
});
