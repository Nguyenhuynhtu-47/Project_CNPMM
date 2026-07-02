import api from './api';

export const updateProfile = (data) => {
    const formData = new FormData();

    formData.append('fullName', data.fullName);
    formData.append('phone', data.phone);
    formData.append('address', data.address);
    formData.append('avatar', data.avatar || '');

    if (data.avatarFile) {
        formData.append('avatarFile', data.avatarFile);
    }

    return api.put('/user/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
