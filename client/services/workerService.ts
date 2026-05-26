import api from './api';
import type { WorkerFilters } from '@/types';

export const workerService = {
    async getWorkers(filters: WorkerFilters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await api.get(`/workers?${params.toString()}`);
        return response.data;
    },

    async getWorkerById(id: string) {
        const response = await api.get(`/workers/${id}`);
        return response.data;
    },

    async getMyProfile() {
        const response = await api.get('/workers/profile/me');
        return response.data;
    },

    async createProfile(data: FormData) {
        const response = await api.post('/workers/profile', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    async updateProfile(data: FormData | Record<string, unknown>) {
        const isFormData = data instanceof FormData;
        const response = await api.put('/workers/profile', data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
        });
        return response.data;
    },

    async updateUserInfo(data: { name?: string; phone?: string }) {
        const response = await api.put('/workers/profile/user-info', data);
        return response.data;
    },

    async changePassword(currentPassword: string, newPassword: string) {
        const response = await api.put('/workers/profile/change-password', { currentPassword, newPassword });
        return response.data;
    },

    async deleteProfile() {
        const response = await api.delete('/workers/profile');
        return response.data;
    },
};
