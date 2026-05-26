'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useChatStore } from '@/store/chatStore';
import { useSocket } from '@/hooks/useSocket';
import { formatRelativeTime, truncateText, cn } from '@/lib/utils';
import type { Conversation } from '@/types';

interface ConversationListProps {
    onSelectConversation: (conversation: Conversation) => void;
    selectedConversationId?: string;
}

export function ConversationList({
    onSelectConversation,
    selectedConversationId,
}: ConversationListProps) {
    const { conversations } = useChatStore();
    const { isUserOnline } = useSocket();

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">
                    Start a conversation by contacting a worker
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100 dark:divide-gray-800" role="list" aria-label="Conversations">
            {conversations.map((conv) => {
                const isSelected = conv.conversationId === selectedConversationId;
                const isOnline = isUserOnline(conv.otherUser._id);

                return (
                    <button
                        key={conv.conversationId}
                        onClick={() => onSelectConversation(conv)}
                        className={cn(
                            'w-full flex items-center gap-3 p-4 text-left transition-colors',
                            isSelected
                                ? 'bg-primary-50 dark:bg-primary-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                        role="listitem"
                        aria-selected={isSelected}
                    >
                        <Avatar
                            src={conv.otherUser.profileImage}
                            name={conv.otherUser.name}
                            size="md"
                            online={isOnline}
                        />

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <span
                                    className={cn(
                                        'text-sm font-medium truncate',
                                        isSelected
                                            ? 'text-primary-700 dark:text-primary-400'
                                            : 'text-gray-900 dark:text-white'
                                    )}
                                >
                                    {conv.otherUser.name}
                                </span>
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                    {formatRelativeTime(conv.lastMessageTime)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-0.5">
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {truncateText(conv.lastMessage, 40)}
                                </p>
                                {conv.unreadCount > 0 && (
                                    <Badge variant="primary" size="sm" className="flex-shrink-0">
                                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
