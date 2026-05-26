'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { reviewSchema, type ReviewFormValues } from '@/lib/validations';
import { reviewService } from '@/services/reviewService';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
    jobId: string;
    workerId: string;
    onSuccess?: () => void;
}

export function ReviewForm({ jobId, workerId, onSuccess }: ReviewFormProps) {
    const [hoveredStar, setHoveredStar] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewImages, setReviewImages] = useState<File[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            rating: 0 as ReviewFormValues['rating'],
            comment: '',
            jobId,
            workerId,
        },
    });

    const selectedRating = watch('rating');

    const onSubmit = async (data: ReviewFormValues) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('jobId', data.jobId);
            formData.append('workerId', data.workerId);
            formData.append('rating', data.rating.toString());
            formData.append('comment', data.comment);
            reviewImages.forEach(file => {
                formData.append('images', file);
            });

            await reviewService.createReview(formData);
            toast.success('Review submitted successfully!');
            onSuccess?.();
        } catch (error: unknown) {
            const message =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Failed to submit review';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Star rating selector */}
            <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Rating <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1" role="group" aria-label="Star rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setValue('rating', star as ReviewFormValues['rating'])}
                                onMouseEnter={() => setHoveredStar(star)}
                                onMouseLeave={() => setHoveredStar(0)}
                                className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                            >
                                <Star
                                    className={cn(
                                        'w-8 h-8 transition-colors',
                                        (hoveredStar || selectedRating) >= star
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300 dark:text-gray-600'
                                    )}
                                    aria-hidden="true"
                                />
                            </button>
                        ))}
                    </div>
                    {(hoveredStar || selectedRating) > 0 && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {ratingLabels[hoveredStar || selectedRating]}
                        </span>
                    )}
                </div>
                {errors.rating && (
                    <p className="text-xs text-red-500 mt-1" role="alert">{errors.rating.message}</p>
                )}
            </div>

            {/* Comment */}
            <div>
                <label
                    htmlFor="review-comment"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block"
                >
                    Your Review <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <textarea
                    id="review-comment"
                    {...register('comment')}
                    rows={4}
                    placeholder="Share your experience working with this professional..."
                    className={cn(
                        'w-full rounded-lg border bg-white dark:bg-gray-900 px-3 py-2.5 text-sm',
                        'text-gray-900 dark:text-gray-100 placeholder-gray-400',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                        'transition-colors resize-none',
                        errors.comment
                            ? 'border-red-400'
                            : 'border-gray-300 dark:border-gray-600'
                    )}
                    aria-invalid={!!errors.comment}
                    aria-describedby={errors.comment ? 'comment-error' : undefined}
                />
                {errors.comment && (
                    <p id="comment-error" className="text-xs text-red-500 mt-1" role="alert">
                        {errors.comment.message}
                    </p>
                )}
            </div>

            {/* Images */}
            <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Attach Images (Optional, Max 5)
                </label>
                <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                        if (e.target.files) {
                            const files = Array.from(e.target.files);
                            if (files.length > 5) {
                                toast.error('Maximum 5 files allowed');
                                return;
                            }
                            setReviewImages(files);
                        }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400"
                />
                {reviewImages.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">{reviewImages.length} file(s) selected</p>
                )}
            </div>

            <Button type="submit" isLoading={isSubmitting} fullWidth>
                Submit Review
            </Button>
        </form>
    );
}
