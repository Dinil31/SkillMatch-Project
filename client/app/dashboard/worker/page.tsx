'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, DollarSign, Star, TrendingUp, ArrowRight, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { jobService } from '@/services/jobService';
import { gigService } from '@/services/gigService';
import { useAuthStore } from '@/store/authStore';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { formatCurrency, formatDate, getStatusConfig } from '@/lib/utils';
import type { Job, Gig } from '@/types';

export default function WorkerDashboardPage() {
    useRequireAuth('worker');
    const { user } = useAuthStore();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [gigs, setGigs] = useState<Gig[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const load = async () => {
            try {
                const [jobData, gigData] = await Promise.all([
                    jobService.getWorkerJobs(),
                    gigService.getWorkerGigs(),
                ]);
                setJobs(jobData.jobs || []);
                setGigs(gigData.gigs || []);
            } catch (error) {
                console.error('Failed to load worker data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const totalEarnings = jobs
        .filter((j) => j.status === 'completed')
        .reduce((sum, j) => sum + j.budget, 0);

    const statCards = [
        {
            label: 'Total Earnings',
            value: formatCurrency(totalEarnings),
            icon: DollarSign,
            color: 'text-green-500',
            bg: 'bg-green-50 dark:bg-green-900/20',
        },
        {
            label: 'Active Gigs',
            value: gigs.filter((g) => g.isActive).length,
            icon: Briefcase,
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
            label: 'Completed Jobs',
            value: jobs.filter((j) => j.status === 'completed').length,
            icon: TrendingUp,
            color: 'text-purple-500',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
        },
        {
            label: 'Pending Requests',
            value: jobs.filter((j) => j.status === 'pending').length,
            icon: Star,
            color: 'text-yellow-500',
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Welcome */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Welcome back{mounted && user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 🛠️
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Manage your gigs and incoming job requests.
                        </p>
                    </div>
                    <Link href="/dashboard/worker/gigs/new">
                        <Button leftIcon={<PlusCircle className="w-4 h-4" />}>New Gig</Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card>
                                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} aria-hidden="true" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Earnings Overview */}
                <Card>
                    <CardTitle className="mb-4">Earnings Overview</CardTitle>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/10">
                            <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" aria-hidden="true" />
                            <p className="text-xl font-extrabold text-gray-900 dark:text-white">{formatCurrency(totalEarnings)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Earned</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10">
                            <Briefcase className="w-6 h-6 text-blue-500 mx-auto mb-2" aria-hidden="true" />
                            <p className="text-xl font-extrabold text-gray-900 dark:text-white">{jobs.filter(j => j.status === 'completed').length}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Jobs Done</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10">
                            <Star className="w-6 h-6 text-purple-500 mx-auto mb-2" aria-hidden="true" />
                            <p className="text-xl font-extrabold text-gray-900 dark:text-white">{jobs.filter(j => j.status === 'in-progress').length}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">In Progress</p>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Active Gigs */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <CardTitle>Active Gigs</CardTitle>
                            <Link href="/dashboard/worker/gigs">
                                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                                    View All
                                </Button>
                            </Link>
                        </div>

                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2].map((i) => <Skeleton key={i} height={60} className="rounded-xl" />)}
                            </div>
                        ) : gigs.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-gray-400 text-sm mb-3">No gigs yet.</p>
                                <Link href="/dashboard/worker/gigs/new">
                                    <Button size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                                        Create Your First Gig
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {gigs.slice(0, 3).map((gig) => (
                                    <div
                                        key={gig._id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {gig.title}
                                            </p>
                                            <p className="text-xs text-gray-400">{formatCurrency(gig.price)}</p>
                                        </div>
                                        <Badge variant={gig.isActive ? 'success' : 'default'} size="sm">
                                            {gig.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Recent Job Requests */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <CardTitle>Job Requests</CardTitle>
                            <Link href="/dashboard/worker/jobs">
                                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                                    View All
                                </Button>
                            </Link>
                        </div>

                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2].map((i) => <Skeleton key={i} height={60} className="rounded-xl" />)}
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-gray-400 text-sm">No job requests yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {jobs.slice(0, 3).map((job) => {
                                    const statusConfig = getStatusConfig(job.status);
                                    return (
                                        <div
                                            key={job._id}
                                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {job.title}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {formatDate(job.createdAt)} · {formatCurrency(job.budget)}
                                                </p>
                                            </div>
                                            <Badge className={statusConfig.color} size="sm">
                                                {statusConfig.label}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
