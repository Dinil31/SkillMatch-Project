import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    setNotifications: (notifications: Notification[], unreadCount: number) => void;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    unreadCount: 0,
    setNotifications: (notifications, unreadCount) => set({ notifications, unreadCount }),
    addNotification: (notification) =>
        set((state) => {
            // Check if it already exists to prevent duplicates
            const exists = state.notifications.some((n) => n._id === notification._id);
            if (exists) return state;

            return {
                notifications: [notification, ...state.notifications],
                unreadCount: state.unreadCount + 1,
            };
        }),
    markAsRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n._id === id ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        })),
    markAllAsRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
        })),
}));
