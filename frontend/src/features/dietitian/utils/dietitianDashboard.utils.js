export const tabItems = ['Members', 'Appointments', 'Time Slots'];

export const mealSections = [
  { key: 'breakfast', title: 'Breakfast Options', icon: '🌅' },
  { key: 'lunch', title: 'Lunch Options', icon: '🌞' },
  { key: 'dinner', title: 'Dinner Options', icon: '🌙' },
  { key: 'snacks', title: 'Snacks Options', icon: '🍎' },
];

export const createMealOption = () => ({
  mealName: '',
  description: '',
  calories: '',
  protein: '',
  carbs: '',
  lipids: '',
  vitamins: '',
  quantity: '1',
  unit: 'g',
});

export const FOOD_UNIT_OPTIONS = ['g', 'ml', 'cups', 'tbsp', 'tsp', 'piece'];

export const createDietPlanForm = () => ({
  breakfast: [createMealOption(), createMealOption(), createMealOption()],
  lunch: [createMealOption(), createMealOption(), createMealOption()],
  dinner: [createMealOption(), createMealOption(), createMealOption()],
  snacks: [createMealOption(), createMealOption(), createMealOption()],
  additionalNotes: '',
});

export const hasAnyMealName = (form) =>
  ['breakfast', 'lunch', 'dinner', 'snacks'].some((sectionKey) =>
    Array.isArray(form?.[sectionKey])
    && form[sectionKey].some((item) => String(item?.mealName || '').trim().length > 0),
  );

export const sanitizePlanSection = (section = []) =>
  (Array.isArray(section) ? section : []).map((item) => {
    const toNumericOrZero = (value) => {
      const trimmed = String(value ?? '').trim();
      if (!trimmed) return 0;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };
    return {
      mealName: String(item?.mealName || '').trim(),
      description: String(item?.description || '').trim(),
      calories: toNumericOrZero(item?.calories),
      protein: toNumericOrZero(item?.protein),
      carbs: toNumericOrZero(item?.carbs),
      lipids: toNumericOrZero(item?.lipids),
      vitamins: String(item?.vitamins || '').trim(),
      quantity: (() => {
        const parsed = Number(item?.quantity);
        if (!Number.isFinite(parsed) || parsed < 0.1) return 1;
        return parsed;
      })(),
      unit: FOOD_UNIT_OPTIONS.includes(String(item?.unit || '').trim())
        ? String(item?.unit || '').trim()
        : 'g',
    };
  });

export const getNoteValue = (notes, key) => {
  if (!notes) return '';
  const pattern = new RegExp(`${key}:\\s*([^|]+)`, 'i');
  const match = notes.match(pattern);
  return match?.[1]?.trim() || '';
};

export const getWeekdayLabel = (isoDate) => {
  if (!isoDate) return '';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { weekday: 'long' });
};

export const to12Hour = (time24) => {
  const [hoursRaw, minsRaw] = (time24 || '').split(':');
  const hours = Number(hoursRaw);
  const mins = Number(minsRaw);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return '';
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const converted = hours % 12 || 12;
  return `${String(converted).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${suffix}`;
};
