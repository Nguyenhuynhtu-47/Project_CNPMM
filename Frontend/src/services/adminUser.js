import api from './api';

export const getAdminUsers = (params = {}) => api.get('/admin/users', { params });
export const createStaffUser = (data) => api.post('/admin/users', data);
export const updateAdminUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const updateAdminUserStatus = (id, status) => api.patch(`/admin/users/${id}/status`, { status });
export const resetAdminUserPassword = (id, password) => api.patch(`/admin/users/${id}/password`, { password });
