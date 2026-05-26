'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu,
    X,
    Sun,
    Moon,
    Bell,
    ChevronDown,
    LogOut,
    User,
    LayoutDashboard,
    Briefcase,
    MessageSquare,
    RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useChatStore } from '@/store/chatStore';
import { notificationService } from '@/services/notificationService';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const navLinks = [
    { href: '/workers', label: 'Find Workers' },
    { href: '/gigs', label: 'Browse Gigs' },
];

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { notifications, unreadCount, setNotifications, markAsRead } = useNotificationStore();
    const { unreadCount: chatUnreadCount } = useChatStore();

    const isHomePage = pathname === '/';
    const isSolid = true; // Always solid now since hero is white

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) {
            notificationService.getNotifications().then((res: any) => {
                const data = res.data || res;
                setNotifications(data.notifications || [], data.unreadCount || 0);
            }).catch(err => console.error(err));
        }
    }, [isAuthenticated, user, setNotifications]);

    useEffect(() => {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        }
        setMounted(true);
    }, []);

    const toggleDark = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    const getDashboardLink = () => {
        if (!user) return '/dashboard';
        return `/dashboard/${user.role}`;
    };

    return (
        <nav
            className={cn(
                'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
                isSolid
                    ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-700/50'
                    : 'bg-transparent'
            )}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center font-bold text-xl">
                        <span className="font-extrabold tracking-tight text-gray-900 dark:text-white text-2xl">
                            SkillMatch<span className="text-primary-600">.lk</span>
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'text-sm font-semibold transition-colors',
                                    pathname === link.href
                                        ? isSolid ? 'text-primary-600 dark:text-primary-400' : 'text-white'
                                        : isSolid
                                            ? 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                                            : 'text-white/80 hover:text-white'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDark}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                isSolid
                                    ? 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                            )}
                            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        {mounted && (
                            isAuthenticated && user ? (
                                <>
                                    {/* Contact Support */}
                                    {user.role !== 'admin' && (
                                        <Link
                                            href="/messages?contactSupport=true"
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5',
                                                isSolid
                                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
                                                    : 'bg-white/10 text-white hover:bg-white/20'
                                            )}
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            <span className="hidden sm:inline">Contact Support</span>
                                        </Link>
                                    )}
                                    {/* Notifications */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                            className={cn(
                                                "p-2 rounded-lg transition-colors relative",
                                                isSolid
                                                    ? "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    : "text-white/70 hover:text-white hover:bg-white/10"
                                            )}
                                            aria-label="Notifications"
                                            aria-expanded={isNotificationsOpen}
                                            aria-haspopup="true"
                                        >
                                            <Bell className="w-5 h-5" />
                                            {unreadCount > 0 && (
                                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full" aria-hidden="true">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </span>
                                            )}
                                        </button>

                                        <AnimatePresence>
                                            {isNotificationsOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 overflow-hidden"
                                                    role="menu"
                                                >
                                                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
                                                    </div>
                                                    <div className="max-h-64 overflow-y-auto">
                                                        {notifications.length === 0 ? (
                                                            <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                                                No notifications
                                                            </div>
                                                        ) : (
                                                            notifications.map((notification) => (
                                                                <button
                                                                    key={notification._id}
                                                                    onClick={() => {
                                                                        setIsNotificationsOpen(false);
                                                                        if (!notification.isRead) {
                                                                            notificationService.markAsRead(notification._id);
                                                                            markAsRead(notification._id);
                                                                        }
                                                                        if (notification.link) router.push(notification.link);
                                                                    }}
                                                                    className={cn(
                                                                        "w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800/50",
                                                                        !notification.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
                                                                    )}
                                                                >
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                                                                    <p className="text-xs text-gray-500 mt-0.5">{notification.message}</p>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* User dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className={cn(
                                                "flex items-center gap-2 p-1.5 rounded-xl transition-colors",
                                                isSolid
                                                    ? "hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    : "hover:bg-white/10"
                                            )}
                                            aria-expanded={isDropdownOpen}
                                            aria-haspopup="true"
                                        >
                                            <Avatar src={user.profileImage} name={user.name} size="sm" />
                                            <span className={cn(
                                                "hidden sm:block text-sm font-medium truncate",
                                                isSolid ? "text-gray-700 dark:text-gray-300" : "text-white"
                                            )}>
                                                {user.name}
                                            </span>
                                            <ChevronDown className={cn("w-4 h-4", isSolid ? "text-gray-400" : "text-white/70")} />
                                        </button>

                                        <AnimatePresence>
                                            {isDropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 overflow-hidden"
                                                    role="menu"
                                                >
                                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                                        <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                                                    </div>
                                                    <div className="py-2">
                                                        <Link href={getDashboardLink()} onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                            <LayoutDashboard className="w-4 h-4 text-gray-400" />
                                                            Dashboard
                                                        </Link>
                                                        <Link
                                                            href={user.role === 'worker' ? '/dashboard/worker/settings' : user.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer/settings'}
                                                            onClick={() => setIsDropdownOpen(false)}
                                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                                        >
                                                            <User className="w-4 h-4 text-gray-400" />
                                                            Profile & Settings
                                                        </Link>
                                                        {user.role === 'customer' && (
                                                            <Link href="/dashboard/customer/jobs" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                                <Briefcase className="w-4 h-4 text-gray-400" />
                                                                My Jobs
                                                            </Link>
                                                        )}
                                                        {user.role === 'worker' && (
                                                            <Link href="/dashboard/worker/jobs" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                                <Briefcase className="w-4 h-4 text-gray-400" />
                                                                Job Requests
                                                            </Link>
                                                        )}
                                                        <Link href="/messages" onClick={() => setIsDropdownOpen(false)} className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <MessageSquare className="w-4 h-4 text-gray-400" />
                                                                Messages
                                                            </div>
                                                            {chatUnreadCount > 0 ? (
                                                                <span className="bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                                    {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                                                                </span>
                                                            ) : null}
                                                        </Link>
                                                    </div>

                                                    {/* Role Switcher */}
                                                    {user.role !== 'admin' && (
                                                        <div className="border-t border-gray-100 dark:border-gray-800 pt-2 pb-2">
                                                            <button
                                                                onClick={async () => {
                                                                    setIsDropdownOpen(false);
                                                                    try {
                                                                        const newRole = user.role === 'worker' ? 'customer' : 'worker';
                                                                        await useAuthStore.getState().switchRole(newRole);
                                                                        router.push(`/dashboard/${newRole}`);
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                    }
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                                {user.role === 'worker' ? 'Switch to Buying' : 'Switch to Selling'}
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className="border-t border-gray-100 dark:border-gray-800 pt-2">
                                                        <button
                                                            onClick={() => {
                                                                setIsDropdownOpen(false);
                                                                logout();
                                                                router.push('/login');
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            role="menuitem"
                                                        >
                                                            <LogOut className="w-4 h-4" />
                                                            Log Out
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            ) : (
                                <div className="hidden md:flex items-center gap-2">
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm"
                                            className={!isSolid ? 'text-white/80 hover:text-white hover:bg-white/10' : ''}>
                                            Sign In
                                        </Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button size="sm"
                                            className={!isSolid ? 'bg-white text-primary-700 hover:bg-gray-100' : ''}>
                                            Get Started
                                        </Button>
                                    </Link>
                                </div>
                            )
                        )}

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={cn(
                                "md:hidden p-2 rounded-lg transition-colors",
                                isSolid 
                                    ? "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    : "text-white hover:bg-white/10"
                            )}
                            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={isMenuOpen}
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
                    >
                        <div className="px-4 py-4 space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="block py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {!isAuthenticated && (
                                <div className="flex gap-2 pt-2">
                                    <Link href="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                                        <Button variant="outline" size="sm" fullWidth>Sign In</Button>
                                    </Link>
                                    <Link href="/register" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                                        <Button size="sm" fullWidth>Get Started</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
