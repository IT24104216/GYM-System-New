import axiosClient from '@/shared/api/axiosClient';

export const login = (credentials) =>
  axiosClient.post('/auth/login', credentials);

export const register = (data) =>
  axiosClient.post('/auth/register', data);

export const logout = () =>
  axiosClient.post('/auth/logout');

export const refreshToken = () =>
  axiosClient.post('/auth/refresh');

export const forgotPassword = (data) =>
  axiosClient.post('/auth/forgot-password', data);

export const resetPassword = (data) =>
  axiosClient.post('/auth/reset-password', data);
