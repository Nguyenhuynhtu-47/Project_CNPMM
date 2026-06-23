import api from './api';

export const updateProfile = (data) => api.put('/user/profile', data);
