import api from './api';

export const previewPayment = (courseId, options = {}) => api.post('/payments/preview', {
    courseId,
    couponCode: options.couponCode,
    pointsToUse: options.pointsToUse
});

export const createVnpayPayment = (courseId, options = {}) => api.post('/payments/vnpay', {
    courseId,
    couponCode: options.couponCode,
    pointsToUse: options.pointsToUse
});
