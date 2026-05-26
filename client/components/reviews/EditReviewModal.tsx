'use client';

import React, { useState, useRef } from 'react';
import { reviewService } from '@/services/reviewService';
import type { Review } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Star, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditReviewModalProps {
    review: Review;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditReviewModal({ review, onClose, onSuccess }: EditReviewModalProps) {
    const [rating, setRating] = useState(review.rating);
    const [comment, setComment] = useState(review.comment);
    const [existingImages, setExistingImages] = useState<string[]>(review.images || []);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (existingImages.length + newImages.length + files.length > 5) {
                toast.error('You can only attach up to 5 images total.');
                return;
            }
            setNewImages(prev => [...prev, ...files]);
        }
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index: number) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!comment.trim() || !rating) return;
        if (comment.length < 10) {
            toast.error('Comment must be at least 10 characters');
            return;
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append('rating', rating.toString());
            formData.append('comment', comment);
            
            existingImages.forEach(url => {
                formData.append('existingImages', url);
            });
            
            newImages.forEach(file => {
                formData.append('images', file);
            });

            await reviewService.updateReview(review._id, formData);
            toast.success('Review updated successfully!');
            onSuccess();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to update review.';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Card className="w-full max-w-lg bg-white dark:bg-gray-900 overflow-hidden shadow-xl">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Edit Review</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star as any)}
                                    className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full p-1"
                                >
                                    <Star
                                        className={`w-8 h-8 ${
                                            star <= rating
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-gray-300 dark:text-gray-600 hover:text-yellow-200'
                                        } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comment</label>
                        <textarea 
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" 
                            rows={4} 
                            value={comment} 
                            onChange={e => setComment(e.target.value)}
                            maxLength={1000}
                            minLength={10} 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Images (Max 5)</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {existingImages.map((url, i) => (
                                <div key={`existing-${i}`} className="relative w-16 h-16">
                                    <img src={url} alt="Review" className="w-full h-full object-cover rounded-md" />
                                    <button onClick={() => removeExistingImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {newImages.map((file, i) => (
                                <div key={`new-${i}`} className="relative w-16 h-16">
                                    <img src={URL.createObjectURL(file)} alt="New upload" className="w-full h-full object-cover rounded-md" />
                                    <button onClick={() => removeNewImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {existingImages.length + newImages.length < 5 && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md hover:border-primary-500 hover:text-primary-500 transition-colors"
                                >
                                    <Upload className="w-5 h-5 text-gray-400" />
                                </button>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting || !comment.trim() || !rating}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
