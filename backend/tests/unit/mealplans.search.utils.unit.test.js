import {
  dedupeNutritionItemsByName,
  mergeNutritionResults,
} from '../../src/modules/mealPlans/mealPlans.search.utils.js';

describe('mealPlans.search.utils', () => {
  it('dedupes by normalized name and removes empty names', () => {
    const items = [
      { name: 'Apple', source: 'local' },
      { name: ' apple ', source: 'usda' },
      { name: '', source: 'local' },
      { name: 'Banana', source: 'local' },
    ];

    const result = dedupeNutritionItemsByName(items);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Apple');
    expect(result[1].name).toBe('Banana');
  });

  it('merges local + external results and applies limit', () => {
    const local = [
      { name: 'Apple', source: 'local' },
      { name: 'Banana', source: 'local' },
    ];
    const external = [
      { name: 'Banana', source: 'usda' },
      { name: 'Carrot', source: 'usda' },
    ];

    const result = mergeNutritionResults(local, external, 2);
    expect(result).toHaveLength(2);
    expect(result.map((x) => x.name)).toEqual(['Apple', 'Banana']);
  });
});
