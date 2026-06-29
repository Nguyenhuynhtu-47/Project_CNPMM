import api from './api';

export const getCourseReviews = (courseId) => api.get(`/reviews/course/${courseId}`);
export const createReview = (data) => api.post('/reviews', data);
