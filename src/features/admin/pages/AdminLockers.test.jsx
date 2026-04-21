import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminLockers from './AdminLockers.jsx';

const mockGetLockers = vi.fn();
const mockGetLockerBookings = vi.fn();
const mockUpdateLockerBookingStatus = vi.fn();

vi.mock('@/features/admin/api/admin.api', () => ({
  createLocker: vi.fn(),
  deleteLocker: vi.fn(),
  getLockerBookings: (...args) => mockGetLockerBookings(...args),
  getLockers: (...args) => mockGetLockers(...args),
  updateLocker: vi.fn(),
  updateLockerBookingStatus: (...args) => mockUpdateLockerBookingStatus(...args),
}));

describe('AdminLockers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLockers.mockResolvedValue({
      data: {
        data: [
          {
            id: 'l1',
            code: 'L-101',
            branch: 'Colombo',
            section: 'A',
            status: 'available',
          },
        ],
      },
    });
    mockGetLockerBookings.mockResolvedValue({
      data: {
        data: [
          {
            id: 'r1',
            userName: 'Member One',
            lockerCode: 'L-101',
            branch: 'Colombo',
            message: 'Need after workout',
          },
        ],
      },
    });
    mockUpdateLockerBookingStatus.mockResolvedValue({ data: { data: {} } });
  });

  it('loads lockers and pending booking requests', async () => {
    render(<AdminLockers />);

    expect(screen.getByText(/manage lockers/i)).toBeInTheDocument();
    await waitFor(() => expect(mockGetLockers).toHaveBeenCalled());
    await waitFor(() => expect(mockGetLockerBookings).toHaveBeenCalledWith({ status: 'pending', limit: 100 }));

    expect(await screen.findByText('L-101')).toBeInTheDocument();
    expect(screen.getByText(/member one requested l-101/i)).toBeInTheDocument();
  });

  it('approves a pending locker request', async () => {
    render(<AdminLockers />);
    await screen.findByText('Member One requested L-101');

    fireEvent.click(screen.getByRole('button', { name: /approve/i }));
    await waitFor(() =>
      expect(mockUpdateLockerBookingStatus).toHaveBeenCalledWith('r1', {
        status: 'approved',
        adminMessage: 'Locker booking approved. Get your keys from reception when you go to the gym.',
      }),
    );
  });
});

