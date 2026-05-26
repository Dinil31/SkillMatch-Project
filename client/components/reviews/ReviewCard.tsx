'use client';

import React, { useState } from 'react';
import { Star, ExternalLink, ThumbsUp, CornerDownRight } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatRelativeTime } from '@/lib/utils';
import type { Review, User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { reviewService } from '@/services/reviewService';
import toast from 'react-hot-toast';

interface ReviewCardProps {
    review: Review;
}

export function ReviewCard({ review: initialReview }: ReviewCardProps) {
    const [review, setReview] = useState(initialReview);
    const { user } = useAuthStore();
    const customer = review.customerId as User;
    const worker = review.workerId as User;

    const hasLiked = user && review.likes?.includes(user._id);

    const handleLike = async () => {
        if (!user) {
            toast.error('Please log in to like a review');
            return;
        }
        try {
            const data = await reviewService.likeReview(review._id);
            setReview({ ...review, likes: data.review.likes });
        } catch (error) {
            toast.error('Failed to like review');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
            <div className="flex items-start gap-3">
                <Avatar
                    src={customer?.profileImage}
                    name={customer?.name || 'Customer'}
                    size="sm"
                />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer?.name || 'Customer'}
                        </span>
                        <div className="text-xs text-gray-400 flex-shrink-0">
                            {formatRelativeTime(review.createdAt)}
                            {review.isEdited && (
                                <span className="italic ml-2">
                                    (Edited on {new Date(review.updatedAt).toLocaleDateString()})
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Star rating */}
                    <div className="flex items-center gap-0.5 mb-2" aria-label={`Rating: ${review.rating} out of 5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                aria-hidden="true"
                            />
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 mb-3">
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                                {review.comment}
                            </p>
                        </div>

                        {/* Images */}
                        {review.images && review.images.length > 0 && (
                            <div className="w-full md:w-1/2 flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                                {review.images.map((url, index) => (
                                    <a 
                                        key={index} 
                                        href={url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="group relative flex-shrink-0 w-64 h-64 md:w-96 md:h-96 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={url} 
                                            alt={`Review image ${index + 1}`} 
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform" 
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ExternalLink className="w-6 h-6 text-white" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Interactions */}
                    <div className="flex items-center gap-4 mt-3">
                        <button 
                            onClick={handleLike}
                            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                                hasLiked ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                            {review.likes?.length || 0} {(review.likes?.length === 1) ? 'Like' : 'Likes'}
                        </button>
                    </div>

                    {/* Reply from Worker */}
                    {review.reply && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-2 border-primary-500">
                            <div className="flex items-center gap-2 mb-1">
                                <CornerDownRight className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    Response from {worker?.name || 'Worker'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {formatRelativeTime(review.reply.createdAt)}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                                {review.reply.text}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
