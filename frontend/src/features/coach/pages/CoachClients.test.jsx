import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CoachClients from './CoachClients.jsx';

const mockGetCoachAppointments = vi.fn();
const mockUpdateCoachAppointmentStatus = vi.fn();

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'coach-1', name: 'Coach One' },
  }),
}));

vi.mock('@/features/coach/api/coach.api', () => ({
  getCoachAppointments: (...args) => mockGetCoachAppointments(...args),
  updateCoachAppointmentStatus: (...args) => mockUpdateCoachAppointmentStatus(...args),
}));

describe('CoachClients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCoachAppointments.mockResolvedValue({ data: { data: [] } });
  });

  it('renders clients page and empty pending table state', async () => {
    render(<CoachClients />);

    expect(screen.getByText(/coach clients/i)).toBeInTheDocument();
    expect(screen.getByText(/appointments/i)).toBeInTheDocument();
    expect(screen.getByText(/members progress/i)).toBeInTheDocument();

    await waitFor(() => expect(mockGetCoachAppointments).toHaveBeenCalled());
    expect(await screen.findByText(/no pending requests/i)).toBeInTheDocument();
  });

  it('requires reject reason before submitting rejection', async () => {
    const user = userEvent.setup();
    mockGetCoachAppointments.mockResolvedValue({
      data: {
        data: [
          {
            _id: 'a1',
            userId: 'u1',
            coachId: 'coach-1',
            status: 'pending',
            sessionType: 'training',
            startsAt: '2026-03-24T09:00:00.000Z',
            createdAt: '2026-03-20T09:00:00.000Z',
            updatedAt: '2026-03-20T09:00:00.000Z',
            notes: 'User Name: Test User | Goal: Fat Loss | CoachId: coach-1',
          },
        ],
      },
    });

    render(<CoachClients />);
    await screen.findByText(/test user/i);

    await user.click(screen.getAllByRole('button', { name: /reject/i })[0]);
    await user.click(screen.getByRole('button', { name: /submit rejection/i }));

    expect(await screen.findByText(/please add a reject reason/i)).toBeInTheDocument();
    expect(mockUpdateCoachAppointmentStatus).not.toHaveBeenCalled();
  }, 10000);
});
