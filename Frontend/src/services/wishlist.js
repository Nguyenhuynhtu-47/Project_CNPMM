import api from './api';

export const getWishlist = () => api.get('/wishlists');
export const addToWishlist = (courseId) => api.post('/wishlists', { course: courseId });
export const removeFromWishlist = (courseId) => api.delete(`/wishlists/${courseId}`);
