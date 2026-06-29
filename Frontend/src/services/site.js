import api from './api';

export const getBanners = () => api.get('/site/banners');
export const getAllBanners = () => api.get('/site/banners?all=true');
export const createBanner = (data) => api.post('/site/banners', data);
export const updateBanner = (id, data) => api.put(`/site/banners/${id}`, data);
export const deleteBanner = (id) => api.delete(`/site/banners/${id}`);
export const reorderBanners = (items) => api.patch('/site/banners/reorder', { items });
export const getSettings = () => api.get('/site/settings');
export const upsertSetting = (data) => api.post('/site/settings', data);
export const deleteSetting = (key) => api.delete(`/site/settings/${key}`);
