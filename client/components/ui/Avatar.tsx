import React from 'react';
import Image from 'next/image';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
    src?: string | null;
    name?: string;
    size?: AvatarSize;
    className?: string;
    online?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
};

const onlineDotSizes: Record<AvatarSize, string> = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
};

export function Avatar({ src, name = '', size = 'md', className, online }: AvatarProps) {
    const initials = getInitials(name || 'U');
    const bgColor = getAvatarColor(name || 'U');

    return (
        <div className={cn('relative inline-flex flex-shrink-0', className)}>
            <div
                className={cn(
                    'rounded-full overflow-hidden flex items-center justify-center font-semibold text-white',
                    sizeClasses[size],
                    !src && bgColor
                )}
                aria-label={name ? `${name}'s avatar` : 'User avatar'}
            >
                {src ? (
                    <Image
                        src={src}
                        alt={name || 'User avatar'}
                        fill
                        className="object-cover"
                        sizes="80px"
                    />
                ) : (
                    <span aria-hidden="true">{initials}</span>
                )}
            </div>

            {online !== undefined && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-900',
                        onlineDotSizes[size],
                        online ? 'bg-green-500' : 'bg-gray-400'
                    )}
                    aria-label={online ? 'Online' : 'Offline'}
                    role="status"
                />
            )}
        </div>
    );
}
