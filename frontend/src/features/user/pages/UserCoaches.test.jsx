import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import UserCoaches from './UserCoaches.jsx';

const mockNavigate = vi.fn();
const mockGetPublicCoaches = vi.fn();
const mockGetUserAppointments = vi.fn();
const mockGetFeedbacks = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
  }),
}));

vi.mock('@/features/user/api/user.api', () => ({
  getPublicCoaches: (...args) => mockGetPublicCoaches(...args),
  getUserAppointments: (...args) => mockGetUserAppointments(...args),
  getFeedbacks: (...args) => mockGetFeedbacks(...args),
  bookCoachAppointment: vi.fn(),
  createFeedback: vi.fn(),
  updateAppointmentStatus: vi.fn(),
  updateUserAppointment: vi.fn(),
}));

describe('UserCoaches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPublicCoaches.mockResolvedValue({
      data: {
        data: [{
          id: 'coach-1',
          name: 'Emma Carter',
          specialty: 'Strength Training',
          experience: '5 years',
          avatar: 'EC',
          tags: ['Weight Loss'],
          slotDate: new Date().toISOString().slice(0, 10),
          todaySlotRanges: [{ startTime: '08:00', endTime: '10:00' }],
        }],
      },
    });
    mockGetUserAppointments.mockResolvedValue({ data: { data: [] } });
    mockGetFeedbacks.mockResolvedValue({ data: { data: [] } });
  });

  it('renders coach page and loaded coach card', async () => {
    render(
      <MemoryRouter>
        <UserCoaches />
      </MemoryRouter>,
    );

    expect(screen.getByText(/choose your coach/i)).toBeInTheDocument();
    expect(await screen.findByText('Emma Carter')).toBeInTheDocument();
    expect(screen.getByText(/my bookings/i)).toBeInTheDocument();
  });
});
