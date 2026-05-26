'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChatStore } from '@/store/chatStore';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { messageService } from '@/services/messageService';
import type { Conversation } from '@/types';

export default function MessagesPage() {
    useRequireAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const recipientId = searchParams.get('recipientId');
    const recipientName = searchParams.get('recipientName');
    const recipientImage = searchParams.get('recipientImage');
    const contactSupport = searchParams.get('contactSupport');
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { setConversations } = useChatStore();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await messageService.getConversations();
                const loadedConversations = data.conversations || [];
                
                let targetId = recipientId;
                let targetName = recipientName;
                let targetImage = recipientImage;

                if (contactSupport === 'true') {
                    try {
                        const res = await messageService.getSupportAgent();
                        if (res.success && res.agent) {
                            targetId = res.agent._id;
                            targetName = res.agent.name || 'Support Agent';
                            targetImage = res.agent.profileImage || '';
                        }
                    } catch (e) {
                        console.error('Failed to load support agent', e);
                    }
                }

                if (targetId) {
                    const existing = loadedConversations.find((c: Conversation) => c.otherUser._id === targetId);
                    if (existing) {
                        setSelectedConversation(existing);
                        // Move to top
                        const filtered = loadedConversations.filter((c: Conversation) => c.conversationId !== existing.conversationId);
                        setConversations([existing, ...filtered]);
                    } else if (targetName) {
                        const tempConv: Conversation = {
                            conversationId: 'new-' + targetId,
                            otherUser: {
                                _id: targetId,
                                name: targetName,
                                profileImage: targetImage || '',
                                email: '',
                                role: contactSupport === 'true' ? 'admin' : 'worker',
                                isVerified: true,
                                status: 'active',
                                createdAt: '',
                                updatedAt: ''
                            },
                            lastMessage: 'Start a conversation...',
                            lastMessageTime: new Date().toISOString(),
                            unreadCount: 0
                        };
                        setSelectedConversation(tempConv);
                        setConversations([tempConv, ...loadedConversations]);
                    } else {
                        setConversations(loadedConversations);
                    }
                } else {
                    setConversations(loadedConversations);
                }
            } catch (error) {
                console.error('Failed to load conversations:', error);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [setConversations, recipientId, recipientName, recipientImage, contactSupport]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-6 h-screen flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.back()}>
                        Back
                    </Button>
                </div>
                <div className="flex-1 flex gap-4 min-h-0">
                    {/* Conversations list */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-80 flex-shrink-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
                    >
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Messages</h1>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-4 space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex gap-3 animate-pulse">
                                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <ConversationList
                                    onSelectConversation={setSelectedConversation}
                                    selectedConversationId={selectedConversation?.conversationId}
                                />
                            )}
                        </div>
                    </motion.div>

                    {/* Chat window */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 min-w-0"
                    >
                        {selectedConversation ? (
                            <ChatWindow
                                conversationId={selectedConversation.conversationId}
                                otherUser={selectedConversation.otherUser}
                            />
                        ) : (
                            <div className="h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center p-8">
                                <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" aria-hidden="true" />
                                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Select a conversation
                                </h2>
                                <p className="text-sm text-gray-400 max-w-xs">
                                    Choose a conversation from the list to start chatting.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
