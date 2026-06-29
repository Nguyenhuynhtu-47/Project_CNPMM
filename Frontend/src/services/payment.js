import api from './api';

export const createVnpayPayment = (courseId, options = {}) => api.post('/payments/vnpay', {
    courseId,
    couponCode: options.couponCode,
    pointsToUse: options.pointsToUse
});
