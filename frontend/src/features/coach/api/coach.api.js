import axiosClient from '@/shared/api/axiosClient';

export const getCoachClients = () =>
  axiosClient.get('/coach/clients');

export const getCoachProfile = (coachId) =>
  axiosClient.get(`/coach/profile/${coachId}`);

export const upsertCoachProfile = (coachId, data) =>
  axiosClient.put(`/coach/profile/${coachId}`, data);

export const deleteCoachProfile = (coachId) =>
  axiosClient.delete(`/coach/profile/${coachId}`);

export const getPublicCoaches = () =>
  axiosClient.get('/coach/public');

export const getWorkoutPlans = () =>
  axiosClient.get('/coach/workout-plans');

export const getWorkoutPlanById = (id) =>
  axiosClient.get(`/coach/workout-plans/${id}`);

export const createWorkoutPlan = (data) =>
  axiosClient.post('/coach/workout-plans', data);

export const updateWorkoutPlan = (id, data) =>
  axiosClient.put(`/coach/workout-plans/${id}`, data);

export const deleteWorkoutPlan = (id) =>
  axiosClient.delete(`/coach/workout-plans/${id}`);

export const getCoachAppointments = (params) =>
  axiosClient.get('/appointments', { params });

export const updateCoachAppointmentStatus = (id, data) =>
  axiosClient.patch(`/appointments/${id}/status`, data);

export const getCoachSchedulingSlots = (coachId) =>
  axiosClient.get(`/coach/scheduling/${coachId}`);

export const createCoachSchedulingSlot = (coachId, data) =>
  axiosClient.post(`/coach/scheduling/${coachId}`, data);

export const updateCoachSchedulingSlot = (coachId, slotId, data) =>
  axiosClient.put(`/coach/scheduling/${coachId}/${slotId}`, data);

export const deleteCoachSchedulingSlot = (coachId, slotId) =>
  axiosClient.delete(`/coach/scheduling/${coachId}/${slotId}`);

export const getCoachWorkoutRequests = (coachId) =>
  axiosClient.get('/workouts/requests', { params: { coachId } });

export const getCoachWorkoutPlans = (coachId) =>
  axiosClient.get('/workouts/plans', { params: { coachId } });

export const createCoachWorkoutPlan = (data) =>
  axiosClient.post('/workouts/plans', data);

export const updateCoachWorkoutPlan = (id, data) =>
  axiosClient.put(`/workouts/plans/${id}`, data);

export const submitCoachWorkoutPlan = (id, data = { submitted: true, mode: 'all' }) =>
  axiosClient.patch(`/workouts/plans/${id}/submit`, data);

export const deleteCoachWorkoutPlan = (id) =>
  axiosClient.delete(`/workouts/plans/${id}`);

export const getCoachExerciseCategories = (coachId) =>
  axiosClient.get('/workouts/categories', { params: { coachId } });

export const getCoachExerciseSuggestions = (params) =>
  axiosClient.get('/workouts/exercises/suggestions', { params });

export const createCoachExerciseCategory = (data) =>
  axiosClient.post('/workouts/categories', data);

export const updateCoachExerciseCategory = (id, data) =>
  axiosClient.put(`/workouts/categories/${id}`, data);

export const deleteCoachExerciseCategory = (id) =>
  axiosClient.delete(`/workouts/categories/${id}`);

export const getCoachMemberProgressScores = (coachId, params) =>
  axiosClient.get(`/progress/coach/${coachId}/member-scores`, { params });
