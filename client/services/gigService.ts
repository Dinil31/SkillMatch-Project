import api from './api';
import type { GigFilters } from '@/types';

export const gigService = {
    async getGigs(filters: GigFilters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await api.get(`/gigs?${params.toString()}`);
        return response.data;
    },

    async getGigById(id: string) {
        const response = await api.get(`/gigs/${id}`);
        return response.data;
    },

    async createGig(data: FormData) {
        const response = await api.post('/gigs', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    async updateGig(id: string, data: FormData | Record<string, unknown>) {
        const isFormData = data instanceof FormData;
        const response = await api.put(`/gigs/${id}`, data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
        });
        return response.data;
    },

    async deleteGig(id: string) {
        const response = await api.delete(`/gigs/${id}`);
        return response.data;
    },

    async getWorkerGigs() {
        const response = await api.get('/gigs/worker/my-gigs');
        return response.data;
    },
};
