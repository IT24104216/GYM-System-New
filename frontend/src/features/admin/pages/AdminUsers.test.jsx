import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminUsers from './AdminUsers.jsx';

const mockGetAllUsers = vi.fn();
const mockGetPlatformStats = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('@/features/admin/api/admin.api', () => ({
  deleteUser: vi.fn(),
  getAllUsers: (...args) => mockGetAllUsers(...args),
  getPlatformStats: (...args) => mockGetPlatformStats(...args),
  updateUser: (...args) => mockUpdateUser(...args),
}));

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllUsers.mockResolvedValue({
      data: {
        data: [
          {
            id: 'u1',
            avatar: 'A',
            name: 'Alex User',
            email: 'alex@example.com',
            role: 'Member',
            status: 'Active',
            joined: '2026-03-01',
            branchUserId: 'BR-001',
          },
        ],
      },
    });
    mockGetPlatformStats.mockResolvedValue({
      data: { data: { total: 1, staff: 0, diet: 0, verified: 1 } },
    });
    mockUpdateUser.mockResolvedValue({ data: { data: {} } });
  });

  it('loads and displays users table', async () => {
    render(<AdminUsers />);

    expect(screen.getByText(/users & staff management/i)).toBeInTheDocument();
    await waitFor(() => expect(mockGetAllUsers).toHaveBeenCalled());
    expect(await screen.findByText('Alex User')).toBeInTheDocument();
    expect(screen.getByText('alex@example.com')).toBeInTheDocument();
  });

  it('opens edit role dialog and saves role update', async () => {
    render(<AdminUsers />);
    await screen.findByText('Alex User');

    fireEvent.click(screen.getByRole('button', { name: /edit role/i }));
    expect(screen.getByText(/edit user role/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /save role/i }));
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith('u1', { role: 'user' }));
  });
});

