import api from './api';
import type { Notification } from '@/types';

export const notificationService = {
    async getNotifications(page = 1, limit = 20) {
        const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
        return response.data;
    },

    async markAsRead(id: string) {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },

    async markAllAsRead() {
        const response = await api.put('/notifications/read-all');
        return response.data;
    }
};
