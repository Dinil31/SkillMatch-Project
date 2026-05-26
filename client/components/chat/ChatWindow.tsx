'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Send, Loader2, FileText, Check, X, Paperclip, Trash2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { QuotationModal } from './QuotationModal';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useSocket } from '@/hooks/useSocket';
import { messageService } from '@/services/messageService';
import { formatRelativeTime, cn } from '@/lib/utils';
import type { User } from '@/types';

interface ChatWindowProps {
    conversationId: string;
    otherUser: User;
}

function messageService_stub() {
    // Inline stub — real import from services/messageService
    return null;
}

export function ChatWindow({ conversationId, otherUser }: ChatWindowProps) {
    const [inputValue, setInputValue] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showQuotationModal, setShowQuotationModal] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { user } = useAuthStore();
    const { messages, setMessages, addMessage, typingUsers, setTyping, markConversationRead } =
        useChatStore();
    const { joinRoom, leaveRoom, sendMessage: socketSendMessage, emitTyping, isUserOnline } =
        useSocket();

    const conversationMessages = messages[conversationId] || [];
    const isOtherUserTyping = typingUsers[conversationId];
    const isOnline = isUserOnline(otherUser._id);

    // Load messages and join room
    useEffect(() => {
        joinRoom(conversationId);
        markConversationRead(conversationId);

        const loadMessages = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/messages/${conversationId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('skillmatch_token')}`,
                        },
                    }
                );
                const data = await response.json();
                if (data.success) {
                    setMessages(conversationId, data.messages);
                }
            } catch (error) {
                console.error('Failed to load messages:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadMessages();

        return () => {
            leaveRoom(conversationId);
        };
    }, [conversationId, joinRoom, leaveRoom, setMessages, markConversationRead]);

    // Handle quotation updates from socket
    useEffect(() => {
        const handleQuotationUpdate = (updatedMessage: any) => {
            if (updatedMessage.conversationId === conversationId) {
                // We need to update this specific message in the store
                // The chatStore addMessage might just append, so we might need a specific update function
                // For simplicity, we can just fetch messages again or update local state
                // Since chatStore is global, we can just re-fetch messages for this room
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${conversationId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('skillmatch_token')}` }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) setMessages(conversationId, data.messages);
                });
            }
        };

        // Assume we don't have a direct useSocket hook for this event yet, so we listen on the global socket if exposed, or just rely on re-fetching periodically if needed.
        // Wait, useSocket.ts handles socket events. Let's just re-fetch when needed.
    }, [conversationId, setMessages]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversationMessages]);

    const handleSend = async (messageType = 'text', quotationDetails?: any) => {
        const trimmed = inputValue.trim();
        if (messageType === 'text' && !trimmed && !attachment) return;
        if (messageType === 'quotation' && !quotationDetails) return;
        if (isSending || !user) return;

        setIsSending(true);
        setInputValue('');
        const currentAttachment = attachment;
        setAttachment(null);
        if (messageType === 'quotation') setShowQuotationModal(false);

        try {
            const isFile = currentAttachment !== null;
            let finalMessageType = messageType;
            if (isFile && messageType === 'text') {
                finalMessageType = currentAttachment.type.startsWith('image/') ? 'image' : 'file';
            }

            const formData = new FormData();
            formData.append('receiverId', otherUser._id);
            formData.append('message', messageType === 'quotation' ? 'Sent a quotation' : trimmed);
            formData.append('messageType', finalMessageType);
            
            if (quotationDetails) {
                formData.append('quotationDetails', JSON.stringify(quotationDetails));
            }
            if (currentAttachment) {
                formData.append('attachment', currentAttachment);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('skillmatch_token')}`,
                },
                body: formData,
            });
            const data = await response.json();
            if (data.success) {
                addMessage(conversationId, data.message);
            } else {
                import('react-hot-toast').then(({ default: toast }) => {
                    toast.error(data.message || 'Failed to send message');
                });
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleAcceptQuotation = async (messageId: string) => {
        setActionLoading(messageId);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/from-quotation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('skillmatch_token')}`,
                },
                body: JSON.stringify({ messageId }),
            });
            if (response.ok) {
                // Re-fetch messages to get updated status
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${conversationId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('skillmatch_token')}` }
                });
                const data = await res.json();
                if (data.success) setMessages(conversationId, data.messages);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectQuotation = async (messageId: string) => {
        setActionLoading(messageId);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}/quotation-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('skillmatch_token')}`,
                },
                body: JSON.stringify({ status: 'rejected' }),
            });
            if (response.ok) {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${conversationId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('skillmatch_token')}` }
                });
                const data = await res.json();
                if (data.success) setMessages(conversationId, data.messages);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);

        if (!user) return;
        emitTyping(conversationId, user._id, true);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            emitTyping(conversationId, user._id, false);
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearChat = async () => {
        try {
            await messageService.clearConversation(conversationId);
            setMessages(conversationId, []);
            toast.success('Chat cleared');
        } catch (error) {
            console.error('Failed to clear chat:', error);
            toast.error('Failed to clear chat');
        }
    };

    const handleSendLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }
        setIsSending(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await messageService.sendMessage({
                        receiverId: otherUser._id,
                        message: JSON.stringify({ lat: latitude, lng: longitude }),
                        messageType: 'location'
                    });
                    if (response.success) {
                        addMessage(conversationId, response.message);
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('Failed to send location');
                } finally {
                    setIsSending(false);
                }
            },
            () => {
                setIsSending(false);
                toast.error('Unable to retrieve your location');
            }
        );
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <Avatar
                        src={otherUser.profileImage}
                        name={otherUser.name}
                        size="md"
                        online={isOnline}
                    />
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{otherUser.name}</p>
                        <p className="text-xs text-gray-500">
                            {isOnline ? 'Online' : 'Offline'}
                        </p>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearChat}
                    title="Clear Chat"
                    className="text-gray-500 hover:text-red-500"
                >
                    <Trash2 className="w-5 h-5" />
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-live="polite" aria-label="Chat messages">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : conversationMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-gray-400 text-sm">No messages yet.</p>
                        <p className="text-gray-400 text-xs mt-1">Say hello to {otherUser.name}!</p>
                    </div>
                ) : (
                    conversationMessages.map((msg) => {
                        const isMine = (typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId as User)._id) === user?._id;
                        return (
                            <div
                                key={msg._id}
                                className={cn('flex gap-2 w-full', isMine ? 'flex-row-reverse' : 'flex-row')}
                            >
                                {!isMine && (
                                    <Avatar src={otherUser.profileImage} name={otherUser.name} size="xs" />
                                )}
                                <div className={cn("flex flex-col max-w-[80%]", isMine ? "items-end" : "items-start")}>
                                    {msg.messageType === 'quotation' && msg.quotationDetails ? (
                                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm min-w-[250px]">
                                            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                                                <FileText className="w-5 h-5 text-primary-500" />
                                                <span className="font-semibold text-gray-900 dark:text-white">Quotation</span>
                                                <Badge 
                                                    variant={msg.quotationDetails.status === 'accepted' ? 'success' : msg.quotationDetails.status === 'rejected' ? 'danger' : 'warning'} 
                                                    size="sm" 
                                                    className="ml-auto"
                                                >
                                                    {msg.quotationDetails.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                                LKR {msg.quotationDetails.budget}
                                            </p>
                                            <p className="text-xs text-gray-500 mb-3">
                                                Delivery in {msg.quotationDetails.deliveryTime} {msg.quotationDetails.deliveryUnit}
                                            </p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                                                {msg.quotationDetails.description}
                                            </p>
                                            
                                            {!isMine && msg.quotationDetails.status === 'pending' && (
                                                <div className="flex gap-2 mt-2">
                                                    <Button 
                                                        size="sm" 
                                                        variant="success" 
                                                        className="flex-1"
                                                        isLoading={actionLoading === msg._id}
                                                        onClick={() => handleAcceptQuotation(msg._id as string)}
                                                    >
                                                        Accept
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="danger" 
                                                        className="flex-1"
                                                        isLoading={actionLoading === msg._id}
                                                        onClick={() => handleRejectQuotation(msg._id as string)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-gray-400 mt-2 text-right">
                                                {formatRelativeTime(msg.createdAt)}
                                            </p>
                                        </div>
                                    ) : (
                                        <div
                                            className={cn(
                                                'rounded-2xl px-4 py-2.5 text-sm',
                                                isMine
                                                    ? 'bg-primary-600 text-white rounded-tr-sm'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm'
                                            )}
                                        >
                                            {msg.messageType === 'image' && msg.fileUrl ? (
                                                <div className="mb-2 max-w-[200px] sm:max-w-[300px]">
                                                    <img src={msg.fileUrl} alt="attachment" className="rounded-xl w-full h-auto object-cover" />
                                                </div>
                                            ) : msg.messageType === 'file' && msg.fileUrl ? (
                                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mb-2 bg-white/20 dark:bg-black/20 p-2 rounded-lg hover:bg-white/30 transition-colors">
                                                    <FileText className="w-5 h-5" />
                                                    <span className="underline truncate">View Document</span>
                                                </a>
                                            ) : msg.messageType === 'location' ? (
                                                (() => {
                                                    try {
                                                        const { lat, lng } = JSON.parse(msg.message);
                                                        return (
                                                            <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-1 hover:underline", isMine ? "text-white" : "text-blue-500")}>
                                                                <MapPin className="w-4 h-4" /> View Location
                                                            </a>
                                                        );
                                                    } catch (e) {
                                                        return <p className="whitespace-pre-wrap">{msg.message}</p>;
                                                    }
                                                })()
                                            ) : null}
                                            {msg.messageType !== 'location' && msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}
                                            <p
                                                className={cn(
                                                    'text-xs mt-1 text-right',
                                                    isMine ? 'text-primary-200' : 'text-gray-400'
                                                )}
                                            >
                                                {formatRelativeTime(msg.createdAt)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Typing indicator */}
                {isOtherUserTyping && (
                    <div className="flex gap-2 items-center">
                        <Avatar src={otherUser.profileImage} name={otherUser.name} size="xs" />
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2.5">
                            <div className="flex gap-1 items-center h-4">
                                {[0, 1, 2].map((i) => (
                                    <span
                                        key={i}
                                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: `${i * 0.15}s` }}
                                        aria-hidden="true"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 relative">
                {attachment && (
                    <div className="absolute bottom-full left-0 mb-2 ml-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2 shadow-sm">
                        {attachment.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(attachment)} alt="preview" className="w-10 h-10 object-cover rounded" />
                        ) : (
                            <FileText className="w-8 h-8 text-primary-500" />
                        )}
                        <div className="text-xs truncate max-w-[150px]">{attachment.name}</div>
                        <button onClick={() => setAttachment(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <div className="flex gap-2">
                    {user?.role === 'worker' && (
                        <Button 
                            variant="outline" 
                            size="md"
                            onClick={() => setShowQuotationModal(true)}
                            title="Send Quotation"
                            className="px-3"
                        >
                            <FileText className="w-5 h-5" />
                        </Button>
                    )}
                    <Button 
                        variant="outline" 
                        size="md"
                        onClick={handleSendLocation}
                        title="Send Location"
                        className="px-3"
                    >
                        <MapPin className="w-5 h-5" />
                    </Button>
                    <label className="flex items-center justify-center cursor-pointer px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.[0]) setAttachment(e.target.files[0]);
                                e.target.value = '';
                            }}
                        />
                    </label>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleTyping}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${otherUser.name}...`}
                        className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        aria-label="Type a message"
                    />
                    <Button
                        onClick={() => handleSend('text')}
                        isLoading={isSending && !showQuotationModal}
                        disabled={!inputValue.trim() && !attachment}
                        size="md"
                        aria-label="Send message"
                    >
                        <Send className="w-4 h-4" aria-hidden="true" />
                    </Button>
                </div>
            </div>

            {showQuotationModal && (
                <QuotationModal 
                    onClose={() => setShowQuotationModal(false)}
                    isSubmitting={isSending}
                    onSubmit={(data) => handleSend('quotation', data)}
                />
            )}

            <ConfirmModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={handleClearChat}
                title="Clear Chat"
                message="Are you sure you want to clear this chat? This action cannot be undone."
                isDanger={true}
                confirmText="Clear Chat"
            />
        </div>
    );
}
