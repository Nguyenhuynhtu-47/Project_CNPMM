import api from './api';

export const getAssignments = (params = {}) => api.get('/assignments', { params });
export const createAssignment = (data) => api.post('/assignments', data);
export const updateAssignment = (assignmentId, data) => api.put(`/assignments/${assignmentId}`, data);
export const submitAssignment = (assignmentId, data) => api.post(`/assignments/${assignmentId}/submit`, data);
export const getAssignmentSubmissions = (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`);
export const gradeSubmission = (submissionId, data) => api.patch(`/assignments/submissions/${submissionId}/grade`, data);
