/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '@/features/auth/api/auth.api';
import { getToken, getUser, setToken, setUser, clearAuth } from '@/shared/utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate auth state from localStorage on mount
  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getUser();
    if (storedToken && storedUser) {
      setTokenState(storedToken);
      setUserState(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials) => {
    const { data } = await apiLogin(credentials);
    setToken(data.token);
    setUser(data.user);
    setTokenState(data.token);
    setUserState(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await apiRegister(formData);
    clearAuth();
    setTokenState(null);
    setUserState(null);
    return data.user;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // ignore errors on logout
    } finally {
      clearAuth();
      setTokenState(null);
      setUserState(null);
    }
  };

  const updateUser = (nextUser) => {
    if (!nextUser) return;
    setUser(nextUser);
    setUserState(nextUser);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
