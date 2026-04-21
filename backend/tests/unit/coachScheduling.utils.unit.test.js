import {
  hasStartTimePassedForToday,
  hasTimeOverlap,
  isEndAfterStart,
  isPastSlot,
  toLocalIsoDate,
  timeToMinutes,
} from '../../src/modules/coach/coachScheduling.utils.js';

describe('coachScheduling.utils', () => {
  it('converts HH:mm to minutes', () => {
    expect(timeToMinutes('00:30')).toBe(30);
    expect(timeToMinutes('09:15')).toBe(555);
  });

  it('validates end time after start time', () => {
    expect(isEndAfterStart('09:00', '10:00')).toBe(true);
    expect(isEndAfterStart('10:00', '10:00')).toBe(false);
  });

  it('formats local ISO date', () => {
    expect(toLocalIsoDate(new Date('2026-03-21T00:00:00.000Z'))).toMatch(/2026-03-2[01]/);
  });

  it('checks past-date slot', () => {
    expect(isPastSlot('2026-03-20', '2026-03-21')).toBe(true);
    expect(isPastSlot('2026-03-21', '2026-03-21')).toBe(false);
  });

  it('detects passed start time for today', () => {
    const now = new Date('2026-03-21T10:30:00');
    expect(hasStartTimePassedForToday('2026-03-21', '10:00', now)).toBe(true);
    expect(hasStartTimePassedForToday('2026-03-21', '11:00', now)).toBe(false);
    expect(hasStartTimePassedForToday('2026-03-22', '09:00', now)).toBe(false);
  });

  it('detects overlapping time ranges', () => {
    expect(hasTimeOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true);
    expect(hasTimeOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
  });
});
