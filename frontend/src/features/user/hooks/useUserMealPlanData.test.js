import { act, renderHook, waitFor } from '@testing-library/react';
import {
  useDietitianPlan,
  useNutritionSuggestions,
  useUserFoodLogs,
} from './useUserMealPlanData.js';

vi.mock('../api/user.api', () => ({
  getUserDietitianMealPlan: vi.fn(),
  getUserFoodLogs: vi.fn(),
  searchNutritionFoods: vi.fn(),
}));

import {
  getUserDietitianMealPlan,
  getUserFoodLogs,
  searchNutritionFoods,
} from '../api/user.api';

describe('useUserMealPlanData hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads dietitian plan successfully', async () => {
    getUserDietitianMealPlan.mockResolvedValueOnce({ data: { data: { id: 'plan-1' } } });

    const { result } = renderHook(() => useDietitianPlan('user-1'));

    await waitFor(() => expect(result.current.isPlanLoading).toBe(false));
    expect(result.current.dietitianPlan).toEqual({ id: 'plan-1' });
    expect(result.current.planError).toBe('');
  });

  it('loads user food logs and supports refresh', async () => {
    getUserFoodLogs.mockResolvedValue({ data: { data: [{ id: 'log-1' }] } });

    const { result } = renderHook(() => useUserFoodLogs('user-1', '2026-03-21', 'custom'));

    await waitFor(() => expect(result.current.foodLogs.length).toBeGreaterThan(0));
    expect(result.current.allFoodLogs.length).toBeGreaterThan(0);

    await act(async () => {
      await result.current.refreshFoodLogs();
      await result.current.refreshAllFoodLogs();
    });

    expect(getUserFoodLogs).toHaveBeenCalled();
  });

  it('fetches nutrition suggestions when dialog is open and query length >= 2', async () => {
    vi.useFakeTimers();
    searchNutritionFoods.mockResolvedValueOnce({ data: { data: [{ name: 'Apple' }] } });

    const { result } = renderHook(() => useNutritionSuggestions(true, 'ap'));

    await act(async () => {
      vi.advanceTimersByTime(260);
      await Promise.resolve();
    });

    expect(result.current.nutritionOptions).toEqual([{ name: 'Apple' }]);
    vi.useRealTimers();
  });
});
