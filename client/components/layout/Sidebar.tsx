'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Briefcase,
    Star,
    MessageSquare,
    Settings,
    Users,
    AlertTriangle,
    ShieldCheck,
    PlusCircle,
    Search,
    TrendingUp,
    Wallet,
    DollarSign,
    Banknote,
    ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { Avatar } from '@/components/ui/Avatar';

const customerLinks = [
    { href: '/dashboard/customer', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/customer/jobs', label: 'My Jobs', icon: Briefcase },
    { href: '/dashboard/customer/reviews', label: 'My Reviews', icon: Star },
    { href: '/workers', label: 'Find Workers', icon: Search },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/dashboard/customer/settings', label: 'Settings', icon: Settings },
];

const workerLinks = [
    { href: '/dashboard/worker', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/worker/gigs', label: 'My Gigs', icon: Briefcase },
    { href: '/dashboard/worker/gigs/new', label: 'Create Gig', icon: PlusCircle },
    { href: '/dashboard/worker/jobs', label: 'Job Requests', icon: Briefcase },
    { href: '/dashboard/worker/reviews', label: 'My Reviews', icon: Star },
    { href: '/dashboard/worker/earnings', label: 'My Earnings', icon: Wallet },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/dashboard/worker/settings', label: 'Settings', icon: Settings },
];

const adminLinks = [
    { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/admin/users', label: 'Users', icon: Users },
    { href: '/dashboard/admin/workers', label: 'Workers', icon: ShieldCheck },
    { href: '/dashboard/admin/gigs', label: 'Gigs', icon: Briefcase },
    { href: '/dashboard/admin/revenue', label: 'Revenue', icon: DollarSign },
    { href: '/dashboard/admin/withdrawals', label: 'Withdrawals', icon: Banknote },
    { href: '/dashboard/admin/disputes', label: 'Disputes', icon: ShieldAlert },
    { href: '/dashboard/admin/reports', label: 'Reports', icon: AlertTriangle },
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: TrendingUp },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const { unreadCount } = useChatStore();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const links =
        user?.role === 'admin'
            ? adminLinks
            : user?.role === 'worker'
                ? workerLinks
                : customerLinks;

    return (
        <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* User info */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    {mounted ? (
                        <>
                            <Avatar src={user?.profileImage} name={user?.name || ''} size="md" />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {user?.name || 'Guest'}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</p>
                            </div>
                        </>
                    ) : (
                        <div className="animate-pulse flex gap-3 w-full items-center">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-16" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1" aria-label="Dashboard navigation">
                {mounted ? links.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            )}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                                {label}
                            </div>
                            {label === 'Messages' && unreadCount > 0 ? (
                                <span className="bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            ) : null}
                        </Link>
                    );
                }) : (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center gap-3 px-3 py-2.5">
                            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-800 rounded" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                        </div>
                    ))
                )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                {mounted && user?.role !== 'admin' && (
                    <Link
                        href="/messages?contactSupport=true"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 w-full"
                    >
                        <MessageSquare className="w-5 h-5 flex-shrink-0" />
                        Contact Agent
                    </Link>
                )}
                <p className="text-xs text-gray-400 text-center">SkillMatch.lk v1.0</p>
            </div>
        </aside>
    );
}
