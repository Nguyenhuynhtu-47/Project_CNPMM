import api from './api';

export const createQuiz = (data) => api.post('/quizzes', data);
export const updateQuiz = (id, data) => api.put(`/quizzes/${id}`, data);
export const getQuizzesByClass = (classId) => api.get(`/quizzes/class/${classId}`);
export const getQuiz = (id) => api.get(`/quizzes/${id}`);
export const startAttempt = (id) => api.post(`/quizzes/${id}/start`);
export const submitQuiz = (id, answers) => api.post(`/quizzes/${id}/submit`, { answers });

export default { createQuiz, updateQuiz, getQuizzesByClass, getQuiz, startAttempt, submitQuiz };
