'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Banknote, CheckCircle2, Clock, RefreshCw, Building2,
    CreditCard, Mail, Phone, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { paymentService } from '@/services/paymentService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { WithdrawalRequest } from '@/types';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | 'pending' | 'completed' | 'rejected';

const statusConfig = {
    pending:    { label: 'Pending',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   border: 'border-l-amber-400',  icon: Clock },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',       border: 'border-l-blue-400',   icon: RefreshCw },
    completed:  { label: 'Completed',  color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   border: 'border-l-green-400',  icon: CheckCircle2 },
    rejected:   { label: 'Rejected',   color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           border: 'border-l-red-400',    icon: AlertCircle },
} as const;

export default function AdminWithdrawalsPage() {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<StatusFilter>('all');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
    const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await paymentService.getAllWithdrawals();
            setRequests(data.requests || []);
        } catch {
            toast.error('Failed to load withdrawal requests');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

    const totalPending   = requests.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
    const totalCompleted = requests.filter(r => r.status === 'completed').reduce((s, r) => s + r.amount, 0);
    const pendingCount   = requests.filter(r => r.status === 'pending').length;

    const handleProcess = async (id: string) => {
        setProcessingId(id);
        try {
            await paymentService.processWithdrawal(id, adminNotes[id] || '');
            toast.success('Withdrawal processed! Payment slip sent to worker\'s email.');
            setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'completed' as const, processedAt: new Date().toISOString() } : r));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to process withdrawal');
        } finally {
            setProcessingId(null);
        }
    };

    const tabs: { key: StatusFilter; label: string; count?: number }[] = [
        { key: 'all', label: 'All', count: requests.length },
        { key: 'pending', label: 'Pending', count: pendingCount },
        { key: 'completed', label: 'Completed' },
        { key: 'rejected', label: 'Rejected' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Withdrawal Requests</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Review and process worker payout requests</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={load} leftIcon={<RefreshCw className="w-4 h-4" />}>
                        Refresh
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Pending Amount', value: formatCurrency(totalPending), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                        { label: 'Total Paid Out', value: formatCurrency(totalCompleted), icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
                        { label: 'Pending Requests', value: String(pendingCount), icon: Banknote, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    ].map((stat, i) => (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                            <Card>
                                <div className="flex items-center gap-4">
                                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', stat.bg)}>
                                        <stat.icon className={cn('w-5 h-5', stat.color)} />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                        <p className="text-sm text-gray-500">{stat.label}</p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={cn(
                                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                                filter === tab.key
                                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            )}
                        >
                            {tab.label}
                            {tab.count !== undefined && <span className="ml-1.5 text-xs text-gray-400">({tab.count})</span>}
                        </button>
                    ))}
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <Skeleton key={i} height={140} className="rounded-2xl" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <Card>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Banknote className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No withdrawal requests</h3>
                            <p className="text-sm text-gray-400">Workers haven&apos;t submitted any withdrawal requests yet.</p>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((req, i) => {
                            const cfg = statusConfig[req.status] || statusConfig.pending;
                            const StatusIcon = cfg.icon;
                            const worker = req.workerId as any;
                            const isPending = req.status === 'pending';
                            const noteExpanded = expandedNotes[req._id];

                            return (
                                <motion.div key={req._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                                    <div className={cn('bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 border-l-4 overflow-hidden', cfg.border)}>
                                        <div className="p-5">
                                            <div className="flex flex-wrap items-start gap-4 justify-between">
                                                {/* Left */}
                                                <div className="space-y-2 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.color)}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {cfg.label}
                                                        </span>
                                                        <span className="text-xs text-gray-400">{formatDate(req.createdAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                            {worker?.name?.[0] || 'W'}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{worker?.name || 'Worker'}</p>
                                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{worker?.email}</span>
                                                                {worker?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{worker.phone}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <span className="flex items-center gap-1.5">
                                                            <Building2 className="w-3.5 h-3.5" />
                                                            {req.bankName} — {req.branchName}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <CreditCard className="w-3.5 h-3.5" />
                                                            {req.accountHolderName} · ****{req.accountNumber.slice(-4)}
                                                        </span>
                                                    </div>
                                                    {req.status === 'completed' && (
                                                        <div className="text-xs text-green-600 dark:text-green-400 space-y-0.5">
                                                            {req.transactionRef && <p>Ref: <span className="font-mono font-semibold">{req.transactionRef}</span></p>}
                                                            {req.processedAt && <p>Processed: {formatDate(req.processedAt)}</p>}
                                                            {req.slipEmailSentAt && (
                                                                <p className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Payment slip emailed</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {req.adminNote && (
                                                        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                                                            Note: {req.adminNote}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Right */}
                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                                                        {formatCurrency(req.amount)}
                                                    </p>
                                                    {isPending && (
                                                        <div className="flex flex-col items-end gap-2">
                                                            <button
                                                                onClick={() => setExpandedNotes(prev => ({ ...prev, [req._id]: !prev[req._id] }))}
                                                                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                                                            >
                                                                Add note {noteExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                            </button>
                                                            {noteExpanded && (
                                                                <textarea
                                                                    rows={2}
                                                                    placeholder="Optional note to worker..."
                                                                    value={adminNotes[req._id] || ''}
                                                                    onChange={e => setAdminNotes(prev => ({ ...prev, [req._id]: e.target.value }))}
                                                                    className="w-52 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                                                                />
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="success"
                                                                onClick={() => handleProcess(req._id)}
                                                                isLoading={processingId === req._id}
                                                                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                                            >
                                                                Process & Send Slip
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
