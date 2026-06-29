import api from './api';

export const enrollInCourse = (courseId) => api.post('/enrollments', { courseId });
export const getEnrollments = () => api.get('/enrollments');
export const getAllEnrollments = (params = {}) => api.get('/enrollments/admin/all', { params });
