import api from './api';

export const getMyLoyalty = () => api.get('/loyalty/me');
