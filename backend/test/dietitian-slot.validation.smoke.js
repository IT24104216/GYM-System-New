import assert from 'node:assert/strict';
import {
  createDietitianSlotSchema,
  updateDietitianSlotSchema,
} from '../src/modules/dietitian/dietitian.validation.js';

try {
  // Weekday should be allowed (all-week scheduling).
  const weekdayResult = createDietitianSlotSchema.safeParse({
    date: '2026-03-18', // Wednesday
    startTime: '09:00',
    endTime: '10:00',
    notes: 'weekday slot',
  });
  assert.equal(weekdayResult.success, true, 'Expected weekday date to be valid');

  // Weekend should also be allowed.
  const weekendResult = createDietitianSlotSchema.safeParse({
    date: '2026-03-21', // Saturday
    startTime: '09:00',
    endTime: '10:00',
    notes: 'weekend slot',
  });
  assert.equal(weekendResult.success, true, 'Expected weekend date to be valid');

  // Invalid calendar date must fail.
  const invalidDateResult = createDietitianSlotSchema.safeParse({
    date: '2026-02-30',
    startTime: '09:00',
    endTime: '10:00',
  });
  assert.equal(invalidDateResult.success, false, 'Expected invalid calendar date to fail');

  // Update schema should reject invalid date too.
  const invalidUpdateDateResult = updateDietitianSlotSchema.safeParse({
    date: '2026-02-30',
  });
  assert.equal(invalidUpdateDateResult.success, false, 'Expected invalid update date to fail');

  console.log('Dietitian slot validation smoke tests passed.');
  process.exitCode = 0;
} catch (error) {
  console.error('Dietitian slot validation smoke tests failed:', error?.message || error);
  process.exitCode = 1;
}
