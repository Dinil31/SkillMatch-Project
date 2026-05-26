import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    lines?: number;
}

export function Skeleton({
    variant = 'rectangular',
    width,
    height,
    lines = 1,
    className,
    style,
    ...props
}: SkeletonProps) {
    const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

    if (variant === 'text' && lines > 1) {
        return (
            <div className="space-y-2" {...props}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            baseClasses,
                            'h-4 rounded',
                            i === lines - 1 && 'w-3/4',
                            className
                        )}
                        style={style}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={cn(
                baseClasses,
                variant === 'circular' && 'rounded-full',
                variant === 'text' && 'h-4 rounded',
                variant === 'rectangular' && 'rounded-lg',
                className
            )}
            style={{
                width: width,
                height: height,
                ...style,
            }}
            aria-hidden="true"
            {...props}
        />
    );
}

// Pre-built skeleton for worker cards
export function WorkerCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="text" width="40%" height={12} />
                </div>
            </div>
            <Skeleton variant="text" lines={2} />
            <div className="flex gap-2">
                <Skeleton width={60} height={24} className="rounded-full" />
                <Skeleton width={70} height={24} className="rounded-full" />
                <Skeleton width={55} height={24} className="rounded-full" />
            </div>
            <div className="flex justify-between items-center">
                <Skeleton width={80} height={20} />
                <Skeleton width={100} height={36} className="rounded-lg" />
            </div>
        </div>
    );
}

// Pre-built skeleton for gig cards
export function GigCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <Skeleton height={200} className="rounded-none" />
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton width="50%" height={14} />
                </div>
                <Skeleton variant="text" lines={2} />
                <div className="flex justify-between">
                    <Skeleton width={80} height={20} />
                    <Skeleton width={60} height={20} />
                </div>
            </div>
        </div>
    );
}
