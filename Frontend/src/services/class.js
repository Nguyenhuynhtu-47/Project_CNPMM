import api from './api';

export const getClasses = (query = {}) => api.get('/classes', { params: query });
export const getClassById = (classId) => api.get(`/classes/${classId}`);
export const createClass = (data) => api.post('/classes', data);
export const updateClass = (classId, data) => api.put(`/classes/${classId}`, data);
export const deleteClass = (classId) => api.delete(`/classes/${classId}`);
