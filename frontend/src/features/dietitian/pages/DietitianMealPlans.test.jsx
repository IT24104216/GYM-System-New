import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DietitianMealPlans from './DietitianMealPlans.jsx';

const mockGetMealLibraryItems = vi.fn();

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'diet-1', name: 'Dietitian One' },
  }),
}));

vi.mock('../api/dietitian.api', () => ({
  createMealLibraryItem: vi.fn(),
  deleteMealLibraryItem: vi.fn(),
  getMealLibraryItems: (...args) => mockGetMealLibraryItems(...args),
  searchNutritionFoods: vi.fn().mockResolvedValue({ data: { data: [] } }),
  updateMealLibraryItem: vi.fn(),
}));

describe('DietitianMealPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMealLibraryItems.mockResolvedValue({
      data: {
        data: [
          {
            _id: 'm1',
            dietitianId: 'diet-1',
            category: 'weight_gain',
            mealName: 'Power Oats',
            calories: 450,
            protein: 20,
            carbs: 58,
            lipids: 9,
            vitamins: 'B, D',
            description: 'High energy breakfast',
          },
        ],
      },
    });
  });

  it('loads and renders meal list for dietitian', async () => {
    render(<DietitianMealPlans />);

    expect(screen.getByText(/meal plans/i)).toBeInTheDocument();
    await waitFor(() => expect(mockGetMealLibraryItems).toHaveBeenCalledWith({ dietitianId: 'diet-1' }));

    expect(await screen.findByText('Power Oats')).toBeInTheDocument();
    expect(screen.getByText(/calories: 450/i)).toBeInTheDocument();
  });

  it('shows validation warning when required add form fields are missing', async () => {
    render(<DietitianMealPlans />);
    await waitFor(() => expect(mockGetMealLibraryItems).toHaveBeenCalled());

    fireEvent.click(screen.getAllByRole('button', { name: /add meal/i })[0]);
    expect(await screen.findByText(/meal name, calories, and protein are required/i)).toBeInTheDocument();
  });
});

