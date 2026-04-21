import axiosClient from '@/shared/api/axiosClient';

export const getAllUsers = (params) =>
  axiosClient.get('/admin/users', { params });

export const getUserById = (id) =>
  axiosClient.get(`/admin/users/${id}`);

export const updateUser = (id, data) =>
  axiosClient.put(`/admin/users/${id}`, data);

export const deleteUser = (id) =>
  axiosClient.delete(`/admin/users/${id}`);

export const getPlatformStats = () =>
  axiosClient.get('/admin/stats');

export const getAdminReportsOverview = () =>
  axiosClient.get('/admin/reports/overview');

export const getPromotions = (params) =>
  axiosClient.get('/promotions/list', { params });

export const createPromotion = (data) =>
  axiosClient.post('/promotions', data);

export const updatePromotion = (id, data) =>
  axiosClient.put(`/promotions/${id}`, data);

export const deletePromotion = (id) =>
  axiosClient.delete(`/promotions/${id}`);

export const getAdminSettings = (adminId) =>
  axiosClient.get('/admin/settings', { params: { adminId } });

export const updateAdminSettings = (payload) =>
  axiosClient.put('/admin/settings', payload);

export const changeAdminPassword = (payload) =>
  axiosClient.put('/admin/settings/password', payload);

export const getLockers = (params = {}) =>
  axiosClient.get('/lockers/list', { params });

export const createLocker = (data) =>
  axiosClient.post('/lockers/list', data);

export const updateLocker = (id, data) =>
  axiosClient.put(`/lockers/list/${id}`, data);

export const deleteLocker = (id) =>
  axiosClient.delete(`/lockers/list/${id}`);

export const getLockerBookings = (params = {}) =>
  axiosClient.get('/lockers/bookings', { params });

export const updateLockerBookingStatus = (id, data) =>
  axiosClient.patch(`/lockers/bookings/${id}/status`, data);

export const grantSubscription = (userId, planType) =>
  axiosClient.post('/subscriptions/grant', {
    userId,
    planType,
    paymentMethod: 'cash',
    last4: 'CASH',
  });

export const getUserSubscription = (userId) =>
  axiosClient.get(`/subscriptions/user/${userId}`);
