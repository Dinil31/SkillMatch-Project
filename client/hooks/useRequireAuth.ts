'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function useRequireAuth(requiredRole?: 'customer' | 'worker' | 'admin') {
    const router = useRouter();
    const { isAuthenticated, user, isLoading } = useAuthStore();

    useEffect(() => {
        if (isLoading) return; // wait for auth to initialize
        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }
        if (requiredRole && user?.role !== requiredRole) {
            // Wrong role — redirect to their correct dashboard
            if (user?.role) router.replace(`/dashboard/${user.role}`);
            else router.replace('/');
        }
    }, [isAuthenticated, isLoading, user, router, requiredRole]);

    return { isAuthenticated, user, isLoading };
}
