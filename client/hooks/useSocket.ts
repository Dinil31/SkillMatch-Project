'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import type { Message } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socketInstance: Socket | null = null;

export function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const { user, isAuthenticated } = useAuthStore();
    const { addMessage, setOnlineUsers, setTyping } = useChatStore();

    const getSocket = useCallback((): Socket | null => {
        return socketRef.current;
    }, []);

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        // Reuse existing socket or create new one
        if (!socketInstance || !socketInstance.connected) {
            socketInstance = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });
        }

        socketRef.current = socketInstance;
        const socket = socketRef.current;

        // Announce online status
        socket.emit('user_online', user._id);

        // Listen for online users updates
        socket.on('online_users', (userIds: string[]) => {
            setOnlineUsers(userIds);
        });

        // Listen for incoming messages
        socket.on('receive_message', (message: Message) => {
            if (message.conversationId) {
                addMessage(message.conversationId, message);
            }
        });

        // Listen for typing indicators
        socket.on('typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
            setTyping(userId, isTyping);
        });

        // Listen for message notifications
        socket.on('new_message_notification', (data: { from: string; message: string; conversationId: string }) => {
            const { activeConversationId } = useChatStore.getState();
            if (activeConversationId !== data.conversationId) {
                const { toast } = require('react-hot-toast');
                toast((t: any) => {
                    const React = require('react');
                    return React.createElement(
                        'div',
                        { 
                            className: 'flex flex-col gap-1 cursor-pointer',
                            onClick: () => {
                                toast.dismiss(t.id);
                                window.location.href = '/messages';
                            }
                        },
                        React.createElement('span', { className: 'font-bold text-sm' }, `New message from ${data.from}`),
                        React.createElement('span', { className: 'text-sm text-gray-600 dark:text-gray-300' }, data.message)
                    );
                }, { icon: '💬', duration: 4000 });
            }
        });

        // Listen for standard generic notifications (legacy)
        socket.on('notification', (data: { type: string; message: string }) => {
            const { toast } = require('react-hot-toast');
            toast.success(data.message, { icon: '🔔' });
        });

        // Listen for new rich notifications
        socket.on('new_notification', (notification) => {
            const { toast } = require('react-hot-toast');
            const { addNotification } = require('@/store/useNotificationStore').useNotificationStore.getState();
            
            addNotification(notification);
            toast.success(notification.title || 'New Notification', { icon: '🔔' });
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            socket.emit('user_online', user._id);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        return () => {
            socket.off('online_users');
            socket.off('receive_message');
            socket.off('typing');
            socket.off('new_message_notification');
            socket.off('notification');
            socket.off('new_notification');
        };
    }, [isAuthenticated, user, addMessage, setOnlineUsers, setTyping]);

    const joinRoom = useCallback((conversationId: string) => {
        socketRef.current?.emit('join_room', conversationId);
    }, []);

    const leaveRoom = useCallback((conversationId: string) => {
        socketRef.current?.emit('leave_room', conversationId);
    }, []);

    const sendMessage = useCallback(
        (data: {
            conversationId: string;
            message: string;
            senderId: string;
            receiverId: string;
        }) => {
            socketRef.current?.emit('send_message', data);
        },
        []
    );

    const emitTyping = useCallback((conversationId: string, userId: string, isTyping: boolean) => {
        socketRef.current?.emit('typing', { conversationId, userId, isTyping });
    }, []);

    const isUserOnline = useCallback(
        (userId: string): boolean => {
            const { onlineUsers } = useChatStore.getState();
            return onlineUsers.includes(userId);
        },
        []
    );

    return {
        socket: getSocket(),
        joinRoom,
        leaveRoom,
        sendMessage,
        emitTyping,
        isUserOnline,
    };
}
