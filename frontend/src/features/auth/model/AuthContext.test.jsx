import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext.jsx';

vi.mock('@/features/auth/api/auth.api', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

import { login as apiLogin, logout as apiLogout, register as apiRegister } from '@/features/auth/api/auth.api';

function Consumer() {
  const { user, isAuthenticated, login, register, logout, updateUser } = useAuth();
  return (
    <div>
      <span data-testid="auth-state">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="user-name">{user?.name || ''}</span>
      <button onClick={() => login({ identifier: 'a', password: 'b' })}>login</button>
      <button onClick={() => register({})}>register</button>
      <button onClick={() => logout()}>logout</button>
      <button onClick={() => updateUser({ id: 'u2', name: 'Updated' })}>update</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('rehydrates auth state from localStorage', async () => {
    localStorage.setItem('gympro_token', 't1');
    localStorage.setItem('gympro_user', JSON.stringify({ id: 'u1', name: 'Stored' }));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('yes'));
    expect(screen.getByTestId('user-name')).toHaveTextContent('Stored');
  });

  it('supports login, update, register and logout flows', async () => {
    apiLogin.mockResolvedValueOnce({ data: { token: 't2', user: { id: 'u1', name: 'User 1' } } });
    apiRegister.mockResolvedValueOnce({ data: { user: { id: 'u3' } } });
    apiLogout.mockResolvedValueOnce({ data: {} });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await user.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('yes'));
    expect(screen.getByTestId('user-name')).toHaveTextContent('User 1');

    await user.click(screen.getByText('update'));
    expect(screen.getByTestId('user-name')).toHaveTextContent('Updated');

    await user.click(screen.getByText('register'));
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('no'));

    await user.click(screen.getByText('logout'));
    await waitFor(() => expect(apiLogout).toHaveBeenCalled());
  });
});
