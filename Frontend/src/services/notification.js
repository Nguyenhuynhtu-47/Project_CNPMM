import api from './api';

export const listNotifications = () => api.get('/notifications');
export const listAllNotifications = (params = {}) => api.get('/notifications/admin/all', { params });
export const broadcastNotification = (data) => api.post('/notifications/admin/broadcast', data);
export const sendClassNotification = (classId, data) => api.post(`/notifications/classes/${classId}`, data);
export const markRead = (id) => api.patch(`/notifications/${id}/read`);

export default { broadcastNotification, listAllNotifications, listNotifications, markRead, sendClassNotification };
