const { mockAxiosClient } = vi.hoisted(() => ({
  mockAxiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/shared/api/axiosClient', () => ({
  default: mockAxiosClient,
}));

import {
  createCoachWorkoutPlan,
  deleteCoachWorkoutPlan,
  getCoachExerciseSuggestions,
  getCoachWorkoutPlans,
  getCoachWorkoutRequests,
  submitCoachWorkoutPlan,
  updateCoachWorkoutPlan,
} from './coach.api.js';

describe('coach.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls request and plans endpoints with coachId query', () => {
    getCoachWorkoutRequests('coach-1');
    getCoachWorkoutPlans('coach-1');

    expect(mockAxiosClient.get).toHaveBeenNthCalledWith(1, '/workouts/requests', { params: { coachId: 'coach-1' } });
    expect(mockAxiosClient.get).toHaveBeenNthCalledWith(2, '/workouts/plans', { params: { coachId: 'coach-1' } });
  });

  it('calls create/update/delete workout plan endpoints', () => {
    const payload = { planTitle: 'Plan A' };
    createCoachWorkoutPlan(payload);
    updateCoachWorkoutPlan('plan-1', payload);
    deleteCoachWorkoutPlan('plan-1');

    expect(mockAxiosClient.post).toHaveBeenCalledWith('/workouts/plans', payload);
    expect(mockAxiosClient.put).toHaveBeenCalledWith('/workouts/plans/plan-1', payload);
    expect(mockAxiosClient.delete).toHaveBeenCalledWith('/workouts/plans/plan-1');
  });

  it('uses default and custom submit payload', () => {
    submitCoachWorkoutPlan('plan-1');
    submitCoachWorkoutPlan('plan-2', { submitted: true, mode: 'week', weekNumber: 2 });

    expect(mockAxiosClient.patch).toHaveBeenNthCalledWith(1, '/workouts/plans/plan-1/submit', { submitted: true, mode: 'all' });
    expect(mockAxiosClient.patch).toHaveBeenNthCalledWith(2, '/workouts/plans/plan-2/submit', { submitted: true, mode: 'week', weekNumber: 2 });
  });

  it('calls exercise suggestions endpoint with params', () => {
    getCoachExerciseSuggestions({ q: 'squat', limit: 8 });
    expect(mockAxiosClient.get).toHaveBeenCalledWith('/workouts/exercises/suggestions', { params: { q: 'squat', limit: 8 } });
  });
});
