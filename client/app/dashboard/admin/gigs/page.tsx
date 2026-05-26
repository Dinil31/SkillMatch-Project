'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, X, RefreshCw, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Gig, User } from '@/types';
import Link from 'next/link';

export default function AdminGigsPage() {
    const [gigs, setGigs] = useState<Gig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectingGig, setRejectingGig] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const LIMIT = 10;

    const loadGigs = useCallback(async () => {
        setIsLoading(true);
        try {
            const { default: api } = await import('@/services/api');
            const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
            if (statusFilter) params.set('status', statusFilter);
            const res = await api.get(`/gigs/admin/all?${params}`);
            setGigs(res.data.gigs);
            setTotal(res.data.total);
        } catch {
            setGigs([]);
            setTotal(0);
            toast.error('Failed to load gigs');
        } finally {
            setIsLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { loadGigs(); }, [loadGigs]);

    const handleUpdateStatus = async (gigId: string, approvalStatus: 'approved' | 'rejected', reason?: string) => {
        setActionLoading(gigId);
        try {
            const { default: api } = await import('@/services/api');
            await api.put(`/gigs/${gigId}/status`, { approvalStatus, rejectionReason: reason });
            toast.success(`Gig ${approvalStatus}`);
            if (approvalStatus === 'rejected') {
                setRejectingGig(null);
                setRejectionReason('');
            }
            loadGigs();
        } catch {
            toast.error(`Failed to update gig status`);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'danger';
            default: return 'warning';
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gigs Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Review and manage worker gigs</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadGigs} leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}>
                        Refresh
                    </Button>
                </div>
            </div>

            <Card className="mb-6 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <select
                        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </Card>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Gig / Worker</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-3 w-16" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                        <td className="px-6 py-4"><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-8 w-8 rounded-lg" /></div></td>
                                    </tr>
                                ))
                            ) : gigs.length > 0 ? (
                                gigs.map((gig) => {
                                    const worker = gig.workerId as User;
                                    return (
                                        <tr key={gig._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <Avatar src={worker?.profileImage} name={worker?.name || 'Worker'} />
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white line-clamp-1">{gig.title}</div>
                                                        <div className="text-gray-500 text-xs">by {worker?.name || 'Unknown'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-900 dark:text-white font-medium">{formatCurrency(gig.price)}</div>
                                                <div className="text-gray-500 text-xs">{gig.category}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={getStatusColor((gig as any).approvalStatus)} size="sm">
                                                    {(gig as any).approvalStatus || 'pending'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/gigs/${gig._id}`}>
                                                        <Button variant="ghost" size="sm" title="View Gig" leftIcon={<Eye className="w-4 h-4" />} />
                                                    </Link>
                                                    {(gig as any).approvalStatus === 'pending' && (
                                                        <>
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                title="Approve"
                                                                isLoading={actionLoading === gig._id}
                                                                onClick={() => handleUpdateStatus(gig._id, 'approved')}
                                                                leftIcon={<Check className="w-4 h-4" />}
                                                            />
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                title="Reject"
                                                                isLoading={actionLoading === gig._id}
                                                                onClick={() => setRejectingGig(gig._id)}
                                                                leftIcon={<X className="w-4 h-4" />}
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No gigs found matching the criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Pagination Placeholder */}
            {total > LIMIT && (
                <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
                    <div>Showing {((page - 1) * LIMIT) + 1} to {Math.min(page * LIMIT, total)} of {total} gigs</div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                        <Button variant="outline" size="sm" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
                    </div>
                </div>
            )}

            {rejectingGig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl"
                    >
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Reject Gig</h3>
                        <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejecting this gig. The worker will see this reason.</p>
                        <textarea
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
                            rows={4}
                            placeholder="Reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <Button variant="outline" fullWidth onClick={() => { setRejectingGig(null); setRejectionReason(''); }}>Cancel</Button>
                            <Button
                                variant="danger"
                                fullWidth
                                isLoading={actionLoading === rejectingGig}
                                onClick={() => handleUpdateStatus(rejectingGig, 'rejected', rejectionReason)}
                                disabled={!rejectionReason.trim()}
                            >
                                Confirm Reject
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </DashboardLayout>
    );
}
