const DIETITIAN_MEALS_STORAGE_KEY = 'dietitian.meals.v1';

const defaultMealSuggestions = [
  {
    id: 1001,
    category: 'weight_gain',
    mealName: 'Chicken Rice Bowl',
    calories: 620,
    protein: 42,
    carbs: 68,
    lipids: 18,
    vitamins: 'A, B6, C',
    description: 'High-protein lunch with quality carbs for mass gain.',
  },
  {
    id: 1002,
    category: 'weight_loss',
    mealName: 'Grilled Fish Salad',
    calories: 360,
    protein: 34,
    carbs: 18,
    lipids: 14,
    vitamins: 'D, K, C',
    description: 'Low-calorie, high-protein meal for fat-loss phase.',
  },
  {
    id: 1003,
    category: 'other',
    mealName: 'Greek Yogurt Parfait',
    calories: 290,
    protein: 19,
    carbs: 32,
    lipids: 8,
    vitamins: 'B12, D',
    description: 'Balanced snack with probiotics and slow-release carbs.',
  },
  {
    id: 1004,
    category: 'weight_gain',
    mealName: 'Oats Peanut Smoothie',
    calories: 540,
    protein: 26,
    carbs: 61,
    lipids: 21,
    vitamins: 'E, B1, B2',
    description: 'Dense calorie shake for bulking plans.',
  },
  {
    id: 1005,
    category: 'weight_loss',
    mealName: 'Egg White Veggie Wrap',
    calories: 310,
    protein: 29,
    carbs: 24,
    lipids: 9,
    vitamins: 'A, C, K',
    description: 'Lean breakfast option with fiber-rich vegetables.',
  },
];

const normalizeMeal = (meal) => ({
  id: meal.id || Date.now(),
  category: meal.category || 'other',
  mealName: meal.mealName || '',
  calories: meal.calories ?? '',
  protein: meal.protein ?? '',
  carbs: meal.carbs ?? '',
  lipids: meal.lipids ?? '',
  vitamins: meal.vitamins || '',
  description: meal.description || '',
});

export const loadDietitianMeals = () => {
  if (typeof window === 'undefined') return defaultMealSuggestions;
  try {
    const raw = window.localStorage.getItem(DIETITIAN_MEALS_STORAGE_KEY);
    if (!raw) return defaultMealSuggestions;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultMealSuggestions;
    return parsed.map(normalizeMeal);
  } catch {
    return defaultMealSuggestions;
  }
};

export const saveDietitianMeals = (meals) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    DIETITIAN_MEALS_STORAGE_KEY,
    JSON.stringify((Array.isArray(meals) ? meals : []).map(normalizeMeal)),
  );
};

