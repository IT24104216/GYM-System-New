import {
  buildDailySummaries,
  evaluateMealQuality,
  RISK_WINDOW_DAYS,
} from './mealRiskScoring.js';

describe('mealRiskScoring utils', () => {
  it('builds daily summaries across requested window', () => {
    const logs = [
      { logDate: '2026-03-20', calories: 500, protein: 20, carbs: 60, fat: 10 },
      { logDate: '2026-03-20', calories: 300, protein: 10, carbs: 30, fat: 5 },
      { logDate: '2026-03-21', calories: 700, protein: 40, carbs: 80, fat: 20 },
    ];

    const result = buildDailySummaries(logs, '2026-03-21', 3);
    expect(result).toHaveLength(3);
    expect(result[0].iso).toBe('2026-03-19');
    expect(result[1]).toMatchObject({
      iso: '2026-03-20',
      calories: 800,
      protein: 30,
      carbs: 90,
      fat: 15,
      mealCount: 2,
    });
    expect(result[2].iso).toBe('2026-03-21');
  });

  it('uses default window days when not provided', () => {
    const result = buildDailySummaries([], '2026-03-21');
    expect(result).toHaveLength(RISK_WINDOW_DAYS);
  });

  it('returns neutral level when no meals are logged', () => {
    const quality = evaluateMealQuality({ calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 });
    expect(quality.level).toBe('neutral');
    expect(quality.score).toBe(0);
  });

  it('returns green for balanced intake', () => {
    const quality = evaluateMealQuality({
      calories: 2100,
      protein: 120,
      carbs: 260,
      fat: 65,
      mealCount: 4,
    });
    expect(quality.level).toBe('green');
    expect(quality.score).toBeGreaterThanOrEqual(80);
  });

  it('returns red for poor intake', () => {
    const quality = evaluateMealQuality({
      calories: 700,
      protein: 25,
      carbs: 40,
      fat: 50,
      mealCount: 1,
    });
    expect(quality.level).toBe('red');
    expect(quality.score).toBeLessThan(55);
  });
});
