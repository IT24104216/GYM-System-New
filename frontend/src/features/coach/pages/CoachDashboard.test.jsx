import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import CoachDashboard from './CoachDashboard.jsx';

const mockGetCoachAppointments = vi.fn();
const mockGetCoachMemberProgressScores = vi.fn();

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'coach-1', name: 'Coach One' },
  }),
}));

vi.mock('../api/coach.api', () => ({
  getCoachAppointments: (...args) => mockGetCoachAppointments(...args),
  getCoachMemberProgressScores: (...args) => mockGetCoachMemberProgressScores(...args),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => children,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

describe('CoachDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCoachAppointments.mockResolvedValue({ data: { data: [] } });
    mockGetCoachMemberProgressScores.mockResolvedValue({ data: { data: { byUserId: {} } } });
  });

  it('renders dashboard sections and empty-state messages', async () => {
    render(
      <MemoryRouter>
        <CoachDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText(/active clients/i)).toBeInTheDocument();
    expect(screen.getByText(/sessions today/i)).toBeInTheDocument();
    expect(screen.getByText(/avg client score/i)).toBeInTheDocument();
    expect(screen.getByText(/revenue mtd/i)).toBeInTheDocument();

    await waitFor(() => expect(mockGetCoachAppointments).toHaveBeenCalled());
    expect(screen.getByText(/consultation queue/i)).toBeInTheDocument();
    expect(screen.getAllByText(/active members/i).length).toBeGreaterThan(0);
  }, 10000);
});
