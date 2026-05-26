'use client';

import React, { useState, useEffect } from 'react';
import { reviewService } from '@/services/reviewService';
import type { Review } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Star, Edit2, Trash2, ExternalLink, ThumbsUp, MessageCircle, CornerDownRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { EditReviewModal } from './EditReviewModal';
import { useAuthStore } from '@/store/authStore';

export function MyReviewsList() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'given' | 'received'>('given');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    const fetchReviews = async () => {
        try {
            setIsLoading(true);
            const data = activeTab === 'given' 
                ? await reviewService.getGivenReviews() 
                : await reviewService.getReceivedReviews();
            setReviews(data.reviews);
        } catch (error) {
            toast.error('Failed to load reviews');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
        setReplyingTo(null);
        setReplyText('');
    }, [activeTab]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        try {
            await reviewService.deleteReview(id);
            setReviews(reviews.filter(r => r._id !== id));
            toast.success('Review deleted successfully');
        } catch (error) {
            toast.error('Failed to delete review');
        }
    };

    const handleLike = async (id: string) => {
        try {
            const data = await reviewService.likeReview(id);
            setReviews(reviews.map(r => r._id === id ? { ...r, likes: data.review.likes } : r));
        } catch (error) {
            toast.error('Failed to like review');
        }
    };

    const handleReply = async (id: string) => {
        if (!replyText.trim()) return;
        try {
            const data = await reviewService.replyToReview(id, replyText);
            setReviews(reviews.map(r => r._id === id ? { ...r, reply: data.review.reply } : r));
            setReplyingTo(null);
            setReplyText('');
            toast.success('Reply added successfully');
        } catch (error) {
            toast.error('Failed to submit reply');
        }
    };

    const renderTabs = () => (
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6">
            <button
                className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'given' 
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('given')}
            >
                Given
            </button>
            <button
                className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'received' 
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('received')}
            >
                Received
            </button>
        </div>
    );

    if (isLoading) {
        return (
            <div>
                {renderTabs()}
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                    ))}
                </div>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div>
                {renderTabs()}
                <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                        {activeTab === 'given' ? "You haven't written any reviews yet." : "You haven't received any reviews yet."}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div>
            {renderTabs()}
            <div className="space-y-4">
                {reviews.map(review => {
                    const isGiven = activeTab === 'given';
                    // Determine the other person involved
                    let otherPerson;
                    if (isGiven) {
                        otherPerson = review.direction === 'customer_to_worker' ? review.workerId : review.customerId;
                    } else {
                        otherPerson = review.direction === 'customer_to_worker' ? review.customerId : review.workerId;
                    }
                    const personData = otherPerson as any;
                    const hasLiked = user && review.likes?.includes(user._id);

                    return (
                        <Card key={review._id}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar 
                                            src={personData?.profileImage} 
                                            fallback={personData?.name?.[0]} 
                                        />
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {isGiven ? 'Review for: ' : 'Review from: '} {personData?.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {formatRelativeTime(review.createdAt)}
                                                {review.isEdited && (
                                                    <span className="italic ml-2">
                                                        (Edited on {new Date(review.updatedAt).toLocaleDateString()})
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isGiven && (
                                            <>
                                                <Button variant="outline" size="sm" onClick={() => setEditingReview(review)}>
                                                    <Edit2 className="w-4 h-4 mr-2" />
                                                    Edit
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleDelete(review._id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </Button>
                                            </>
                                        )}
                                        {!isGiven && !review.reply && (
                                            <Button variant="outline" size="sm" onClick={() => setReplyingTo(replyingTo === review._id ? null : review._id)}>
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                Reply
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 mb-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-5 h-5 ${
                                                star <= review.rating
                                                    ? 'text-yellow-400 fill-yellow-400'
                                                    : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                        />
                                    ))}
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 mb-4">
                                    <div className="flex-1">
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {review.comment}
                                        </p>
                                    </div>
                                    
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

                                <div className="flex items-center gap-4 mt-2">
                                    <button 
                                        onClick={() => handleLike(review._id)}
                                        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                                            hasLiked ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                                        {review.likes?.length || 0} {(review.likes?.length === 1) ? 'Like' : 'Likes'}
                                    </button>
                                </div>

                                {/* Reply Section */}
                                {review.reply && (
                                    <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CornerDownRight className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {isGiven ? personData?.name : 'Your'} Reply
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

                                {/* Reply Input Box */}
                                {!isGiven && replyingTo === review._id && !review.reply && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <textarea
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-2"
                                            rows={3}
                                            placeholder="Write your reply..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            maxLength={1000}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</Button>
                                            <Button size="sm" onClick={() => handleReply(review._id)} disabled={!replyText.trim()}>Post Reply</Button>
                                        </div>
                                    </div>
                                )}

                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {editingReview && (
                <EditReviewModal 
                    review={editingReview} 
                    onClose={() => setEditingReview(null)} 
                    onSuccess={() => {
                        setEditingReview(null);
                        fetchReviews();
                    }} 
                />
            )}
        </div>
    );
}
