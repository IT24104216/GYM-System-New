import axiosClient from '@/shared/api/axiosClient';

export const getFaqs = (params = {}) =>
  axiosClient.get('/faqs/list', { params });

export const createFaq = (data) =>
  axiosClient.post('/faqs/list', data);

export const updateFaq = (id, data) =>
  axiosClient.put(`/faqs/list/${id}`, data);

export const deleteFaq = (id, data) =>
  axiosClient.delete(`/faqs/list/${id}`, { data });
