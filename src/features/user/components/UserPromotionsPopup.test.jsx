import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPromotionsPopup from './UserPromotionsPopup.jsx';

const mockNavigate = vi.fn();
const mockGetPublicPromotions = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/user/api/user.api', () => ({
  getPublicPromotions: (...args) => mockGetPublicPromotions(...args),
}));

describe('UserPromotionsPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads promotions and navigates on CTA click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    mockGetPublicPromotions.mockResolvedValue({
      data: {
        data: [
          {
            id: 'promo-1',
            title: 'Summer Offer',
            status: 'ACTIVE',
            description: 'Get 30% off plans.',
            target: 'Members',
            image: 'https://example.com/promo.jpg',
            link: '/user/ads-promotions',
          },
        ],
      },
    });

    render(<UserPromotionsPopup open onClose={onClose} placement="Dashboard Hero" />);

    await waitFor(() =>
      expect(mockGetPublicPromotions).toHaveBeenCalledWith({ limit: 3, placement: 'Dashboard Hero' }),
    );
    expect(await screen.findByText('Summer Offer')).toBeInTheDocument();

    await user.click(screen.getByText(/view offer/i));
    expect(mockNavigate).toHaveBeenCalledWith('/user/ads-promotions');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when promotions API fails', async () => {
    mockGetPublicPromotions.mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(<UserPromotionsPopup open onClose={vi.fn()} />);

    await waitFor(() => expect(mockGetPublicPromotions).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(container.firstChild).toBeNull());
  });
});
