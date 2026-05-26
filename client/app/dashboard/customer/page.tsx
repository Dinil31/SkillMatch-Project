'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Clock, CheckCircle, Star, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { jobService } from '@/services/jobService';
import { useAuthStore } from '@/store/authStore';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { formatCurrency, formatDate, getStatusConfig } from '@/lib/utils';
import Link from 'next/link';
import type { Job } from '@/types';

export default function CustomerDashboardPage() {
    useRequireAuth('customer');
    const { user } = useAuthStore();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await jobService.getCustomerJobs();
                setJobs(data.jobs || []);
            } catch (error) {
                console.error('Failed to load jobs:', error);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const stats = {
        total: jobs.length,
        pending: jobs.filter((j) => j.status === 'pending').length,
        inProgress: jobs.filter((j) => j.status === 'in-progress').length,
        completed: jobs.filter((j) => j.status === 'completed').length,
    };

    const statCards = [
        { label: 'Total Jobs', value: stats.total, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
        { label: 'In Progress', value: stats.inProgress, icon: ArrowRight, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Welcome */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome back, {user?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Here&apos;s an overview of your activity.
                    </p>
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

                {/* Recent Jobs */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <CardTitle>Recent Jobs</CardTitle>
                        <Link href="/dashboard/customer/jobs">
                            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                                View All
                            </Button>
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} height={60} className="rounded-xl" />
                            ))}
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center py-8">
                            <Briefcase className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" aria-hidden="true" />
                            <p className="text-gray-500 text-sm">No jobs yet.</p>
                            <Link href="/workers" className="mt-3 inline-block">
                                <Button size="sm">Find a Worker</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {jobs.slice(0, 5).map((job) => {
                                const statusConfig = getStatusConfig(job.status);
                                return (
                                    <div
                                        key={job._id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {job.title}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
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

                {/* Quick actions */}
                <Card>
                    <CardTitle className="mb-4">Quick Actions</CardTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Link href="/workers">
                            <Button variant="outline" fullWidth leftIcon={<Star className="w-4 h-4" />}>
                                Find Workers
                            </Button>
                        </Link>
                        <Link href="/gigs">
                            <Button variant="outline" fullWidth leftIcon={<Briefcase className="w-4 h-4" />}>
                                Browse Gigs
                            </Button>
                        </Link>
                        <Link href="/messages">
                            <Button variant="outline" fullWidth>
                                Messages
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
