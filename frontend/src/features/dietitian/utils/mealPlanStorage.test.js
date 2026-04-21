import { loadDietitianMeals, saveDietitianMeals } from './mealPlanStorage.js';

const STORAGE_KEY = 'dietitian.meals.v1';

describe('mealPlanStorage utils', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('loads default meals when storage is empty', () => {
    const meals = loadDietitianMeals();
    expect(Array.isArray(meals)).toBe(true);
    expect(meals.length).toBeGreaterThan(0);
  });

  it('saves and reloads normalized meals', () => {
    saveDietitianMeals([
      { id: 1, category: 'weight_gain', mealName: 'Test Meal', calories: 100 },
    ]);

    const loaded = loadDietitianMeals();
    expect(loaded[0]).toMatchObject({
      id: 1,
      category: 'weight_gain',
      mealName: 'Test Meal',
      calories: 100,
    });
  });

  it('falls back to default meals when stored json is invalid', () => {
    window.localStorage.setItem(STORAGE_KEY, '{bad-json');
    const meals = loadDietitianMeals();
    expect(Array.isArray(meals)).toBe(true);
    expect(meals.length).toBeGreaterThan(0);
  });
});
