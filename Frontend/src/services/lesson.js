import api from './api';

export const createLesson = (data) => api.post('/lessons', data);
export const getLessonsByChapter = (chapterId) => api.get(`/lessons/chapter/${chapterId}`);
export const getLessonById = (lessonId) => api.get(`/lessons/${lessonId}`);
export const updateLesson = (lessonId, data) => api.put(`/lessons/${lessonId}`, data);
export const deleteLesson = (lessonId) => api.delete(`/lessons/${lessonId}`);
export const deleteLessonMaterial = (lessonId) => api.delete(`/lessons/${lessonId}/material`);
export const reorderLessons = (chapterId, lessons) => api.patch(`/lessons/chapter/${chapterId}/reorder`, { lessons });
export const completeLesson = (lessonId) => api.post(`/lessons/${lessonId}/complete`);
export const uploadLessonMedia = (lessonId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/lessons/${lessonId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
