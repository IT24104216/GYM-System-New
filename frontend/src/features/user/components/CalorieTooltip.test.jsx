import { render, screen } from '@testing-library/react';
import CalorieTooltip from './CalorieTooltip.jsx';

describe('CalorieTooltip', () => {
  it('returns null when inactive or payload is empty', () => {
    const { container: inactiveContainer } = render(
      <CalorieTooltip active={false} payload={[]} label="Mon" />,
    );
    expect(inactiveContainer.firstChild).toBeNull();

    const { container: noPayloadContainer } = render(
      <CalorieTooltip active payload={[]} label="Mon" />,
    );
    expect(noPayloadContainer.firstChild).toBeNull();
  });

  it('shows date and calories when active', () => {
    render(
      <CalorieTooltip
        active
        label="Mon"
        payload={[
          {
            value: 2200,
            payload: {
              fullDate: '2026-03-20',
              mealCount: 0,
            },
          },
        ]}
      />,
    );

    expect(screen.getByText('2026-03-20')).toBeInTheDocument();
    expect(screen.getByText(/cals : 2200/i)).toBeInTheDocument();
  });

  it('shows macro summary when mealCount is greater than zero', () => {
    render(
      <CalorieTooltip
        active
        label="Tue"
        payload={[
          {
            value: 1800,
            payload: {
              mealCount: 3,
              protein: 120,
              carbs: 150,
              fat: 60,
            },
          },
        ]}
      />,
    );

    expect(screen.getByText(/meals: 3 \| p 120g \| c 150g \| f 60g/i)).toBeInTheDocument();
  });
});
