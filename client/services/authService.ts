import api from './api';
import type { LoginFormData, RegisterFormData } from '@/types';

export const authService = {
    async login(data: LoginFormData) {
        const response = await api.post('/auth/login', data);
        return response.data;
    },

    async register(data: Omit<RegisterFormData, 'confirmPassword'>) {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    async getMe() {
        const response = await api.get('/auth/me');
        return response.data;
    },

    async forgotPassword(email: string) {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    async resetPassword(token: string, password: string) {
        const response = await api.put(`/auth/reset-password/${token}`, { password });
        return response.data;
    },

    async verifyEmail(token: string) {
        const response = await api.get(`/auth/verify-email/${token}`);
        return response.data;
    },

    async resendVerificationEmail() {
        const response = await api.post('/auth/resend-verification');
        return response.data;
    },

    async verifyEmailOtp(otp: string) {
        const response = await api.post('/auth/verify-email-otp', { otp });
        return response.data;
    },

    async switchRole(role: 'customer' | 'worker') {
        const response = await api.put('/auth/switch-role', { role });
        return response.data;
    },

    async deleteAccount() {
        const response = await api.delete('/auth/me');
        return response.data;
    },
};
