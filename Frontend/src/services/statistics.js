import api from './api';

export const getStatisticsOverview = (params = {}) => api.get('/statistics/overview', { params });
