import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

/**
 * Format a date string to a readable format
 */
export function formatDate(date: string | Date, pattern = 'MMM d, yyyy'): string {
    try {
        const d = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(d)) return 'Invalid date';
        return format(d, pattern);
    } catch {
        return 'Invalid date';
    }
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
    try {
        const d = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(d)) return '';
        return formatDistanceToNow(d, { addSuffix: true });
    } catch {
        return '';
    }
}

/**
 * Format a number as Sri Lankan Rupees
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Truncate text to a given length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trimEnd() + '...';
}

/**
 * Get initials from a name (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Generate a consistent avatar background color from a string
 */
export function getAvatarColor(name: string): string {
    const colors = [
        'bg-blue-500',
        'bg-purple-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-red-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-teal-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

/**
 * Format a rating number to one decimal place
 */
export function formatRating(rating: number): string {
    return rating.toFixed(1);
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert a job status to a display-friendly label and color
 */
export function getStatusConfig(status: string): { label: string; color: string } {
    const configs: Record<string, { label: string; color: string }> = {
        pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
        accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-800' },
        'in-progress': { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
        'under-review': { label: 'Under Review', color: 'bg-blue-100 text-blue-600' },
        completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
        cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
        disputed: { label: 'Disputed', color: 'bg-orange-100 text-orange-800' },
        available: { label: 'Available', color: 'bg-green-100 text-green-800' },
        busy: { label: 'Busy', color: 'bg-yellow-100 text-yellow-800' },
        unavailable: { label: 'Unavailable', color: 'bg-red-100 text-red-800' },
    };
    return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
}
