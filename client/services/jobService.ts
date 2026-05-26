import api from './api';
import type { JobFormData, JobStatus } from '@/types';

export const jobService = {
    async createJob(data: JobFormData) {
        const response = await api.post('/jobs', data);
        return response.data;
    },

    async getJobs(params?: Record<string, string | number>) {
        const response = await api.get('/jobs', { params });
        return response.data;
    },

    async getJobById(id: string) {
        const response = await api.get(`/jobs/${id}`);
        return response.data;
    },

    async updateJobStatus(id: string, status: JobStatus, cancelReason?: string) {
        const response = await api.put(`/jobs/${id}/status`, { status, cancelReason });
        return response.data;
    },

    async getCustomerJobs(status?: JobStatus) {
        const response = await api.get('/jobs/customer/my-jobs', { params: status ? { status } : {} });
        return response.data;
    },

    async getWorkerJobs(status?: JobStatus) {
        const response = await api.get('/jobs/worker/my-jobs', { params: status ? { status } : {} });
        return response.data;
    },

    async sendWorkerQuotation(jobId: string, data: { price: number; availableDate?: string; notes?: string }) {
        const response = await api.post(`/jobs/${jobId}/quotation`, data);
        return response.data;
    },

    async respondToWorkerQuotation(jobId: string, response: 'accepted' | 'rejected') {
        const res = await api.put(`/jobs/${jobId}/quotation/respond`, { response });
        return res.data;
    },

    async raiseComplaint(jobId: string, formData: FormData) {
        const response = await api.post(`/jobs/${jobId}/complaint`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};
