import {
  createMealLibrarySchema,
  nutritionSearchQuerySchema,
  updateFoodLogSchema,
  updateMealLibrarySchema,
  upsertDietPlanSchema,
} from '../../src/modules/mealPlans/mealPlans.validation.js';

describe('mealPlans.validation schemas', () => {
  it('accepts valid create meal library payload and normalizes numeric strings', () => {
    const result = createMealLibrarySchema.safeParse({
      dietitianId: 12,
      category: 'weight_loss',
      mealName: 'Chicken Salad',
      calories: '250',
      protein: '20',
    });
    expect(result.success).toBe(true);
    expect(result.data.dietitianId).toBe('12');
    expect(result.data.calories).toBe(250);
  });

  it('rejects invalid meal library payload', () => {
    const result = createMealLibrarySchema.safeParse({
      dietitianId: 'd-1',
      category: 'invalid',
      mealName: '',
    });
    expect(result.success).toBe(false);
  });

  it('requires at least one field in update schemas', () => {
    expect(updateMealLibrarySchema.safeParse({}).success).toBe(false);
    expect(updateMealLibrarySchema.safeParse({ mealName: 'Updated Meal' }).success).toBe(true);
    expect(updateFoodLogSchema.safeParse({}).success).toBe(false);
    expect(updateFoodLogSchema.safeParse({ notes: 'updated' }).success).toBe(true);
  });

  it('validates complete upsert diet plan payload', () => {
    const result = upsertDietPlanSchema.safeParse({
      dietitianId: 'd1',
      userId: 'u1',
      breakfast: [{ mealName: 'Oats' }],
      lunch: [{ mealName: 'Rice' }],
      dinner: [{ mealName: 'Soup' }],
      snacks: [{ mealName: 'Nuts' }],
    });
    expect(result.success).toBe(true);
  });

  it('validates nutrition search min query length', () => {
    expect(nutritionSearchQuerySchema.safeParse({ q: 'ap' }).success).toBe(true);
    expect(nutritionSearchQuerySchema.safeParse({ q: 'a' }).success).toBe(false);
  });
});
