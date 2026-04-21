import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminPromotions from './AdminPromotions.jsx';

const mockGetPromotions = vi.fn();
const mockCreatePromotion = vi.fn();

vi.mock('@/features/admin/api/admin.api', () => ({
  createPromotion: (...args) => mockCreatePromotion(...args),
  deletePromotion: vi.fn(),
  getPromotions: (...args) => mockGetPromotions(...args),
  updatePromotion: vi.fn(),
}));

describe('AdminPromotions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPromotions.mockResolvedValue({
      data: {
        data: [
          {
            id: 'p1',
            title: 'Summer Offer',
            placement: 'Dashboard Hero',
            target: 'All Members',
            status: 'ACTIVE',
            budget: 1200,
            startDate: '2026-03-21',
            endDate: '2026-04-01',
          },
        ],
      },
    });
  });

  it('loads promotions list and renders campaign card', async () => {
    render(<AdminPromotions />);

    await waitFor(() => expect(mockGetPromotions).toHaveBeenCalled());
    expect(await screen.findByText('Summer Offer')).toBeInTheDocument();
    expect(screen.getByText(/live ads & promotions/i)).toBeInTheDocument();
  });

  it('shows validation error when required fields are missing', async () => {
    render(<AdminPromotions />);
    await waitFor(() => expect(mockGetPromotions).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /launch campaign/i }));
    expect(await screen.findByText(/please fill title, budget, start date, and end date/i)).toBeInTheDocument();
    expect(mockCreatePromotion).not.toHaveBeenCalled();
  });
});
