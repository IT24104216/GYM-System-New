import axiosClient from '@/shared/api/axiosClient';

export const getUserProfile = () =>
  axiosClient.get('/user/profile');

export const updateProfile = (data) =>
  axiosClient.put('/user/profile', data);

export const getUserWorkouts = () =>
  axiosClient.get('/user/workouts');

export const getWorkoutById = (id) =>
  axiosClient.get(`/user/workouts/${id}`);

export const getUserWorkoutPlans = (userId, options = {}) =>
  axiosClient.get('/workouts/plans', {
    params: {
      userId,
      ...(options?.submitted !== undefined ? { submitted: options.submitted } : {}),
    },
  });

export const startUserWorkoutSession = (planId, data) =>
  axiosClient.post(`/workouts/plans/${planId}/session/start`, data);

export const updateUserWorkoutSessionProgress = (planId, data) =>
  axiosClient.patch(`/workouts/plans/${planId}/session/progress`, data);

export const finishUserWorkoutSession = (planId, data) =>
  axiosClient.patch(`/workouts/plans/${planId}/session/finish`, data);

export const bookCoachAppointment = (data) =>
  axiosClient.post('/appointments', data);

export const getUserAppointments = (params) =>
  axiosClient.get('/appointments', { params });

export const getUserDietitianMealPlan = (userId) =>
  axiosClient.get('/meal-plans/user-plan', { params: { userId } });

export const searchNutritionFoods = (query) =>
  axiosClient.get('/meal-plans/nutrition/search', {
    params: { q: query },
  });

export const getUserFoodLogs = (userId, logDate) =>
  axiosClient.get('/meal-plans/food-logs', {
    params: {
      userId,
      ...(logDate ? { logDate } : {}),
    },
  });

export const createUserFoodLog = (data) =>
  axiosClient.post('/meal-plans/food-logs', data);

export const updateUserFoodLog = (id, userId, data) =>
  axiosClient.put(`/meal-plans/food-logs/${id}`, data, {
    params: { userId },
  });

export const deleteUserFoodLog = (id, userId) =>
  axiosClient.delete(`/meal-plans/food-logs/${id}`, {
    params: { userId },
  });

export const updateAppointmentStatus = (id, data) =>
  axiosClient.patch(`/appointments/${id}/status`, data);

export const updateUserAppointment = (id, data) =>
  axiosClient.patch(`/appointments/${id}`, data);

export const getPublicCoaches = () =>
  axiosClient.get('/coach/public');

export const getPublicDietitians = () =>
  axiosClient.get('/dietitian/public');

export const bookDietitianAppointment = (data) =>
  axiosClient.post('/appointments', data);

export const getUserProgress = (userId) =>
  axiosClient.get(`/progress/${userId}`);

export const saveUserMeasurement = (userId, data) =>
  axiosClient.put(`/progress/${userId}/measurements`, data);

export const uploadProgressPhoto = (payload) =>
  axiosClient.post('/progress/photo/upload', payload);

export const deleteProgressPhoto = (slot) =>
  axiosClient.delete(`/progress/photo/${slot}`);

export const updatePhotoNote = (slot, note) =>
  axiosClient.patch(`/progress/photo/${slot}/note`, { note });

export const getPublicPromotions = (params = {}) =>
  axiosClient.get('/promotions/public', { params });

export const getFeedbacks = (params = {}) =>
  axiosClient.get('/feedbacks/list', { params });

export const createFeedback = (data) =>
  axiosClient.post('/feedbacks', data);

export const updateFeedback = (id, data) =>
  axiosClient.put(`/feedbacks/${id}`, data);

export const deleteFeedback = (id, ownerId) =>
  axiosClient.delete(`/feedbacks/${id}`, {
    data: { ownerId },
  });

export const getUserLockers = (params = {}) =>
  axiosClient.get('/lockers/list', { params });

export const getUserLockerBookings = (params = {}) =>
  axiosClient.get('/lockers/bookings', { params });

export const createLockerBookingRequest = (data) =>
  axiosClient.post('/lockers/bookings', data);

export const createMySubscription = (data) =>
  axiosClient.post('/subscriptions/my', data);

export const getMySubscription = () =>
  axiosClient.get('/subscriptions/my');

export const renewMySubscription = (data) =>
  axiosClient.post('/subscriptions/my/renew', data);

export const cancelMySubscription = () =>
  axiosClient.patch('/subscriptions/my/cancel');

export const toggleMySubscriptionAutoRenew = (autoRenew) =>
  axiosClient.patch('/subscriptions/my/auto-renew', { autoRenew });
