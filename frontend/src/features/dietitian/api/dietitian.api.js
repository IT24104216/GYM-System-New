import axiosClient from '@/shared/api/axiosClient';

export const getDietitianClients = () =>
  axiosClient.get('/dietitian/clients');

export const getMealPlans = () =>
  axiosClient.get('/meal-plans/client-plans');

export const getMealPlanById = (id) =>
  axiosClient.get('/meal-plans/client-plans', { params: { userId: id } });

export const createMealPlan = (data) =>
  axiosClient.post('/meal-plans/client-plans', data);

export const updateMealPlan = (id, data) =>
  axiosClient.put(`/meal-plans/client-plans/${id}`, data, {
    params: { dietitianId: data?.dietitianId },
  });

export const deleteMealPlan = (id, dietitianId) =>
  axiosClient.delete(`/meal-plans/client-plans/${id}`, {
    params: { dietitianId },
  });

export const submitMealPlan = (id, dietitianId, submitted = true) =>
  axiosClient.patch(`/meal-plans/client-plans/${id}/submit`, { submitted }, {
    params: { dietitianId },
  });

export const getMealLibraryItems = (params) =>
  axiosClient.get('/meal-plans/library', { params });

export const searchNutritionFoods = (query) =>
  axiosClient.get('/meal-plans/nutrition/search', {
    params: { q: query },
  });

export const createMealLibraryItem = (data) =>
  axiosClient.post('/meal-plans/library', data);

export const updateMealLibraryItem = (id, data, dietitianId) =>
  axiosClient.put(`/meal-plans/library/${id}`, data, {
    params: { dietitianId },
  });

export const deleteMealLibraryItem = (id, dietitianId) =>
  axiosClient.delete(`/meal-plans/library/${id}`, {
    params: { dietitianId },
  });

export const getDietitianClientPlans = (params) =>
  axiosClient.get('/meal-plans/client-plans', { params });

export const upsertDietitianClientPlan = (data) =>
  axiosClient.post('/meal-plans/client-plans', data);

export const getDietitianProfile = (dietitianId) =>
  axiosClient.get(`/dietitian/profile/${dietitianId}`);

export const upsertDietitianProfile = (dietitianId, data) =>
  axiosClient.put(`/dietitian/profile/${dietitianId}`, data);

export const deleteDietitianProfile = (dietitianId) =>
  axiosClient.delete(`/dietitian/profile/${dietitianId}`);

export const getPublicDietitians = () =>
  axiosClient.get('/dietitian/public');

export const getDietitianSchedulingSlots = (dietitianId) =>
  axiosClient.get(`/dietitian/scheduling/${dietitianId}`);

export const getDietitianAvailableSlots = (dietitianId, date) =>
  axiosClient.get(`/dietitian/${dietitianId}/slots`, { params: { date } });

export const createDietitianSchedulingSlot = (dietitianId, data) =>
  axiosClient.post(`/dietitian/scheduling/${dietitianId}`, data);

export const updateDietitianSchedulingSlot = (dietitianId, slotId, data) =>
  axiosClient.put(`/dietitian/scheduling/${dietitianId}/${slotId}`, data);

export const deleteDietitianSchedulingSlot = (dietitianId, slotId) =>
  axiosClient.delete(`/dietitian/scheduling/${dietitianId}/${slotId}`);

export const getDietitianAppointments = (params) =>
  axiosClient.get('/appointments', { params });

export const updateDietitianAppointmentStatus = (id, data) =>
  axiosClient.patch(`/appointments/${id}/status`, data);
