import { renderHook, waitFor } from '@testing-library/react';
import {
  useDietitianMealsAndPlans,
  useDietitianTimeSlots,
} from './useDietitianDashboardData.js';

vi.mock('../api/dietitian.api', () => ({
  getDietitianSchedulingSlots: vi.fn(),
  getMealLibraryItems: vi.fn(),
  getDietitianClientPlans: vi.fn(),
  getDietitianAppointments: vi.fn(),
}));

import {
  getDietitianSchedulingSlots,
  getDietitianClientPlans,
  getMealLibraryItems,
} from '../api/dietitian.api';

describe('useDietitianDashboardData hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and maps dietitian time slots', async () => {
    getDietitianSchedulingSlots.mockResolvedValueOnce({
      data: { data: [{ _id: 's1', date: '2026-03-21', startTime: '09:00', endTime: '10:00' }] },
    });
    const setSlotError = vi.fn();

    const { result } = renderHook(() => useDietitianTimeSlots('d-1', setSlotError));

    await waitFor(() => expect(result.current.isSlotsLoading).toBe(false));
    expect(result.current.timeSlots[0]).toMatchObject({
      id: 's1',
      date: '2026-03-21',
      startTime: '09:00',
      endTime: '10:00',
    });
  });

  it('loads meal suggestions and saved client plans', async () => {
    getMealLibraryItems.mockResolvedValueOnce({
      data: { data: [{ _id: 'm1', mealName: 'Meal A' }] },
    });
    getDietitianClientPlans.mockResolvedValueOnce({
      data: {
        data: [
          {
            _id: 'p1',
            userId: 'u1',
            isSubmitted: true,
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: [],
            additionalNotes: '',
          },
        ],
      },
    });
    const setSlotError = vi.fn();

    const { result } = renderHook(() => useDietitianMealsAndPlans('d-1', setSlotError));

    await waitFor(() => expect(result.current.mealSuggestions.length).toBe(1));
    expect(result.current.savedDietPlans.u1).toBeTruthy();
    expect(result.current.savedDietPlans.u1.isSubmitted).toBe(true);
  });
});
