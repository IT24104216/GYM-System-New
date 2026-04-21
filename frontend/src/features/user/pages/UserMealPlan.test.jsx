import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import UserMealPlan from './UserMealPlan.jsx';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
  }),
}));

vi.mock('../hooks/useUserMealPlanData', () => ({
  useDietitianPlan: () => ({
    dietitianPlan: {
      sections: [],
      summary: { totalCalories: 0 },
      dietitian: { name: 'Dietitian One', specialization: 'Nutrition' },
    },
    planError: '',
    setPlanError: vi.fn(),
    isPlanLoading: false,
  }),
  useUserFoodLogs: () => ({
    foodLogs: [],
    allFoodLogs: [],
    refreshFoodLogs: vi.fn(),
    refreshAllFoodLogs: vi.fn(),
  }),
  useNutritionSuggestions: () => ({
    nutritionOptions: [],
    setNutritionOptions: vi.fn(),
    isNutritionLoading: false,
  }),
}));

vi.mock('../api/user.api', () => ({
  createUserFoodLog: vi.fn(),
  updateUserFoodLog: vi.fn(),
  deleteUserFoodLog: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => children,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => null,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

describe('UserMealPlan', () => {
  it('renders meal plan page base sections', async () => {
    render(
      <MemoryRouter>
        <UserMealPlan />
      </MemoryRouter>,
    );

    expect(screen.getByText(/meal plan hub/i)).toBeInTheDocument();
    expect(screen.getByText(/daily summary/i)).toBeInTheDocument();
    expect(screen.getByText(/today's meals/i)).toBeInTheDocument();
  });
});
