import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import UserWorkouts from './UserWorkouts.jsx';

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', role: 'user' },
  }),
}));

vi.mock('@/features/user/api/user.api', () => ({
  getUserWorkoutPlans: vi.fn().mockResolvedValue({ data: { data: [] } }),
  startUserWorkoutSession: vi.fn().mockResolvedValue({ data: {} }),
  updateUserWorkoutSessionProgress: vi.fn().mockResolvedValue({ data: {} }),
  finishUserWorkoutSession: vi.fn().mockResolvedValue({ data: {} }),
}));

describe('UserWorkouts', () => {
  it('renders workouts sections', async () => {
    render(
      <MemoryRouter>
        <UserWorkouts />
      </MemoryRouter>,
    );

    expect(screen.getByText(/^Upcoming Exercises$/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/^Previous Exercises$/i)).toBeInTheDocument());
  });
});
