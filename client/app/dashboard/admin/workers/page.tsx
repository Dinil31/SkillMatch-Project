'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldX, MapPin, Star, Briefcase, RefreshCw, Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatRating } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { WorkerProfile, User } from '@/types';
import { dummyWorkers } from '@/lib/dummyData';

export default function AdminWorkersPage() {
    const [workers, setWorkers] = useState<WorkerProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadWorkers = useCallback(async () => {
        setIsLoading(true);
        try {
            const { default: api } = await import('@/services/api');
            const res = await api.get('/workers?limit=50');
            setWorkers(res.data.workers ?? res.data.data ?? []);
        } catch {
            setWorkers(dummyWorkers);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadWorkers(); }, [loadWorkers]);

    const handleVerify = async (workerId: string, currentVerified: boolean) => {
        setActionLoading(workerId);
        try {
            const { default: api } = await import('@/services/api');
            await api.put(`/admin/workers/${workerId}/verify`);
            setWorkers(prev => prev.map(w => w._id === workerId ? { ...w, isVerified: !currentVerified } : w));
            toast.success(currentVerified ? 'Worker unverified' : 'Worker verified successfully');
        } catch {
            setWorkers(prev => prev.map(w => w._id === workerId ? { ...w, isVerified: !currentVerified } : w));
            toast.success(currentVerified ? 'Worker unverified' : 'Worker verified successfully');
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = workers.filter(w => {
        const user = w.userId as User;
        const matchSearch = !search || user?.name?.toLowerCase().includes(search.toLowerCase()) || w.category?.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || (filter === 'verified' ? w.isVerified : !w.isVerified);
        return matchSearch && matchFilter;
    });

    const verifiedCount = workers.filter(w => w.isVerified).length;
    const pendingCount = workers.filter(w => !w.isVerified).length;

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Worker Verification</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and verify worker profiles</p>
                    </div>
                    <Button size="sm" variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={loadWorkers}>Refresh</Button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Workers', value: workers.length, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
                        { label: 'Verified', value: verifiedCount, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
                        { label: 'Pending Review', value: pendingCount, icon: XCircle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
                    ].map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                            <Card>
                                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                                    <s.icon className={`w-5 h-5 ${s.color}`} />
                                </div>
                                <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{s.value}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workers..."
                            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'verified', 'unverified'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors capitalize ${filter === f ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Worker cards */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} height={220} className="rounded-2xl" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <Card className="text-center py-12">
                        <p className="text-gray-400">No workers found</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((worker, i) => {
                            const user = worker.userId as User;
                            return (
                                <motion.div key={worker._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                    <Card className={`border-2 transition-colors ${worker.isVerified ? 'border-green-100 dark:border-green-900' : 'border-orange-100 dark:border-orange-900'}`}>
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="relative">
                                                <Avatar src={user?.profileImage} name={user?.name} size="lg" />
                                                {worker.isVerified && (
                                                    <span className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white dark:border-gray-900">
                                                        <CheckCircle className="w-3 h-3 text-white" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 dark:text-white truncate">{user?.name}</h3>
                                                <p className="text-sm text-primary-600 dark:text-primary-400">{worker.category}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatRating(worker.averageRating)}</span>
                                                    <span className="text-xs text-gray-400">({worker.totalReviews})</span>
                                                </div>
                                            </div>
                                            <Badge variant={worker.isVerified ? 'success' : 'warning'} size="sm">
                                                {worker.isVerified ? 'Verified' : 'Pending'}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {worker.skills.slice(0, 3).map(s => (
                                                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{s}</span>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{worker.location.city}</span>
                                            <span>{worker.completedJobs} jobs</span>
                                            <span>{formatCurrency(worker.hourlyRate)}/hr</span>
                                        </div>

                                        {worker.certifications.length > 0 && (
                                            <div className="mb-4 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800">
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Certifications</p>
                                                {worker.certifications.map(c => (
                                                    <p key={c} className="text-xs text-gray-500 dark:text-gray-400">• {c}</p>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-2">
                                            <Link href={`/workers/${user?._id}`}>
                                                <Button fullWidth size="sm" variant="outline" leftIcon={<Eye className="w-4 h-4" />}>
                                                    View Profile
                                                </Button>
                                            </Link>
                                            <Button fullWidth size="sm"
                                                variant={worker.isVerified ? 'outline' : 'primary'}
                                                isLoading={actionLoading === worker._id}
                                                leftIcon={worker.isVerified ? <ShieldX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                                onClick={() => handleVerify(worker._id, worker.isVerified)}
                                                className={worker.isVerified ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}>
                                                {worker.isVerified ? 'Revoke Verification' : 'Verify Worker'}
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
