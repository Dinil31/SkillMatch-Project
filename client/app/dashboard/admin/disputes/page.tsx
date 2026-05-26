'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, RefreshCw, CheckCircle, RotateCcw, Eye, Phone, FileText, X, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Job, User } from '@/types';
import Link from 'next/link';

export default function AdminDisputesPage() {
    const [disputes, setDisputes] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmRefundId, setConfirmRefundId] = useState<string | null>(null);
    const [confirmReleaseId, setConfirmReleaseId] = useState<string | null>(null);
    const [viewDisputeJob, setViewDisputeJob] = useState<Job | null>(null);

    const loadDisputes = useCallback(async () => {
        setIsLoading(true);
        try {
            const { default: api } = await import('@/services/api');
            const res = await api.get(`/jobs?status=disputed`);
            setDisputes(res.data.jobs);
        } catch {
            setDisputes([]);
            toast.error('Failed to load disputes');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadDisputes(); }, [loadDisputes]);

    const handleResolve = async (jobId: string, action: 'refund' | 'release') => {
        setActionLoading(jobId);
        try {
            const { default: api } = await import('@/services/api');
            await api.post(`/jobs/admin/resolve-dispute/${jobId}`, { action });
            toast.success(`Dispute resolved. Payment ${action === 'refund' ? 'refunded' : 'released'}.`);
            loadDisputes();
        } catch {
            toast.error('Failed to resolve dispute');
        } finally {
            setActionLoading(null);
            setConfirmRefundId(null);
            setConfirmReleaseId(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dispute Resolution</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Review customer complaints and resolve payment disputes</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadDisputes} leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}>
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Job & Parties</th>
                                <th className="px-6 py-4 font-medium">Complaint Details</th>
                                <th className="px-6 py-4 font-medium">Budget</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton height={40} className="rounded-lg" /></td>
                                        <td className="px-6 py-4"><Skeleton height={40} className="rounded-lg" /></td>
                                        <td className="px-6 py-4"><Skeleton height={20} width={80} /></td>
                                        <td className="px-6 py-4"><Skeleton height={30} width={100} className="ml-auto" /></td>
                                    </tr>
                                ))
                            ) : disputes.length > 0 ? (
                                disputes.map((job) => {
                                    const customer = job.customerId as unknown as User;
                                    const worker = job.workerId as unknown as User;
                                    return (
                                        <tr key={job._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 dark:text-white mb-1">{job.title}</div>
                                                <div className="text-xs text-gray-500">
                                                    <div>C: {customer?.name || 'Unknown'}</div>
                                                    <div>W: {worker?.name || 'Unknown'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {job.complaintDetails ? (
                                                    <div>
                                                        <div className="text-red-600 dark:text-red-400 font-medium mb-1 line-clamp-2">
                                                            {job.complaintDetails.reason}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            Reported on {formatDate(job.complaintDetails.date)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">No details</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(job.budget)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setViewDisputeJob(job)}
                                                        leftIcon={<Eye className="w-4 h-4" />}
                                                    >
                                                        View Details
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        isLoading={actionLoading === job._id && confirmRefundId === null}
                                                        onClick={() => setConfirmRefundId(job._id)}
                                                        leftIcon={<RotateCcw className="w-4 h-4" />}
                                                    >
                                                        Refund Customer
                                                    </Button>
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        isLoading={actionLoading === job._id && confirmReleaseId === null}
                                                        onClick={() => setConfirmReleaseId(job._id)}
                                                        leftIcon={<CheckCircle className="w-4 h-4" />}
                                                    >
                                                        Release to Worker
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <ShieldAlert className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                                            <p className="text-gray-500 font-medium">No active disputes found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={!!confirmRefundId}
                onClose={() => setConfirmRefundId(null)}
                onConfirm={() => confirmRefundId && handleResolve(confirmRefundId, 'refund')}
                title="Refund Customer"
                message="Are you sure you want to refund this payment to the customer? This will cancel the job and return the funds."
                isDanger={true}
                confirmText="Confirm Refund"
            />

            <ConfirmModal
                isOpen={!!confirmReleaseId}
                onClose={() => setConfirmReleaseId(null)}
                onConfirm={() => confirmReleaseId && handleResolve(confirmReleaseId, 'release')}
                title="Release to Worker"
                message="Are you sure you want to release the payment to the worker? This will ignore the customer's complaint and mark the job as completed."
                isDanger={false}
                confirmText="Confirm Release"
            />

            {/* View Details Modal */}
            <AnimatePresence>
                {viewDisputeJob && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 dark:border-gray-800"
                        >
                            <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between z-10">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <ShieldAlert className="w-6 h-6 text-red-500" />
                                    Dispute Details
                                </h3>
                                <button onClick={() => setViewDisputeJob(null)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Job Overview */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Job Information</h4>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                                        <p className="font-medium text-lg text-gray-900 dark:text-white mb-2">{viewDisputeJob.title}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>Budget: <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(viewDisputeJob.budget)}</span></span>
                                            <span>Date: {formatDate(viewDisputeJob.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Contact Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Customer */}
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                            <div className="text-xs text-gray-500 mb-1">Customer</div>
                                            <div className="font-medium text-gray-900 dark:text-white mb-2">{(viewDisputeJob.customerId as unknown as User)?.name}</div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <Phone className="w-4 h-4" />
                                                <a href={`tel:${(viewDisputeJob.customerId as unknown as User)?.phone}`} className="hover:text-primary-500 hover:underline">
                                                    {(viewDisputeJob.customerId as unknown as User)?.phone || 'No phone number'}
                                                </a>
                                            </div>
                                        </div>

                                        {/* Worker */}
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                            <div className="text-xs text-gray-500 mb-1">Worker</div>
                                            <div className="font-medium text-gray-900 dark:text-white mb-2">{(viewDisputeJob.workerId as unknown as User)?.name}</div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <Phone className="w-4 h-4" />
                                                <a href={`tel:${(viewDisputeJob.workerId as unknown as User)?.phone}`} className="hover:text-primary-500 hover:underline">
                                                    {(viewDisputeJob.workerId as unknown as User)?.phone || 'No phone number'}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Complaint Details */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Complaint Details</h4>
                                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4 mb-4">
                                        <div className="text-sm text-gray-500 mb-2">
                                            Reported on {formatDate(viewDisputeJob.complaintDetails?.date || '')}
                                        </div>
                                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                            {viewDisputeJob.complaintDetails?.reason}
                                        </p>
                                    </div>

                                    {/* Attachments */}
                                    {viewDisputeJob.complaintDetails?.attachments && viewDisputeJob.complaintDetails.attachments.length > 0 && (
                                        <div>
                                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Evidence Attached</h5>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {viewDisputeJob.complaintDetails.attachments.map((url, index) => {
                                                    const isPdf = url.toLowerCase().endsWith('.pdf');
                                                    return (
                                                        <a 
                                                            key={index} 
                                                            href={url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="group relative flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-800"
                                                        >
                                                            {isPdf ? (
                                                                <FileText className="w-10 h-10 text-red-500 mb-2" />
                                                            ) : (
                                                                <div className="w-full aspect-square relative rounded-lg overflow-hidden mb-2">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img src={url} alt={`Evidence ${index + 1}`} className="object-cover w-full h-full" />
                                                                </div>
                                                            )}
                                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-600 flex items-center gap-1">
                                                                View File <ExternalLink className="w-3 h-3" />
                                                            </span>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 flex justify-end">
                                <Button variant="outline" onClick={() => setViewDisputeJob(null)}>
                                    Close
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
