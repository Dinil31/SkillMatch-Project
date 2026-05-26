import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
type BadgeSize = 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: BadgeSize;
    dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300',
};

const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
};

const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-gray-500',
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    outline: 'bg-gray-500',
};

export function Badge({
    variant = 'default',
    size = 'md',
    dot = false,
    className,
    children,
    ...props
}: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 font-medium rounded-full',
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
            {...props}
        >
            {dot && (
                <span
                    className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])}
                    aria-hidden="true"
                />
            )}
            {children}
        </span>
    );
}
