import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import UserCoachFeedbacks from './UserCoachFeedbacks.jsx';

const mockGetFeedbacks = vi.fn();

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
  }),
}));

vi.mock('@/features/user/api/user.api', () => ({
  getFeedbacks: (...args) => mockGetFeedbacks(...args),
  updateFeedback: vi.fn(),
  deleteFeedback: vi.fn(),
}));

describe('UserCoachFeedbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFeedbacks.mockResolvedValue({
      data: {
        data: [{
          id: 'f-1',
          ownerId: 'user-1',
          ownerName: 'Test User',
          subjectId: 'coach-1',
          subjectName: 'Emma Carter',
          rating: 5,
          comment: 'Very helpful coach',
          createdAt: '2026-03-21T00:00:00.000Z',
        }],
      },
    });
  });

  it('renders coach feedback list with query coach name', async () => {
    render(
      <MemoryRouter initialEntries={['/user/coach-feedbacks?coach=Emma%20Carter&coachId=coach-1']}>
        <Routes>
          <Route path="/user/coach-feedbacks" element={<UserCoachFeedbacks />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/emma carter feedbacks/i)).toBeInTheDocument();
    expect(screen.getByText(/very helpful coach/i)).toBeInTheDocument();
  });
});
