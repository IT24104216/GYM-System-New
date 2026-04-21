import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DietitianTimeSlotsPanel from './DietitianTimeSlotsPanel.jsx';

describe('DietitianTimeSlotsPanel', () => {
  it('renders slot form and supports add/edit/delete actions', () => {
    const addTimeSlot = vi.fn();
    const openEditSlot = vi.fn();
    const openDeleteSlot = vi.fn();
    const setSlotForm = vi.fn();

    const timeSlots = [
      {
        id: 's1',
        day: 'Monday',
        date: '2026-03-23',
        startTime: '09:00',
        endTime: '10:00',
      },
    ];

    render(
      <DietitianTimeSlotsPanel
        addTimeSlot={addTimeSlot}
        getWeekdayLabel={() => 'Monday'}
        isDark={false}
        isSlotsLoading={false}
        mutedText="#64748b"
        openDeleteSlot={openDeleteSlot}
        openEditSlot={openEditSlot}
        panelBg="#ffffff"
        panelBorder="#cbd5e1"
        sectionTitleColor="#0f172a"
        setSlotForm={setSlotForm}
        slotError=""
        slotForm={{ date: '2026-03-23', startTime: '09:00', endTime: '10:00' }}
        slotTitleColor="#0f172a"
        subtitleColor="#475569"
        timeSlots={timeSlots}
        to12Hour={(value) => value}
      />,
    );

    expect(screen.getByText(/create consultation time slot/i)).toBeInTheDocument();
    expect(screen.getByText(/your time slots/i)).toBeInTheDocument();
    expect(screen.getByText(/monday, 2026-03-23/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-03-24' } });
    expect(setSlotForm).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /add time slot/i }));
    expect(addTimeSlot).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(openEditSlot).toHaveBeenCalledWith(timeSlots[0]);
    expect(openDeleteSlot).toHaveBeenCalledWith(timeSlots[0]);
  });
});

