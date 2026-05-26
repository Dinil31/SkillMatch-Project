'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Briefcase, CheckCircle, XCircle, Clock, Eye, X, Send,
    DollarSign, Calendar, FileText, MapPin, User as UserIcon, MessageSquare
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { jobService } from '@/services/jobService';
import { reviewService } from '@/services/reviewService';
import { formatCurrency, formatDate, getStatusConfig, truncateText, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Job, JobStatus, User } from '@/types';

type FilterTab = 'all' | JobStatus;

const TABS: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Under Review', value: 'under-review' },
    { label: 'Completed', value: 'completed' },
];

export default function WorkerJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modals
    const [viewingJob, setViewingJob] = useState<Job | null>(null);
    const [quotingJob, setQuotingJob] = useState<Job | null>(null);
    const [reviewingJob, setReviewingJob] = useState<Job | null>(null);

    // Quotation form
    const [qPrice, setQPrice] = useState('');
    const [qDate, setQDate] = useState('');
    const [qNotes, setQNotes] = useState('');
    const [isSendingQuotation, setIsSendingQuotation] = useState(false);

    // Review form
    const [rating, setRating] = useState<number>(5);
    const [comment, setComment] = useState('');
    const [reviewImages, setReviewImages] = useState<File[]>([]);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await jobService.getWorkerJobs();
                setJobs(data.jobs || []);
            } catch {
                setJobs([]);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleDecline = async (jobId: string) => {
        setActionLoading(jobId + 'cancelled');
        try {
            await jobService.updateJobStatus(jobId, 'cancelled');
            setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: 'cancelled' as JobStatus } : j));
            toast.success('Job declined.');
        } catch {
            toast.error('Failed to decline job.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkComplete = async (jobId: string) => {
        setActionLoading(jobId + 'under-review');
        try {
            await jobService.updateJobStatus(jobId, 'under-review');
            setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: 'under-review' as JobStatus } : j));
            toast.success('Job submitted to customer for review!');
        } catch {
            toast.error('Failed to update job status.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSendQuotation = async () => {
        if (!quotingJob || !qPrice) return;
        setIsSendingQuotation(true);
        try {
            const updated = await jobService.sendWorkerQuotation(quotingJob._id, {
                price: Number(qPrice),
                availableDate: qDate || undefined,
                notes: qNotes || undefined,
            });
            setJobs(prev => prev.map(j => j._id === quotingJob._id ? updated.job : j));
            toast.success('Quotation sent to customer!');
            setQuotingJob(null);
            setQPrice(''); setQDate(''); setQNotes('');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to send quotation.');
        } finally {
            setIsSendingQuotation(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewingJob) return;
        setIsSubmittingReview(true);
        try {
            const formData = new FormData();
            formData.append('jobId', reviewingJob._id);
            formData.append('workerId', reviewingJob.workerId as unknown as string);
            formData.append('rating', rating.toString());
            formData.append('comment', comment);
            formData.append('direction', 'worker_to_customer');
            reviewImages.forEach(file => {
                formData.append('images', file);
            });

            await reviewService.createReview(formData);
            toast.success('Review submitted!');
            setJobs(prev => prev.map(j => j._id === reviewingJob._id ? { ...j, workerReviewed: true } as any : j));
            setReviewingJob(null); setRating(5); setComment(''); setReviewImages([]);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to submit review.';
            toast.error(message);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const filtered = activeTab === 'all' ? jobs : jobs.filter(j => j.status === activeTab);

    const QuotationBadge = ({ status }: { status: string }) => {
        if (status === 'accepted') return <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">Quotation Accepted</span>;
        if (status === 'rejected') return <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Quotation Declined</span>;
        return <span className="text-xs font-medium text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full">Awaiting Response</span>;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Requests</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage incoming and active job requests</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 flex-wrap">
                    {TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={cn(
                                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                                activeTab === tab.value
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Jobs list */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} height={120} className="rounded-2xl" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <Card>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No job requests</h3>
                            <p className="text-gray-400 text-sm">
                                {activeTab === 'all' ? 'You have no job requests yet.' : `No ${activeTab} jobs at the moment.`}
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(job => {
                            const statusConfig = getStatusConfig(job.status);
                            const customer = job.customerId as User;
                            const wq = (job as any).workerQuotation;
                            const hasQuotation = wq && wq.sentAt;
                            return (
                                <motion.div key={job._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* Customer avatar */}
                                            <div className="flex items-start gap-3 flex-shrink-0">
                                                <Avatar src={customer?.profileImage} name={customer?.name || 'Customer'} size="md" />
                                            </div>

                                            {/* Job details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-xs text-gray-400">{customer?.name || 'Customer'}</p>
                                                </div>
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                                                    <Badge className={statusConfig.color} size="sm">{statusConfig.label}</Badge>
                                                    {hasQuotation && <QuotationBadge status={wq.status} />}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{truncateText(job.description, 100)}</p>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                                    <span className="font-semibold text-gray-700 dark:text-gray-300">Budget: {formatCurrency(job.budget)}</span>
                                                    {(job as any).deadline && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> Due {formatDate((job as any).deadline)}
                                                        </span>
                                                    )}
                                                    {hasQuotation && (
                                                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                                                            Your Quote: {formatCurrency(wq.price)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-wrap items-center gap-2 flex-shrink-0 self-start pt-1">
                                                {/* View Details always visible */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                                                    onClick={() => setViewingJob(job)}
                                                >
                                                    Details
                                                </Button>

                                                {/* Pending: Send Quotation or Decline */}
                                                {job.status === 'pending' && !hasQuotation && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            leftIcon={<Send className="w-3.5 h-3.5" />}
                                                            onClick={() => setQuotingJob(job)}
                                                        >
                                                            Send Quotation
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            leftIcon={<XCircle className="w-3.5 h-3.5" />}
                                                            isLoading={actionLoading === job._id + 'cancelled'}
                                                            onClick={() => handleDecline(job._id)}
                                                        >
                                                            Decline
                                                        </Button>
                                                    </>
                                                )}

                                                {/* Accepted with pending quotation: waiting */}
                                                {job.status === 'accepted' && hasQuotation && wq.status === 'pending' && (
                                                    <span className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-full font-medium">
                                                        Waiting for customer…
                                                    </span>
                                                )}

                                                {/* In-progress: Mark Complete */}
                                                {job.status === 'in-progress' && (
                                                    <Button
                                                        size="sm"
                                                        leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                                                        isLoading={actionLoading === job._id + 'under-review'}
                                                        onClick={() => handleMarkComplete(job._id)}
                                                    >
                                                        Finish Job
                                                    </Button>
                                                )}

                                                {/* Under Review */}
                                                {job.status === 'under-review' && (
                                                    <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full font-medium">
                                                        Awaiting customer confirmation…
                                                    </span>
                                                )}

                                                {/* Completed: Review Customer */}
                                                {job.status === 'completed' && !(job as any).workerReviewed && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => setReviewingJob(job)}
                                                    >
                                                        Review Customer
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── View Details Modal ── */}
            {viewingJob && (() => {
                const customer = viewingJob.customerId as User;
                const wq = (viewingJob as any).workerQuotation;
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewingJob(null)}>
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{viewingJob.title}</h2>
                                    <Badge className={getStatusConfig(viewingJob.status).color} size="sm">{getStatusConfig(viewingJob.status).label}</Badge>
                                </div>
                                <button onClick={() => setViewingJob(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5 text-gray-500" /></button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Customer info */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Avatar src={customer?.profileImage} name={customer?.name || 'Customer'} size="md" />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{customer?.name || 'Customer'}</p>
                                            <p className="text-xs text-gray-400">{customer?.email}</p>
                                            {customer?.phone && <p className="text-xs text-gray-400">{customer.phone}</p>}
                                        </div>
                                    </div>
                                    {customer?._id && (
                                        <Link href={`/messages?recipientId=${customer._id}&recipientName=${encodeURIComponent(customer.name || 'Customer')}`}>
                                            <Button size="sm" variant="outline" leftIcon={<MessageSquare className="w-4 h-4" />}>
                                                Message
                                            </Button>
                                        </Link>
                                    )}
                                </div>

                                {/* Job details grid */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                        <p className="text-xs text-gray-400 mb-1">Category</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{viewingJob.category}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                        <p className="text-xs text-gray-400 mb-1">Budget</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(viewingJob.budget)}</p>
                                    </div>
                                    {(viewingJob as any).deadline && (
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                            <p className="text-xs text-gray-400 mb-1">Deadline</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{formatDate((viewingJob as any).deadline)}</p>
                                        </div>
                                    )}
                                    {(viewingJob as any).location && (
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                            <p className="text-xs text-gray-400 mb-1">Location</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{(viewingJob as any).location}</p>
                                        </div>
                                    )}
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 col-span-2">
                                        <p className="text-xs text-gray-400 mb-1">Posted</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(viewingJob.createdAt)}</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{viewingJob.description}</p>
                                </div>

                                {/* Quotation status section */}
                                {wq && wq.sentAt && (
                                    <div className={`rounded-xl p-4 border ${
                                        wq.status === 'accepted' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                        : wq.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                    }`}>
                                        <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-gray-500">Your Quotation</p>
                                        <div className="space-y-1.5 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Your Price</span>
                                                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(wq.price)}</span>
                                            </div>
                                            {wq.availableDate && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Available From</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(wq.availableDate)}</span>
                                                </div>
                                            )}
                                            {wq.notes && (
                                                <div className="pt-2">
                                                    <p className="text-gray-500 mb-1">Notes</p>
                                                    <p className="text-gray-700 dark:text-gray-300">{wq.notes}</p>
                                                </div>
                                            )}
                                            <div className="flex justify-between pt-2 border-t border-current/10">
                                                <span className="text-gray-500">Status</span>
                                                <QuotationBadge status={wq.status} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Send quotation button if pending and no quotation yet */}
                                {viewingJob.status === 'pending' && (!wq || !wq.sentAt) && (
                                    <Button fullWidth leftIcon={<Send className="w-4 h-4" />} onClick={() => { setViewingJob(null); setQuotingJob(viewingJob); }}>
                                        Send Quotation
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Send Quotation Modal ── */}
            {quotingJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setQuotingJob(null)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Send Quotation</h2>
                                <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{quotingJob.title}</p>
                            </div>
                            <button onClick={() => setQuotingJob(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Customer budget reference */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                                Customer's budget: <strong>{formatCurrency(quotingJob.budget)}</strong>
                                {(quotingJob as any).deadline && <span className="ml-3">· Deadline: <strong>{formatDate((quotingJob as any).deadline)}</strong></span>}
                            </div>

                            {/* Price */}
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    <DollarSign className="w-4 h-4 text-gray-400" /> Your Price (LKR) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="100"
                                    value={qPrice}
                                    onChange={e => setQPrice(e.target.value)}
                                    placeholder="e.g. 18000"
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Available Date */}
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    <Calendar className="w-4 h-4 text-gray-400" /> Available From <span className="text-xs font-normal text-gray-400">(optional)</span>
                                </label>
                                <input
                                    type="date"
                                    value={qDate}
                                    onChange={e => setQDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    <FileText className="w-4 h-4 text-gray-400" /> Additional Notes <span className="text-xs font-normal text-gray-400">(optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={qNotes}
                                    onChange={e => setQNotes(e.target.value)}
                                    placeholder="What's included, any special conditions, timeline details…"
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-1">
                                <Button variant="outline" fullWidth onClick={() => setQuotingJob(null)}>Cancel</Button>
                                <Button fullWidth isLoading={isSendingQuotation} disabled={!qPrice} onClick={handleSendQuotation} leftIcon={<Send className="w-4 h-4" />}>
                                    Send Quotation
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Review Customer Modal ── */}
            {reviewingJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setReviewingJob(null)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Review Customer</h2>
                            <button onClick={() => setReviewingJob(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                                            <svg className={`w-8 h-8 transition-colors ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comment</label>
                                <textarea 
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" 
                                    rows={4} 
                                    placeholder="How was your experience with this customer?" 
                                    value={comment} 
                                    onChange={e => setComment(e.target.value)}
                                    maxLength={1000}
                                    minLength={10} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Attach Images (Optional, Max 5)
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            const files = Array.from(e.target.files);
                                            if (files.length > 5) {
                                                toast.error('Maximum 5 files allowed');
                                                return;
                                            }
                                            setReviewImages(files);
                                        }
                                    }}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400"
                                />
                                {reviewImages.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-2">{reviewImages.length} file(s) selected</p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" fullWidth onClick={() => setReviewingJob(null)}>Cancel</Button>
                            <Button variant="primary" fullWidth isLoading={isSubmittingReview} onClick={handleSubmitReview} disabled={!comment.trim()}>Submit Review</Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

function QuotationBadge({ status }: { status: string }) {
    if (status === 'accepted') return <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">Quotation Accepted</span>;
    if (status === 'rejected') return <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Quotation Declined</span>;
    return <span className="text-xs font-medium text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full">Awaiting Response</span>;
}
