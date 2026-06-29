import api from './api';

export const getMyCertificates = () => api.get('/certificates/me');
export const issueCertificate = (data) => api.post('/certificates', data);
export const getCertificatePdfUrl = (certificateCode) => `${api.defaults.baseURL}/certificates/pdf/${certificateCode}`;
