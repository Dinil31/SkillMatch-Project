import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    glass?: boolean;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export function Card({
    glass = false,
    hover = false,
    padding = 'md',
    className,
    children,
    ...props
}: CardProps) {
    return (
        <div
            className={cn(
                'rounded-2xl border transition-all duration-300',
                glass
                    ? [
                        'bg-white/10 dark:bg-white/5',
                        'backdrop-blur-md',
                        'border-white/20 dark:border-white/10',
                        'shadow-glass dark:shadow-glass-dark',
                    ]
                    : [
                        'bg-white dark:bg-gray-900',
                        'border-gray-200 dark:border-gray-700',
                        'shadow-sm',
                    ],
                hover && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
                paddingClasses[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('mb-4', className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-white', className)} {...props}>
            {children}
        </h3>
    );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('text-gray-600 dark:text-gray-400', className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('mt-4 pt-4 border-t border-gray-100 dark:border-gray-800', className)} {...props}>
            {children}
        </div>
    );
}
