import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminSettings from './AdminSettings.jsx';

const mockGetAdminSettings = vi.fn();
const mockUpdateAdminSettings = vi.fn();
const mockChangeAdminPassword = vi.fn();

vi.mock('@/features/auth/model/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', role: 'admin' },
  }),
}));

vi.mock('@/features/admin/api/admin.api', () => ({
  getAdminSettings: (...args) => mockGetAdminSettings(...args),
  updateAdminSettings: (...args) => mockUpdateAdminSettings(...args),
  changeAdminPassword: (...args) => mockChangeAdminPassword(...args),
}));

describe('AdminSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminSettings.mockResolvedValue({
      data: {
        data: {
          fullName: 'Admin User',
          email: 'admin@example.com',
          emailNotifications: true,
          pushNotifications: false,
        },
      },
    });
    mockUpdateAdminSettings.mockResolvedValue({ data: { message: 'Saved' } });
  });

  it('loads and displays admin settings data', async () => {
    render(<AdminSettings />);
    await waitFor(() => expect(mockGetAdminSettings).toHaveBeenCalledWith('admin-1'));
    expect(await screen.findByDisplayValue('Admin User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin@example.com')).toBeInTheDocument();
  });

  it('saves updated settings', async () => {
    render(<AdminSettings />);
    await screen.findByDisplayValue('Admin User');

    const nameInput = screen.getByDisplayValue('Admin User');
    fireEvent.change(nameInput, { target: { value: 'Updated Admin' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(mockUpdateAdminSettings).toHaveBeenCalled());
  });
});
