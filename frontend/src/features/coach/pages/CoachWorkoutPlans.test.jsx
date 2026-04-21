import { render, screen, waitFor } from '@testing-library/react';
import CoachWorkoutPlans from './CoachWorkoutPlans.jsx';

const mockGetCoachWorkoutRequests = vi.fn();
const mockGetCoachWorkoutPlans = vi.fn();
const mockGetCoachExerciseCategories = vi.fn();

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'coach-1' },
  }),
}));

vi.mock('../api/coach.api', () => ({
  getCoachWorkoutRequests: (...args) => mockGetCoachWorkoutRequests(...args),
  getCoachWorkoutPlans: (...args) => mockGetCoachWorkoutPlans(...args),
  getCoachExerciseCategories: (...args) => mockGetCoachExerciseCategories(...args),
  createCoachWorkoutPlan: vi.fn(),
  updateCoachWorkoutPlan: vi.fn(),
  submitCoachWorkoutPlan: vi.fn(),
  deleteCoachWorkoutPlan: vi.fn(),
  getCoachExerciseSuggestions: vi.fn(),
  createCoachExerciseCategory: vi.fn(),
  updateCoachExerciseCategory: vi.fn(),
  deleteCoachExerciseCategory: vi.fn(),
}));

describe('CoachWorkoutPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCoachWorkoutRequests.mockResolvedValue({
      data: {
        data: [
          {
            appointmentId: 'a-1',
            userId: 'u-1',
            name: 'Member One',
            age: 24,
            goal: 'Weight Loss',
            priority: 'High',
            notes: 'Need a beginner plan',
            requestedOn: '2026-03-21',
            avatar: 'MO',
          },
        ],
      },
    });
    mockGetCoachWorkoutPlans.mockResolvedValue({ data: { data: [] } });
    mockGetCoachExerciseCategories.mockResolvedValue({ data: { data: [] } });
  });

  it('renders workout plans page and request card data', async () => {
    render(<CoachWorkoutPlans />);

    expect(screen.getByText(/workout plans/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /requests/i })).toBeInTheDocument();

    await waitFor(() => expect(mockGetCoachWorkoutRequests).toHaveBeenCalledWith('coach-1'));
    expect(await screen.findByText(/member one/i)).toBeInTheDocument();
    expect(screen.getByText(/create workout plan/i)).toBeInTheDocument();
  });
});
