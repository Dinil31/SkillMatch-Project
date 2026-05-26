'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Clock, CheckCircle, BarChart3, AlertCircle, XCircle, RotateCcw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { paymentService } from '@/services/paymentService';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminRevenuePage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefunding, setIsRefunding] = useState<string | null>(null);
    const [confirmRefundId, setConfirmRefundId] = useState<string | null>(null);

    const loadData = () => {
        paymentService.getRevenue()
            .then(d => setData(d))
            .catch(() => setData({ summary: { totalRevenue: 0, releasedRevenue: 0, pendingRevenue: 0, totalTransactions: 0 }, payments: [] }))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRefund = async (jobId: string) => {
        setIsRefunding(jobId);
        try {
            await paymentService.refundPayment(jobId);
            toast.success('Customer refunded successfully and job cancelled.');
            loadData();
        } catch {
            toast.error('Failed to issue refund.');
        } finally {
            setIsRefunding(null);
        }
    };

    const summary = data?.summary || {};
    const payments = data?.payments || [];
    
    // Find payments associated with disputed jobs
    const disputedPayments = payments.filter((p: any) => p.jobId?.status === 'disputed' && p.status === 'held');

    const statCards = [
        {
            label: 'Total Revenue',
            value: summary.totalRevenue || 0,
            icon: DollarSign,
            gradient: 'from-emerald-400 to-green-600',
            bg: 'bg-green-50 dark:bg-green-900/20',
            text: 'text-green-600',
            sub: 'All platform commissions',
        },
        {
            label: 'Released',
            value: summary.releasedRevenue || 0,
            icon: CheckCircle,
            gradient: 'from-blue-400 to-indigo-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            text: 'text-blue-600',
            sub: 'From completed jobs',
        },
        {
            label: 'In Escrow',
            value: summary.pendingRevenue || 0,
            icon: Clock,
            gradient: 'from-yellow-400 to-amber-600',
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            text: 'text-yellow-600',
            sub: 'Held until job completion',
        },
        {
            label: 'Transactions',
            value: summary.totalTransactions || 0,
            icon: BarChart3,
            gradient: 'from-purple-400 to-violet-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            text: 'text-purple-600',
            sub: 'Total paid jobs',
            isCurrency: false,
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Revenue & Payments</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Platform earnings and transaction overview</p>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-300">10% Commission Rate</span>
                    </div>
                </div>

                {/* Stats */}
                {isLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} height={130} className="rounded-2xl" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {statCards.map((stat, i) => (
                            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                <Card className="overflow-hidden">
                                    <div className={`h-1 bg-gradient-to-r ${stat.gradient} -mx-6 -mt-6 mb-4 rounded-t-2xl`} />
                                    <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                                        <stat.icon className={`w-5 h-5 ${stat.text}`} />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stat.isCurrency === false ? stat.value : formatCurrency(stat.value)}
                                    </p>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">{stat.label}</p>
                                    <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Disputed Jobs Section */}
                {!isLoading && disputedPayments.length > 0 && (
                    <Card className="border-red-200 dark:border-red-900/50">
                        <div className="flex items-center gap-2 mb-5">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Action Required: Disputed Jobs</h2>
                        </div>
                        <div className="space-y-4">
                            {disputedPayments.map((p: any) => (
                                <div key={p._id} className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">Job: {p.jobId?.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            <strong>Customer:</strong> {p.customerId?.name} | <strong>Worker:</strong> {p.workerId?.name}
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                            <strong>Complaint Reason:</strong> {p.jobId?.complaintDetails?.reason || 'No reason provided'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(p.amount)}</p>
                                            <p className="text-xs text-gray-500">Held in escrow</p>
                                        </div>
                                        <Button 
                                            variant="danger" 
                                            size="sm" 
                                            leftIcon={<RotateCcw className="w-4 h-4" />}
                                            isLoading={isRefunding === p.jobId?._id}
                                            onClick={() => setConfirmRefundId(p.jobId?._id)}
                                        >
                                            Refund Customer
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Transactions Table */}
                <Card>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">All Transactions</h2>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} height={52} className="rounded-lg" />)}
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <DollarSign className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No transactions yet</h3>
                            <p className="text-gray-400 text-sm">Payments will appear here once customers pay for jobs.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800">
                                        <th className="text-left py-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Job</th>
                                        <th className="text-left py-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                                        <th className="text-left py-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Worker</th>
                                        <th className="text-right py-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount Paid</th>
                                        <th className="text-right py-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Platform Fee</th>
                                        <th className="text-right py-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Worker Gets</th>
                                        <th className="text-center py-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="text-right py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {payments.map((p: any, i: number) => (
                                        <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-3 pr-4">
                                                <p className="font-medium text-gray-900 dark:text-white truncate max-w-[160px]">{p.jobId?.title || '—'}</p>
                                            </td>
                                            <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{p.customerId?.name || '—'}</td>
                                            <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{p.workerId?.name || '—'}</td>
                                            <td className="py-3 pr-4 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(p.amount)}</td>
                                            <td className="py-3 pr-4 text-right font-semibold text-green-600">{formatCurrency(p.commission)}</td>
                                            <td className="py-3 pr-4 text-right text-gray-500">{formatCurrency(p.workerPayout)}</td>
                                            <td className="py-3 pr-4 text-center">
                                                {p.status === 'released' ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                                                        <CheckCircle className="w-3 h-3" /> Released
                                                    </span>
                                                ) : p.status === 'refunded' ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-full">
                                                        <XCircle className="w-3 h-3" /> Refunded
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-1 rounded-full">
                                                        <Clock className="w-3 h-3" /> In Escrow
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 text-right text-gray-400 text-xs">{p.paidAt ? formatDate(p.paidAt) : '—'}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
            
            <ConfirmModal
                isOpen={!!confirmRefundId}
                onClose={() => setConfirmRefundId(null)}
                onConfirm={() => confirmRefundId && handleRefund(confirmRefundId)}
                title="Refund Customer"
                message="Are you sure you want to refund this customer? This will cancel the job and return funds."
                isDanger={true}
                confirmText="Refund Customer"
            />
        </DashboardLayout>
    );
}
