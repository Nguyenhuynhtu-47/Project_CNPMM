import api from './api';

export const getAttendance = (params = {}) => api.get('/attendance', { params });
export const getMyAttendance = () => api.get('/attendance/me');
export const markAttendance = (data) => api.post('/attendance', data);
