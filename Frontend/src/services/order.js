import api from './api';

export const getOrders = () => api.get('/orders');
export const getAllOrders = (params = {}) => api.get('/orders/admin/all', { params });
export const getOrderById = (orderId) => api.get(`/orders/${orderId}`);
