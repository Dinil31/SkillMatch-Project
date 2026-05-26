import { create } from 'zustand';
import type { Message, Conversation } from '@/types';
import { useAuthStore } from '@/store/authStore';

interface ChatStore {
    conversations: Conversation[];
    activeConversationId: string | null;
    messages: Record<string, Message[]>;
    onlineUsers: string[];
    typingUsers: Record<string, boolean>;
    unreadCount: number;

    setConversations: (conversations: Conversation[]) => void;
    setActiveConversation: (conversationId: string | null) => void;
    addMessage: (conversationId: string, message: Message) => void;
    setMessages: (conversationId: string, messages: Message[]) => void;
    setOnlineUsers: (userIds: string[]) => void;
    setTyping: (conversationId: string, isTyping: boolean) => void;
    markConversationRead: (conversationId: string) => void;
    updateUnreadCount: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
    conversations: [],
    activeConversationId: null,
    messages: {},
    onlineUsers: [],
    typingUsers: {},
    unreadCount: 0,

    setConversations: (conversations) => {
        set({ conversations });
        get().updateUnreadCount();
    },

    setActiveConversation: (conversationId) => {
        set({ activeConversationId: conversationId });
    },

    addMessage: (conversationId, message) => {
        set((state) => {
            const existing = state.messages[conversationId] || [];
            // Avoid duplicates
            const isDuplicate = existing.some((m) => m._id === message._id);
            if (isDuplicate) return state;

            const updated = [...existing, message];

            // Check if we should increment unread count
            // (if it's not our own message and we're not currently looking at this conversation)
            const isFromOther = message.senderId !== useAuthStore.getState().user?._id && 
                               (typeof message.senderId === 'object' ? message.senderId._id : message.senderId) !== useAuthStore.getState().user?._id;
            
            const shouldIncrementUnread = isFromOther && state.activeConversationId !== conversationId;

            // Update conversation's last message
            const updatedConversations = state.conversations.map((conv) => {
                if (conv.conversationId === conversationId) {
                    return {
                        ...conv,
                        lastMessage: message.message,
                        lastMessageTime: message.createdAt,
                        unreadCount: shouldIncrementUnread ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
                    };
                }
                return conv;
            });

            const newUnreadCount = updatedConversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

            return {
                messages: { ...state.messages, [conversationId]: updated },
                conversations: updatedConversations,
                unreadCount: newUnreadCount,
            };
        });
    },

    setMessages: (conversationId, messages) => {
        set((state) => ({
            messages: { ...state.messages, [conversationId]: messages },
        }));
    },

    setOnlineUsers: (userIds) => {
        set({ onlineUsers: userIds });
    },

    setTyping: (conversationId, isTyping) => {
        set((state) => ({
            typingUsers: { ...state.typingUsers, [conversationId]: isTyping },
        }));
    },

    markConversationRead: (conversationId) => {
        set((state) => ({
            conversations: state.conversations.map((conv) =>
                conv.conversationId === conversationId ? { ...conv, unreadCount: 0 } : conv
            ),
        }));
        get().updateUnreadCount();
    },

    updateUnreadCount: () => {
        const { conversations } = get();
        const total = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        set({ unreadCount: total });
    },
}));
