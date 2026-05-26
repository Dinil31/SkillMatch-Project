'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

export function useAuth() {
    const { user, token, isLoading, isAuthenticated, login, register, logout, fetchMe } =
        useAuthStore();
    const router = useRouter();

    const handleLogin = useCallback(
        async (email: string, password: string, redirectTo = '/') => {
            try {
                await login(email, password);
                toast.success('Welcome back!');
                // Redirect based on role
                const { user } = useAuthStore.getState();
                if (user?.role === 'admin') router.push('/dashboard/admin');
                else if (user?.role === 'worker') router.push('/dashboard/worker');
                else if (user?.role === 'customer') router.push('/dashboard/customer');
                else router.push(redirectTo);
            } catch (error: unknown) {
                const message =
                    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                    'Login failed. Please try again.';
                toast.error(message);
                throw error;
            }
        },
        [login, router]
    );

    const handleRegister = useCallback(
        async (data: { name: string; email: string; phone: string; password: string; role: 'customer' | 'worker' }, redirect = true) => {
            try {
                await register(data);
                toast.success('Account created! Welcome to SkillMatch.');
                // Redirect based on role only if redirect flag is true
                if (redirect) {
                    if (data.role === 'worker') router.push('/dashboard/worker');
                    else router.push('/dashboard/customer');
                }
            } catch (error: unknown) {
                const message =
                    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                    'Registration failed. Please try again.';
                toast.error(message);
                throw error;
            }
        },
        [register, router]
    );

    const handleLogout = useCallback(() => {
        logout();
        toast.success('Logged out successfully');
        router.push('/');
    }, [logout, router]);

    const requireAuth = useCallback(
        (redirectTo = '/login') => {
            if (!isAuthenticated) {
                router.push(redirectTo);
                return false;
            }
            return true;
        },
        [isAuthenticated, router]
    );

    const requireRole = useCallback(
        (role: 'customer' | 'worker' | 'admin') => {
            if (!isAuthenticated || user?.role !== role) {
                router.push('/');
                return false;
            }
            return true;
        },
        [isAuthenticated, user, router]
    );

    return {
        user,
        token,
        isLoading,
        isAuthenticated,
        isCustomer: user?.role === 'customer',
        isWorker: user?.role === 'worker',
        isAdmin: user?.role === 'admin',
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        fetchMe,
        requireAuth,
        requireRole,
    };
}
