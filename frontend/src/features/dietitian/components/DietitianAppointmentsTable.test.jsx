import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DietitianAppointmentsTable from './DietitianAppointmentsTable.jsx';

describe('DietitianAppointmentsTable', () => {
  it('renders rows and triggers approve/reject actions for pending appointments', () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();

    const rows = [
      {
        id: 'a1',
        member: 'Member One',
        date: '2026-03-22',
        time: '10:00 AM',
        goal: 'Meal Planning',
        status: 'Pending',
        rawStatus: 'pending',
      },
      {
        id: 'a2',
        member: 'Member Two',
        date: '2026-03-23',
        time: '11:30 AM',
        goal: 'Weight Gain',
        status: 'Approved',
        rawStatus: 'approved',
      },
    ];

    render(
      <DietitianAppointmentsTable
        appointments={rows}
        mutedText="#94a3b8"
        onApprove={onApprove}
        onReject={onReject}
        panelBg="#0f172a"
        panelBorder="#334155"
        subtitleColor="#cbd5e1"
      />,
    );

    expect(screen.getByText('Member One')).toBeInTheDocument();
    expect(screen.getByText('Member Two')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /approve/i }));
    fireEvent.click(screen.getByRole('button', { name: /reject/i }));

    expect(onApprove).toHaveBeenCalledWith(rows[0]);
    expect(onReject).toHaveBeenCalledWith(rows[0]);
  });
});

