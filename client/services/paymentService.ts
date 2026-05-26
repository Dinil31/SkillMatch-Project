import api from './api';
import type { BankDetails } from '@/types';

export const paymentService = {
    async initiatePayment(jobId: string) {
        const res = await api.post('/payments/initiate', { jobId });
        return res.data;
    },

    async confirmPayment(jobId: string, orderId: string) {
        const res = await api.post('/payments/confirm', { jobId, orderId });
        return res.data;
    },

    async releasePayment(jobId: string) {
        const res = await api.post(`/payments/${jobId}/release`);
        return res.data;
    },

    async getWallet() {
        const res = await api.get('/payments/wallet');
        return res.data;
    },

    async getRevenue() {
        const res = await api.get('/payments/revenue');
        return res.data;
    },

    async refundPayment(jobId: string) {
        const res = await api.post(`/payments/${jobId}/refund`);
        return res.data;
    },

    // ── Bank Details ──────────────────────────────────────────────────────────
    async saveBankDetails(data: BankDetails) {
        const res = await api.post('/payments/bank-details', data);
        return res.data;
    },

    async getBankDetails() {
        const res = await api.get('/payments/bank-details');
        return res.data;
    },

    // ── Withdrawals ───────────────────────────────────────────────────────────
    async requestWithdrawal(data: BankDetails & { amount: number; saveDetails?: boolean }) {
        const res = await api.post('/payments/withdraw', data);
        return res.data;
    },

    async getMyWithdrawals() {
        const res = await api.get('/payments/withdraw');
        return res.data;
    },

    // ── Admin ─────────────────────────────────────────────────────────────────
    async getAllWithdrawals(status?: string) {
        const params = status ? `?status=${status}` : '';
        const res = await api.get(`/payments/withdrawals${params}`);
        return res.data;
    },

    async processWithdrawal(id: string, adminNote?: string) {
        const res = await api.put(`/payments/withdrawals/${id}/process`, { adminNote });
        return res.data;
    },
};
