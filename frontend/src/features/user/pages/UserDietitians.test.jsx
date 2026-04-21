import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import UserDietitians from './UserDietitians.jsx';

const mockNavigate = vi.fn();
const mockGetPublicDietitians = vi.fn();
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
  getPublicDietitians: (...args) => mockGetPublicDietitians(...args),
  getUserAppointments: (...args) => mockGetUserAppointments(...args),
  getFeedbacks: (...args) => mockGetFeedbacks(...args),
  bookDietitianAppointment: vi.fn(),
  createFeedback: vi.fn(),
  updateAppointmentStatus: vi.fn(),
  updateUserAppointment: vi.fn(),
}));

describe('UserDietitians', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPublicDietitians.mockResolvedValue({
      data: {
        data: [{
          id: 'diet-1',
          name: 'Olivia Martin',
          specialty: 'Meal Planning',
          experience: '7 years',
          avatar: 'OM',
          tags: ['Weight Loss'],
          slotDate: new Date().toISOString().slice(0, 10),
          todaySlotRanges: [{ startTime: '09:00', endTime: '11:00' }],
        }],
      },
    });
    mockGetUserAppointments.mockResolvedValue({ data: { data: [] } });
    mockGetFeedbacks.mockResolvedValue({ data: { data: [] } });
  });

  it('renders dietitian page and loaded dietitian card', async () => {
    render(
      <MemoryRouter>
        <UserDietitians />
      </MemoryRouter>,
    );

    expect(screen.getByText(/choose your dietitian/i)).toBeInTheDocument();
    expect(await screen.findByText('Olivia Martin')).toBeInTheDocument();
    expect(screen.getByText(/my bookings/i)).toBeInTheDocument();
  });
});
