import api from './api';

export const getCoupons = () => api.get('/coupons');
export const createCoupon = (data) => api.post('/coupons', data);
export const updateCoupon = (id, data) => api.put(`/coupons/${id}`, data);
export const validateCoupon = (data) => api.post('/coupons/validate', data);
