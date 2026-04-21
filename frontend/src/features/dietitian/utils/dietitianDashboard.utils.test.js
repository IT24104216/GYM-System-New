import {
  createDietPlanForm,
  createMealOption,
  hasAnyMealName,
  sanitizePlanSection,
  to12Hour,
  getWeekdayLabel,
} from './dietitianDashboard.utils.js';

describe('dietitianDashboard utils', () => {
  it('creates empty meal option template', () => {
    expect(createMealOption()).toEqual({
      mealName: '',
      description: '',
      calories: '',
      protein: '',
      carbs: '',
      lipids: '',
      vitamins: '',
    });
  });

  it('creates diet plan form with 4 sections and 3 options each', () => {
    const form = createDietPlanForm();
    expect(form.breakfast).toHaveLength(3);
    expect(form.lunch).toHaveLength(3);
    expect(form.dinner).toHaveLength(3);
    expect(form.snacks).toHaveLength(3);
  });

  it('detects if any meal name exists', () => {
    const form = createDietPlanForm();
    expect(hasAnyMealName(form)).toBe(false);
    form.lunch[1].mealName = 'Rice and curry';
    expect(hasAnyMealName(form)).toBe(true);
  });

  it('sanitizes section values and normalizes numeric fields', () => {
    const section = sanitizePlanSection([
      {
        mealName: '  Oats ',
        calories: '250',
        protein: 'abc',
        carbs: '-1',
        lipids: '12.5',
        vitamins: ' C ',
      },
    ]);

    expect(section[0]).toMatchObject({
      mealName: 'Oats',
      calories: 250,
      protein: 0,
      carbs: 0,
      lipids: 12.5,
      vitamins: 'C',
    });
  });

  it('formats weekday and time display values', () => {
    expect(getWeekdayLabel('2026-03-21')).toBeTruthy();
    expect(getWeekdayLabel('invalid')).toBe('');
    expect(to12Hour('13:05')).toBe('01:05 PM');
    expect(to12Hour('')).toBe('');
  });
});
