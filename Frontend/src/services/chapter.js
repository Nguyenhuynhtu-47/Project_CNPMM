import api from './api';

export const createChapter = (data) => api.post('/chapters', data);
export const updateChapter = (chapterId, data) => api.put(`/chapters/${chapterId}`, data);
export const deleteChapter = (chapterId) => api.delete(`/chapters/${chapterId}`);
