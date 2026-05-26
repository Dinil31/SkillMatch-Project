import api from './api';

export const messageService = {
    async sendMessage(data: any | FormData) {
        const response = await api.post('/messages', data);
        return response.data;
    },

    async clearConversation(conversationId: string) {
        const response = await api.delete(`/messages/${conversationId}`);
        return response.data;
    },

    async getConversation(conversationId: string, page = 1, limit = 50) {
        const response = await api.get(`/messages/${conversationId}`, {
            params: { page, limit },
        });
        return response.data;
    },

    async getConversations() {
        const response = await api.get('/messages/conversations');
        return response.data;
    },

    async markAsRead(messageId: string) {
        const response = await api.put(`/messages/${messageId}/read`);
        return response.data;
    },

    async getSupportAgent() {
        const response = await api.get('/admin/support-agent');
        return response.data;
    },
};
