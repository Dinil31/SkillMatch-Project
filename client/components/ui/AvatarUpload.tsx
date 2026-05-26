import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { Avatar } from './Avatar';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
    src?: string | null;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    onUpload: (file: File) => Promise<void>;
    isLoading?: boolean;
}

export function AvatarUpload({ src, name = '', size = 'xl', className, onUpload, isLoading }: AvatarUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await onUpload(file);
        }
        // Reset the input so the same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={cn('relative inline-flex', className)}>
            <Avatar src={src} name={name} size={size} />
            <button
                type="button"
                className={cn(
                    "absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors shadow",
                    isLoading && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Change profile photo"
                onClick={() => !isLoading && fileInputRef.current?.click()}
                disabled={isLoading}
            >
                <Camera className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    );
}
