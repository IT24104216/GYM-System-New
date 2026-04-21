import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MealPlanRiskMonitorCard from './MealPlanRiskMonitorCard.jsx';

const theme = {
  palette: {
    background: { paper: '#ffffff' },
    text: { secondary: '#64748b' },
  },
};

describe('MealPlanRiskMonitorCard', () => {
  it('renders neutral state text', () => {
    render(
      <MealPlanRiskMonitorCard
        isDark={false}
        theme={theme}
        riskMonitor={{
          today: {
            level: 'neutral',
            label: 'Neutral',
            score: 0,
            message: 'No meal data for today.',
            reasons: [],
          },
          goodStreak: 0,
          riskStreak: 0,
        }}
        onSwitchToDietitian={vi.fn()}
        onBookDietitian={vi.fn()}
      />,
    );

    expect(screen.getByText(/my plan safety monitor/i)).toBeInTheDocument();
    expect(screen.getByText(/no meal data for today/i)).toBeInTheDocument();
    expect(screen.getByText(/no data yet/i)).toBeInTheDocument();
  });

  it('shows warning actions and triggers handlers for risk streak', async () => {
    const user = userEvent.setup();
    const onSwitchToDietitian = vi.fn();
    const onBookDietitian = vi.fn();

    render(
      <MealPlanRiskMonitorCard
        isDark={false}
        theme={theme}
        riskMonitor={{
          today: {
            level: 'red',
            label: 'High Risk',
            score: 88,
            message: 'Your meals are unbalanced.',
            reasons: ['Low protein', 'High sugar'],
          },
          goodStreak: 0,
          riskStreak: 3,
        }}
        onSwitchToDietitian={onSwitchToDietitian}
        onBookDietitian={onBookDietitian}
      />,
    );

    expect(screen.getByText(/warning: risk has continued for 3 day\(s\)/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /switch to dietitian plan/i }));
    await user.click(screen.getByRole('button', { name: /book appointment/i }));

    expect(onSwitchToDietitian).toHaveBeenCalledTimes(1);
    expect(onBookDietitian).toHaveBeenCalledTimes(1);
  });

  it('shows positive streak message when goodStreak is high', () => {
    render(
      <MealPlanRiskMonitorCard
        isDark={false}
        theme={theme}
        riskMonitor={{
          today: {
            level: 'green',
            label: 'Balanced',
            score: 18,
            message: 'Nice job today.',
            reasons: [],
          },
          goodStreak: 4,
          riskStreak: 0,
        }}
        onSwitchToDietitian={vi.fn()}
        onBookDietitian={vi.fn()}
      />,
    );

    expect(screen.getByText(/great job/i)).toBeInTheDocument();
    expect(screen.getByText(/for 4 day\(s\) continuously/i)).toBeInTheDocument();
  });
});
