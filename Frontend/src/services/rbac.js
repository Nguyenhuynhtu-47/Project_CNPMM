import api from './api';

export const getRoles = () => api.get('/rbac/roles');
export const getPermissions = () => api.get('/rbac/permissions');
export const createRole = (data) => api.post('/rbac/roles', data);
export const updateRolePermissions = (id, permissions) => api.patch(`/rbac/roles/${id}/permissions`, { permissions });
export const assignRoleToUser = (userId, role) => api.patch(`/rbac/users/${userId}/role`, { role });
