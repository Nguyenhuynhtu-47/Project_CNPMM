import api from './api';

export const getClassComments = (classId) => api.get(`/comments/class/${classId}`);
export const createClassComment = (data) => api.post('/comments', data);
export const pinClassComment = (commentId, pinned) => api.patch(`/comments/${commentId}/pin`, { pinned });
