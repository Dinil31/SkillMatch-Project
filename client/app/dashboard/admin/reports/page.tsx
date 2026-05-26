'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, Trash2, AlertTriangle, Ban, RefreshCw, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { dummyReviews, dummyWorkers } from '@/lib/dummyData';

type Tab = 'reviews' | 'banned' | 'unverified';

export default function AdminReportsPage() {
    const [tab, setTab] = useState<Tab>('reviews');
    const [reviews, setReviews] = useState(dummyReviews);
    const [bannedUsers, setBannedUsers] = useState<User[]>([]);
    const [unverifiedWorkers, setUnverifiedWorkers] = useState(dummyWorkers.filter(w => !w.isVerified));
    const [isLoading, setIsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const router = useRouter();

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const { default: api } = await import('@/services/api');
            const res = await api.get('/admin/reports');
            setBannedUsers(res.data.reports.bannedUsers ?? []);
            setUnverifiedWorkers(res.data.reports.unverifiedWorkers ?? dummyWorkers.filter(w => !w.isVerified));
            const revRes = await api.get('/admin/reviews');
            setReviews(revRes.data.reviews ?? dummyReviews);
        } catch {
            setBannedUsers([
                { _id: 'u4', name: 'Dilani Jayawardena', email: 'dilani@example.com', role: 'customer', profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dilani', isVerified: true, status: 'banned', createdAt: '2024-03-05T00:00:00Z', updatedAt: '' },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDeleteReview = async (reviewId: string) => {
        setActionLoading(reviewId);
        try {
            const { default: api } = await import('@/services/api');
            await api.delete(`/admin/reviews/${reviewId}`);
            setReviews(prev => prev.filter(r => r._id !== reviewId));
            toast.success('Review deleted');
        } catch {
            toast.error('Failed to delete review.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnban = async (userId: string) => {
        setActionLoading(userId);
        try {
            const { default: api } = await import('@/services/api');
            await api.put(`/admin/users/${userId}/ban`);
            setBannedUsers(prev => prev.filter(u => u._id !== userId));
            toast.success('User unbanned');
        } catch {
            toast.error('Failed to unban user.');
        } finally {
            setActionLoading(null);
        }
    };

    const tabs: { key: Tab; label: string; count: number; color: string }[] = [
        { key: 'reviews', label: 'Review Moderation', count: reviews.length, color: 'text-yellow-600' },
        { key: 'banned', label: 'Banned Users', count: bannedUsers.length, color: 'text-red-600' },
        { key: 'unverified', label: 'Unverified Workers', count: unverifiedWorkers.length, color: 'text-orange-600' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-orange-500" /> Reports & Moderation
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review flagged content and manage platform safety</p>
                    </div>
                    <Button size="sm" variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={load}>Refresh</Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                            {t.label}
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? `${t.color} bg-gray-100 dark:bg-gray-800` : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                {t.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Reviews tab */}
                {tab === 'reviews' && (
                    <div className="space-y-4">
                        {isLoading ? [...Array(3)].map((_, i) => <Skeleton key={i} height={120} className="rounded-2xl" />) :
                            reviews.length === 0 ? (
                                <Card className="text-center py-12"><p className="text-gray-400">No reviews to moderate</p></Card>
                            ) : reviews.map((review, i) => {
                                const customer = review.customerId as User;
                                const worker = review.workerId as User;
                                return (
                                    <motion.div key={review._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                                        <Card>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Avatar src={customer?.profileImage} name={customer?.name} size="sm" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{customer?.name}</p>
                                                            <p className="text-xs text-gray-400">reviewed <span className="font-medium text-gray-600 dark:text-gray-300">{worker?.name}</span> · {formatRelativeTime(review.createdAt)}</p>
                                                        </div>
                                                        <div className="flex gap-0.5 ml-2">
                                                            {[...Array(5)].map((_, s) => (
                                                                <Star key={s} className={`w-3.5 h-3.5 ${s < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">&ldquo;{review.comment}&rdquo;</p>
                                                </div>
                                                <Button size="sm" variant="ghost" isLoading={actionLoading === review._id}
                                                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                                                    onClick={() => handleDeleteReview(review._id)}
                                                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 shrink-0">
                                                    Remove
                                                </Button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                    </div>
                )}

                {/* Banned users tab */}
                {tab === 'banned' && (
                    <Card>
                        <CardTitle className="mb-4">Banned Users</CardTitle>
                        {bannedUsers.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">No banned users</p>
                        ) : (
                            <div className="space-y-3">
                                {bannedUsers.map((user, i) => (
                                    <motion.div key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
                                        <Avatar src={user.profileImage} name={user.name} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                            <p className="text-xs text-gray-400">{user.email} · Banned on {formatDate(user.updatedAt || user.createdAt)}</p>
                                        </div>
                                        <Badge variant="danger" size="sm">Banned</Badge>
                                        <Button size="sm" variant="outline" isLoading={actionLoading === user._id}
                                            leftIcon={<Ban className="w-3.5 h-3.5" />}
                                            onClick={() => handleUnban(user._id)}
                                            className="text-green-600 border-green-300 hover:bg-green-50">
                                            Unban
                                        </Button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

                {/* Unverified workers tab */}
                {tab === 'unverified' && (
                    <Card>
                        <CardTitle className="mb-4">Workers Pending Verification</CardTitle>
                        {unverifiedWorkers.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">All workers are verified</p>
                        ) : (
                            <div className="space-y-3">
                                {unverifiedWorkers.map((worker, i) => {
                                    const user = worker.userId as User;
                                    return (
                                        <motion.div key={worker._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900">
                                            <Avatar src={user?.profileImage} name={user?.name} size="sm" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                                                <p className="text-xs text-gray-400">{worker.category} · {worker.location.city} · Joined {formatDate(worker.createdAt)}</p>
                                            </div>
                                            <Badge variant="warning" size="sm">Pending</Badge>
                                            <Button size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}
                                                onClick={() => router.push('/dashboard/admin/workers')}>
                                                Review
                                            </Button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
