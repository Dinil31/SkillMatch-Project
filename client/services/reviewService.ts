import api from './api';
import type { ReviewFormData } from '@/types';

export const reviewService = {
    async createReview(data: FormData) {
        const response = await api.post('/reviews', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    async getWorkerReviews(workerId: string, page = 1, limit = 10) {
        const response = await api.get(`/reviews/worker/${workerId}`, {
            params: { page, limit },
        });
        return response.data;
    },

    async getGivenReviews(page = 1, limit = 10) {
        const response = await api.get(`/reviews/given`, {
            params: { page, limit },
        });
        return response.data;
    },

    async getReceivedReviews(page = 1, limit = 10) {
        const response = await api.get(`/reviews/received`, {
            params: { page, limit },
        });
        return response.data;
    },

    async updateReview(id: string, data: FormData) {
        const response = await api.put(`/reviews/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    async deleteReview(id: string) {
        const response = await api.delete(`/reviews/${id}`);
        return response.data;
    },

    async replyToReview(id: string, text: string) {
        const response = await api.put(`/reviews/${id}/reply`, { text });
        return response.data;
    },

    async likeReview(id: string) {
        const response = await api.put(`/reviews/${id}/like`);
        return response.data;
    },

    async getPublicTopReviews() {
        const response = await api.get(`/reviews/top`);
        return response.data;
    },
};
