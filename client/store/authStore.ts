import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authService } from '@/services/authService';



interface AuthStore {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    login: (email: string, password: string) => Promise<void>;
    register: (data: {
        name: string;
        email: string;
        phone: string;
        password: string;
        role: 'customer' | 'worker';
    }) => Promise<void>;
    switchRole: (role: 'customer' | 'worker') => Promise<void>;
    logout: () => void;
    setUser: (user: User) => void;
    fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,

            login: async (email, password) => {
                set({ isLoading: true });
                try {
                    const data = await authService.login({ email, password });
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('skillmatch_token', data.token);
                    }
                    set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            register: async (formData) => {
                set({ isLoading: true });
                try {
                    const data = await authService.register(formData);
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('skillmatch_token', data.token);
                    }
                    set({
                        user: data.user,
                        token: data.token,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            switchRole: async (role) => {
                set({ isLoading: true });
                try {
                    const data = await authService.switchRole(role);
                    set({ user: data.user, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('skillmatch_token');
                    localStorage.removeItem('skillmatch_user');
                }
                set({ user: null, token: null, isAuthenticated: false });
            },

            setUser: (user) => set({ user }),

            fetchMe: async () => {
                const { token } = get();
                if (!token) return;
                try {
                    const data = await authService.getMe();
                    set({ user: data.user, isAuthenticated: true });
                } catch {
                    set({ user: null, token: null, isAuthenticated: false });
                }
            },
        }),
        {
            name: 'skillmatch_auth',
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
