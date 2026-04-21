import {
  escapeRegExp,
  getScopedDietitianId,
  getScopedUserId,
  hasAtLeastOneMealName,
  toNumber,
} from '../../src/modules/mealPlans/mealPlans.service.js';

describe('mealPlans.service utilities', () => {
  it('detects meal plan has at least one named meal', () => {
    const withMeal = {
      breakfast: [{ mealName: '' }],
      lunch: [{ mealName: 'Rice and curry' }],
      dinner: [{ mealName: '' }],
      snacks: [{ mealName: '' }],
    };
    const withoutMeal = {
      breakfast: [{ mealName: '' }],
      lunch: [{ mealName: '   ' }],
      dinner: [{ mealName: '' }],
      snacks: [{ mealName: '' }],
    };

    expect(hasAtLeastOneMealName(withMeal)).toBe(true);
    expect(hasAtLeastOneMealName(withoutMeal)).toBe(false);
  });

  it('scopes user id by role', () => {
    const adminReq = { user: { role: 'admin', id: 'admin-1' } };
    const userReq = { user: { role: 'user', id: 'user-1' } };

    expect(getScopedUserId(adminReq, 'fallback-user')).toBe('fallback-user');
    expect(getScopedUserId(userReq, 'fallback-user')).toBe('user-1');
  });

  it('scopes dietitian id by role', () => {
    const adminReq = { user: { role: 'admin', id: 'admin-1' } };
    const dietitianReq = { user: { role: 'dietitian', id: 'dietitian-1' } };

    expect(getScopedDietitianId(adminReq, 'fallback-d')).toBe('fallback-d');
    expect(getScopedDietitianId(dietitianReq, 'fallback-d')).toBe('dietitian-1');
  });

  it('converts finite values to number and non-finite to 0', () => {
    expect(toNumber('42')).toBe(42);
    expect(toNumber('x')).toBe(0);
  });

  it('escapes regex chars safely', () => {
    expect(escapeRegExp('meal(plan)')).toBe('meal\\(plan\\)');
  });
});
