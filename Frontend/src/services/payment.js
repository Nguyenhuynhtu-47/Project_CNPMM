import api from './api';

export const createVnpayPayment = (courseId) => api.post('/payments/vnpay', { courseId });
