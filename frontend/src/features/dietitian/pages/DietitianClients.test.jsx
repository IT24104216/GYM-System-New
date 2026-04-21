import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DietitianClients from './DietitianClients.jsx';

const mockGetDietitianAppointments = vi.fn();
const mockGetMealLibraryItems = vi.fn();
const mockGetDietitianClientPlans = vi.fn();

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'diet-1', name: 'Dr Fit' },
  }),
}));

vi.mock('@/shared/utils/storage', () => ({
  getToken: vi.fn(() => ''),
}));

vi.mock('@/features/dietitian/api/dietitian.api', () => ({
  deleteMealPlan: vi.fn(),
  getDietitianAppointments: (...args) => mockGetDietitianAppointments(...args),
  getDietitianClientPlans: (...args) => mockGetDietitianClientPlans(...args),
  getMealLibraryItems: (...args) => mockGetMealLibraryItems(...args),
  submitMealPlan: vi.fn(),
  upsertDietitianClientPlan: vi.fn(),
}));

describe('DietitianClients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDietitianAppointments.mockResolvedValue({
      data: {
        data: [
          {
            userId: 'u1',
            status: 'approved',
            startsAt: '2026-03-20T08:00:00.000Z',
            notes: 'DietitianId: diet-1 | Dietitian: Dr Fit | User Name: Client One | Goal: Meal Planning',
          },
          {
            userId: 'u2',
            status: 'approved',
            startsAt: '2026-03-20T09:00:00.000Z',
            notes: 'DietitianId: diet-1 | Dietitian: Dr Fit | User Name: Client Two | Goal: Meal Planning',
          },
          {
            userId: 'u3',
            status: 'approved',
            startsAt: '2026-03-20T10:00:00.000Z',
            notes: 'DietitianId: diet-1 | Dietitian: Dr Fit | User Name: Client Three | Goal: Meal Planning',
          },
          {
            userId: 'u4',
            status: 'approved',
            startsAt: '2026-03-20T11:00:00.000Z',
            notes: 'DietitianId: diet-1 | Dietitian: Dr Fit | User Name: Client Four | Goal: Meal Planning',
          },
        ],
      },
    });
    mockGetMealLibraryItems.mockResolvedValue({ data: { data: [] } });
    mockGetDietitianClientPlans.mockResolvedValue({ data: { data: [] } });
  });

  it('loads clients page and shows approved client cards', async () => {
    render(<DietitianClients />);

    expect(screen.getByText(/my clients/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(mockGetDietitianAppointments).toHaveBeenCalledWith({
        sessionType: 'nutrition',
        page: 1,
        limit: 300,
      }),
    );
    await waitFor(() => expect(mockGetMealLibraryItems).toHaveBeenCalledWith({ dietitianId: 'diet-1' }));
    await waitFor(() => expect(mockGetDietitianClientPlans).toHaveBeenCalledWith({ dietitianId: 'diet-1' }));

    expect(await screen.findByText('Client Four')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create diet plan/i })).toBeInTheDocument();
  });
});

