import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute.jsx';

const authState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
};

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => authState,
}));

function renderRoute(allowedRoles = ['admin']) {
  return render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
          <Route path="/private" element={<div>Private Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Route</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Route</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('shows loading spinner while auth is loading', () => {
    authState.isLoading = true;
    authState.isAuthenticated = false;
    authState.user = null;
    renderRoute();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    authState.isLoading = false;
    authState.isAuthenticated = false;
    authState.user = null;
    renderRoute();
    expect(screen.getByText('Login Route')).toBeInTheDocument();
  });

  it('redirects authenticated users with wrong role to unauthorized', () => {
    authState.isLoading = false;
    authState.isAuthenticated = true;
    authState.user = { role: 'user' };
    renderRoute(['admin']);
    expect(screen.getByText('Unauthorized Route')).toBeInTheDocument();
  });

  it('renders protected content for allowed role', () => {
    authState.isLoading = false;
    authState.isAuthenticated = true;
    authState.user = { role: 'admin' };
    renderRoute(['admin']);
    expect(screen.getByText('Private Content')).toBeInTheDocument();
  });
});
