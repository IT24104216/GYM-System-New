import {
  buildDietPlanSummary,
  buildSectionData,
  mapLocalNutritionRows,
  mapUsdaFoods,
} from '../../src/modules/mealPlans/mealPlans.mapper.js';

describe('mealPlans.mapper', () => {
  it('builds section data and totals from meal plan', () => {
    const plan = {
      breakfast: [{ mealName: 'Oats', calories: 300, protein: 12, carbs: 45, lipids: 6 }],
      lunch: [{ mealName: 'Rice', calories: 500, protein: 20, carbs: 70, lipids: 10 }],
      dinner: [{ mealName: '' }],
      snacks: [{ mealName: 'Banana', calories: 100, protein: 1, carbs: 23, lipids: 0 }],
    };

    const sections = buildSectionData(plan);
    const summary = buildDietPlanSummary(sections);

    expect(sections.find((s) => s.key === 'dinner')?.items.length).toBe(0);
    expect(summary).toEqual({
      totalCalories: 900,
      protein: 33,
      carbs: 138,
      fat: 16,
    });
  });

  it('maps local nutrition rows and filters empty names', () => {
    const rows = [
      { _id: '1', name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
      { _id: '2', name: '   ', calories: 10 },
    ];
    const mapped = mapLocalNutritionRows(rows);
    expect(mapped.length).toBe(1);
    expect(mapped[0]).toMatchObject({
      id: '1',
      name: 'Apple',
      source: 'local-db',
    });
  });

  it('maps USDA nutrients correctly', () => {
    const foods = [
      {
        fdcId: 123,
        description: 'Chicken Breast',
        foodNutrients: [
          { nutrientName: 'Energy', value: 165 },
          { nutrientName: 'Protein', value: 31 },
          { nutrientName: 'Carbohydrate, by difference', value: 0 },
          { nutrientName: 'Total lipid (fat)', value: 3.6 },
        ],
      },
    ];
    const mapped = mapUsdaFoods(foods);
    expect(mapped[0]).toMatchObject({
      source: 'usda',
      id: '123',
      name: 'Chicken Breast',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    });
  });
});
