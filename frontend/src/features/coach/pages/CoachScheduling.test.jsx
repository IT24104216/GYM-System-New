import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CoachScheduling from './CoachScheduling.jsx';

const mockGetCoachSchedulingSlots = vi.fn();
const mockCreateCoachSchedulingSlot = vi.fn();
const mockUpdateCoachSchedulingSlot = vi.fn();
const mockDeleteCoachSchedulingSlot = vi.fn();

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'coach-1' },
  }),
}));

vi.mock('../api/coach.api', () => ({
  getCoachSchedulingSlots: (...args) => mockGetCoachSchedulingSlots(...args),
  createCoachSchedulingSlot: (...args) => mockCreateCoachSchedulingSlot(...args),
  updateCoachSchedulingSlot: (...args) => mockUpdateCoachSchedulingSlot(...args),
  deleteCoachSchedulingSlot: (...args) => mockDeleteCoachSchedulingSlot(...args),
}));

describe('CoachScheduling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCoachSchedulingSlots.mockResolvedValue({ data: { data: [] } });
  });

  it('renders scheduling page and empty slot state', async () => {
    render(<CoachScheduling />);

    expect(screen.getByText(/coach scheduling/i)).toBeInTheDocument();
    expect(screen.getByText(/add availability slot/i)).toBeInTheDocument();
    expect(screen.getByText(/available time slots/i)).toBeInTheDocument();

    await waitFor(() => expect(mockGetCoachSchedulingSlots).toHaveBeenCalledWith('coach-1'));
    const emptyRows = await screen.findAllByText(/no slots for this day/i);
    expect(emptyRows.length).toBeGreaterThan(0);
  }, 10000);

  it('shows validation error when required fields are missing', async () => {
    const user = userEvent.setup();
    render(<CoachScheduling />);
    await waitFor(() => expect(mockGetCoachSchedulingSlots).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /add slot/i }));
    expect(await screen.findByText(/please complete date and time fields/i)).toBeInTheDocument();
    expect(mockCreateCoachSchedulingSlot).not.toHaveBeenCalled();
  }, 10000);
});
