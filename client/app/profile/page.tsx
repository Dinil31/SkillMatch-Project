'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * /profile — Smart redirect based on logged-in user role.
 * Workers  → /dashboard/worker/settings
 * Customers → /dashboard/customer/settings
 * Admin    → /dashboard/admin
 * Not logged in → /login
 */
export default function ProfileRedirectPage() {
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || !user) {
            router.replace('/login');
            return;
        }
        if (user.role === 'worker') {
            router.replace('/dashboard/worker/settings');
        } else if (user.role === 'admin') {
            router.replace('/dashboard/admin');
        } else {
            router.replace('/dashboard/customer/settings');
        }
    }, [isAuthenticated, user, router]);

    // Show a minimal loading state while redirecting
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to your profile…</p>
            </div>
        </div>
    );
}
