'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Users, Briefcase, Star, TrendingUp, ShieldCheck,
    AlertTriangle, CheckCircle, Clock, ArrowRight, Activity,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import type { User } from '@/types';



interface AdminStats {
    totalUsers: number; totalWorkers: number; totalCustomers: number;
    totalJobs: number; completedJobs: number; totalGigs: number;
    totalReviews: number; totalRevenue: number;
    recentUsers: User[]; jobsByStatus: Record<string, number>;
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07 } }) };

export default function AdminDashboardPage() {
    useRequireAuth('admin');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { default: api } = await import('@/services/api');
                const res = await api.get('/admin/stats');
                setStats(res.data.stats);
            } catch {
                setStats(null);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const statCards = stats ? [
        { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', trend: '+12%' },
        { label: 'Active Workers', value: stats.totalWorkers.toLocaleString(), icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950', trend: '+8%' },
        { label: 'Total Jobs', value: stats.totalJobs.toLocaleString(), icon: Briefcase, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950', trend: '+23%' },
        { label: 'Platform Revenue', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950', trend: '+18%' },
        { label: 'Active Gigs', value: stats.totalGigs.toLocaleString(), icon: Star, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950', trend: '+5%' },
        { label: 'Completed Jobs', value: stats.completedJobs.toLocaleString(), icon: CheckCircle, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950', trend: '+31%' },
    ] : [];

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-400', accepted: 'bg-blue-400',
        'in-progress': 'bg-purple-400', completed: 'bg-green-400', cancelled: 'bg-red-400',
    };
    const statusBadge: Record<string, 'warning' | 'primary' | 'secondary' | 'success' | 'danger'> = {
        pending: 'warning', accepted: 'primary', 'in-progress': 'secondary', completed: 'success', cancelled: 'danger',
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-6 h-6 text-primary-600" /> Admin Dashboard
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Platform overview and management</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/dashboard/admin/users"><Button size="sm" variant="outline" leftIcon={<Users className="w-4 h-4" />}>Users</Button></Link>
                        <Link href="/dashboard/admin/workers"><Button size="sm" leftIcon={<ShieldCheck className="w-4 h-4" />}>Verify Workers</Button></Link>
                    </div>
                </div>

                {/* Stat cards */}
                {isLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} height={110} className="rounded-2xl" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {statCards.map((s, i) => (
                            <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="show" custom={i}>
                                <Card className="hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                                            <s.icon className={`w-5 h-5 ${s.color}`} />
                                        </div>
                                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-full">{s.trend}</span>
                                    </div>
                                    <p className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{s.value}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Jobs by status */}
                    <Card>
                        <CardTitle className="mb-5">Jobs by Status</CardTitle>
                        {isLoading ? <Skeleton height={160} className="rounded-xl" /> : stats?.jobsByStatus ? (
                            <div className="space-y-3">
                                {Object.entries(stats.jobsByStatus).map(([status, count]) => {
                                    const total = stats.totalJobs || 1;
                                    const pct = Math.round((count / total) * 100);
                                    return (
                                        <div key={status}>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${statusColors[status] || 'bg-gray-400'}`} />
                                                    <span className="capitalize text-gray-700 dark:text-gray-300 font-medium">{status}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 dark:text-white">{count}</span>
                                                    <span className="text-gray-400 text-xs">({pct}%)</span>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <motion.div className={`h-full rounded-full ${statusColors[status] || 'bg-gray-400'}`}
                                                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 }}
                                                    role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : null}
                    </Card>

                    {/* Recent users */}
                    <Card>
                        <div className="flex items-center justify-between mb-5">
                            <CardTitle>Recent Registrations</CardTitle>
                            <Link href="/dashboard/admin/users">
                                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>View All</Button>
                            </Link>
                        </div>
                        {isLoading ? (
                            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} height={52} className="rounded-xl" />)}</div>
                        ) : (
                            <div className="space-y-2">
                                {stats?.recentUsers?.map((u) => (
                                    <div key={u._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <Avatar src={u.profileImage} name={u.name} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Badge variant={u.role === 'worker' ? 'secondary' : 'primary'} size="sm">{u.role}</Badge>
                                            {u.status === 'banned' && <Badge variant="danger" size="sm">banned</Badge>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Quick nav cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { href: '/dashboard/admin/users', icon: Users, label: 'User Management', desc: 'View, ban, delete users', color: 'from-blue-500 to-cyan-500' },
                        { href: '/dashboard/admin/workers', icon: ShieldCheck, label: 'Worker Verification', desc: 'Approve worker profiles', color: 'from-purple-500 to-violet-500' },
                        { href: '/dashboard/admin/reports', icon: AlertTriangle, label: 'Reports & Reviews', desc: 'Moderate content', color: 'from-orange-500 to-red-500' },
                        { href: '/dashboard/admin/analytics', icon: TrendingUp, label: 'Analytics', desc: 'Platform insights', color: 'from-green-500 to-teal-500' },
                    ].map((item, i) => (
                        <motion.div key={item.href} variants={fadeUp} initial="hidden" animate="show" custom={i + 6}>
                            <Link href={item.href}>
                                <div className="group p-5 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 shadow-sm`}>
                                        <item.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{item.label}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Platform health */}
                <Card>
                    <CardTitle className="mb-4">Platform Health</CardTitle>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Job Completion Rate', value: stats ? `${Math.round((stats.completedJobs / stats.totalJobs) * 100)}%` : '—', icon: CheckCircle, color: 'text-green-500' },
                            { label: 'Active Customers', value: stats?.totalCustomers.toLocaleString() ?? '—', icon: Users, color: 'text-blue-500' },
                            { label: 'Total Reviews', value: stats?.totalReviews.toLocaleString() ?? '—', icon: Star, color: 'text-yellow-500' },
                            { label: 'Pending Jobs', value: stats?.jobsByStatus?.pending?.toString() ?? '—', icon: Clock, color: 'text-orange-500' },
                        ].map((item) => (
                            <div key={item.label} className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
                                <item.icon className={`w-6 h-6 ${item.color} mx-auto mb-2`} />
                                <p className="text-xl font-extrabold text-gray-900 dark:text-white">{item.value}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
