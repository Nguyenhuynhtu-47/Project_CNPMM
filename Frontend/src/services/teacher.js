import api from './api';

export const getTeacherClasses = () => api.get('/teacher/classes');
export const getTeacherClassStudents = (classId) => api.get(`/teacher/classes/${classId}/students`);
export const approveCourseCompletion = (enrollmentId, data = {}) => api.patch(`/teacher/enrollments/${enrollmentId}/complete`, data);
export const getAssignmentAnalytics = (assignmentId) => api.get(`/teacher/assignments/${assignmentId}/analytics`);
