import api from './api';

export const getCourses = (query = {}) => {
    const params = {};

    if (query.q) params.q = query.q;
    if (query.category) params.category = query.category;
    if (query.status) params.status = query.status;
    if (query.minPrice != null) params.minPrice = query.minPrice;
    if (query.maxPrice != null) params.maxPrice = query.maxPrice;
    if (query.page != null) params.page = query.page;
    if (query.limit != null) params.limit = query.limit;
    if (query.sort) params.sort = query.sort;

    return api.get('/courses', { params });
};

export const getCourseById = (courseId) => api.get(`/courses/${courseId}`);
export const getCourseChapters = (courseId) => api.get(`/courses/${courseId}/chapters`);
export const getCourseProgress = (courseId) => api.get(`/courses/${courseId}/progress`);
export const createCourse = (data) => api.post('/courses', data);
export const updateCourse = (courseId, data) => api.put(`/courses/${courseId}`, data);
export const uploadCourseImage = (courseId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/courses/${courseId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const deleteCourse = (courseId) => api.delete(`/courses/${courseId}`);
export const getCategories = () => api.get('/courses/categories');
export const createCategory = (data) => api.post('/courses/categories', data);
export const updateCategory = (categoryId, data) => api.put(`/courses/categories/${categoryId}`, data);
export const deleteCategory = (categoryId) => api.delete(`/courses/categories/${categoryId}`);
