'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Briefcase, Clock, CheckCircle, XCircle, PlusCircle, Eye, X, Star, CreditCard, Unlock, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { jobService } from '@/services/jobService';
import { paymentService } from '@/services/paymentService';
import { reviewService } from '@/services/reviewService';
import { formatCurrency, formatDate, getStatusConfig } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Job, JobStatus, User } from '@/types';


type FilterTab = 'all' | JobStatus;

const TABS: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Under Review', value: 'under-review' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
];

export default function CustomerJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [reviewingJob, setReviewingJob] = useState<Job | null>(null);
    const [rating, setRating] = useState<number>(5);
    const [comment, setComment] = useState('');
    const [reviewImages, setReviewImages] = useState<File[]>([]);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [isResponding, setIsResponding] = useState<string | null>(null);
    const [payingJob, setPayingJob] = useState<Job | null>(null);
    const [releasingJob, setReleasingJob] = useState<string | null>(null);
    const [complainingJob, setComplainingJob] = useState<Job | null>(null);
    const [complaintReason, setComplaintReason] = useState('');
    const [complaintFiles, setComplaintFiles] = useState<File[]>([]);
    const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
    const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
    const [confirmReleaseId, setConfirmReleaseId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await jobService.getCustomerJobs();
                const loaded = data.jobs || [];
                setJobs(loaded);
            } catch {
                setJobs([]);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleCancel = async (jobId: string) => {
        setCancelling(jobId);
        try {
            await jobService.updateJobStatus(jobId, 'cancelled', 'Cancelled by customer');
            setJobs((prev) =>
                prev.map((j) => (j._id === jobId ? { ...j, status: 'cancelled' as JobStatus } : j))
            );
            toast.success('Job cancelled successfully');
        } catch {
            toast.error('Failed to cancel job');
        } finally {
            setCancelling(null);
        }
    };

    const handleReleasePayment = async (jobId: string) => {
        setReleasingJob(jobId);
        try {
            await paymentService.releasePayment(jobId);
            await jobService.updateJobStatus(jobId, 'completed');
            setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: 'completed' as JobStatus } : j));
            toast.success('Payment released! Job marked as complete.');
        } catch {
            toast.error('Failed to release payment.');
        } finally {
            setReleasingJob(null);
        }
    };

    const handleRespond = async (response: 'accepted' | 'rejected') => {
        if (!selectedJob) return;
        setIsResponding(response);
        try {
            await jobService.respondToWorkerQuotation(selectedJob._id, response);
            toast.success(response === 'accepted' ? 'Quotation accepted! Job is now in progress.' : 'Quotation declined.');
            const wq = (selectedJob as any).workerQuotation;
            setJobs(prev => prev.map(j => j._id === selectedJob._id ? {
                ...j,
                status: response === 'accepted' ? 'in-progress' as JobStatus : 'pending' as JobStatus,
                workerQuotation: response === 'accepted' ? { ...wq, status: 'accepted' } : undefined,
            } as any : j));
            setSelectedJob(null);
        } catch {
            toast.error('Failed to respond to quotation.');
        } finally {
            setIsResponding(null);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewingJob) return;
        setIsSubmittingReview(true);
        try {
            const formData = new FormData();
            formData.append('jobId', reviewingJob._id);
            formData.append('workerId', typeof reviewingJob.workerId === 'string' ? reviewingJob.workerId : (reviewingJob.workerId as User)?._id || '');
            formData.append('rating', rating.toString());
            formData.append('comment', comment);
            reviewImages.forEach(file => {
                formData.append('images', file);
            });

            await reviewService.createReview(formData);
            toast.success('Review submitted successfully!');
            setJobs(prev => prev.map(j => j._id === reviewingJob._id ? { ...j, isReviewed: true } : j));
            setReviewingJob(null);
            setRating(5);
            setComment('');
            setReviewImages([]);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to submit review';
            toast.error(message);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleComplaintSubmit = async () => {
        if (!complainingJob || !complaintReason.trim()) {
            toast.error('Please enter a reason for your complaint');
            return;
        }
        setIsSubmittingComplaint(true);
        try {
            const formData = new FormData();
            formData.append('reason', complaintReason);
            complaintFiles.forEach(file => {
                formData.append('attachments', file);
            });

            await jobService.raiseComplaint(complainingJob._id, formData);
            toast.success('Complaint raised successfully. Admin will review it.');
            setJobs(prev => prev.map(j => j._id === complainingJob._id ? { ...j, status: 'disputed' as JobStatus } : j));
            setComplainingJob(null);
            setComplaintReason('');
            setComplaintFiles([]);
        } catch {
            toast.error('Failed to raise complaint');
        } finally {
            setIsSubmittingComplaint(false);
        }
    };

    const filtered = activeTab === 'all' ? jobs : jobs.filter((j) => j.status === activeTab);

    const stats = {
        total: jobs.length,
        pending: jobs.filter((j) => j.status === 'pending').length,
        inProgress: jobs.filter((j) => j.status === 'in-progress').length,
        underReview: jobs.filter((j) => j.status === 'under-review').length,
        completed: jobs.filter((j) => j.status === 'completed').length,
    };

    const statCards = [
        { label: 'Total Jobs', value: stats.total, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { label: 'To Review', value: stats.underReview, icon: Eye, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
        { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    ];

    return (
        <>
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Jobs</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all your job postings</p>
                    </div>
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

                {/* Filter tabs */}
                <div className="flex gap-2 flex-wrap">
                    {TABS.map((tab) => (
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
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} height={80} className="rounded-2xl" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <Card>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" aria-hidden="true" />
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                No jobs found
                            </h3>
                            <p className="text-gray-400 text-sm mb-4">
                                {activeTab === 'all'
                                    ? "You haven't posted any jobs yet."
                                    : `No ${activeTab} jobs at the moment.`}
                            </p>
                            <Link href="/workers">
                                <Button size="sm">Find a Worker</Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((job) => {
                            const statusConfig = getStatusConfig(job.status);
                            const worker = job.workerId as User | undefined;
                            return (
                                <motion.div
                                    key={job._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                        {job.title}
                                                    </h3>
                                                    <Badge className={statusConfig.color} size="sm">
                                                        {statusConfig.label}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                    <span>{job.category}</span>
                                                    <span>·</span>
                                                    <span>{formatCurrency(job.budget)}</span>
                                                    {worker?.name && (
                                                        <>
                                                            <span>·</span>
                                                            <span>Worker: {worker.name}</span>
                                                        </>
                                                    )}
                                                    {job.deadline && (
                                                        <>
                                                            <span>·</span>
                                                            <span>Due: {formatDate(job.deadline)}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Posted {formatDate(job.createdAt)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                                                    onClick={() => setSelectedJob(job)}
                                                >
                                                    View Details
                                                </Button>
                                                {/* Pay Now if quotation accepted but not yet paid */}
                                                {job.status === 'accepted' && (job as any).workerQuotation?.status === 'accepted' && (
                                                    <Button
                                                        size="sm"
                                                        leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                                                        onClick={() => setPayingJob(job)}
                                                    >
                                                        Pay Now
                                                    </Button>
                                                )}
                                                {job.status === 'pending' && (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        leftIcon={<X className="w-3.5 h-3.5" />}
                                                        isLoading={cancelling === job._id}
                                                        onClick={() => setConfirmCancelId(job._id)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                                {/* In-progress or Under Review: Raise Complaint */}
                                                {['in-progress', 'under-review'].includes(job.status) && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        onClick={() => setComplainingJob(job)}
                                                    >
                                                        Raise Complaint
                                                    </Button>
                                                )}
                                                {/* Under Review: Confirm Job Done → releases escrow */}
                                                {job.status === 'under-review' && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        leftIcon={<Unlock className="w-3.5 h-3.5" />}
                                                        isLoading={releasingJob === job._id}
                                                        onClick={() => setConfirmReleaseId(job._id)}
                                                    >
                                                        Confirm Job Done
                                                    </Button>
                                                )}
                                                {job.status === 'completed' && !job.isReviewed && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        leftIcon={<Star className="w-3.5 h-3.5 fill-current" />}
                                                        onClick={() => setReviewingJob(job)}
                                                    >
                                                        Leave Review
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

            {/* Job Detail Modal */}
            {selectedJob && (() => {
                const worker = selectedJob.workerId as User | undefined;
                const wq = (selectedJob as any).workerQuotation;
                const hasQuotation = wq && wq.sentAt;
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedJob(null)}>
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white pr-4">{selectedJob.title}</h2>
                                    <Badge className={getStatusConfig(selectedJob.status).color} size="sm">{getStatusConfig(selectedJob.status).label}</Badge>
                                </div>
                                <button onClick={() => setSelectedJob(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5 text-gray-500" /></button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Job details grid */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                        <p className="text-xs text-gray-400 mb-1">Category</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{selectedJob.category}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                        <p className="text-xs text-gray-400 mb-1">Your Budget</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedJob.budget)}</p>
                                    </div>
                                    {(selectedJob as any).deadline && (
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                            <p className="text-xs text-gray-400 mb-1">Deadline</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{formatDate((selectedJob as any).deadline)}</p>
                                        </div>
                                    )}
                                    {(selectedJob as any).location && (
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                            <p className="text-xs text-gray-400 mb-1">Location</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{(selectedJob as any).location}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
                                </div>

                                {/* Worker assigned */}
                                {worker?.name && (
                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Avatar src={worker?.profileImage} name={worker?.name || ''} size="md" />
                                            <div>
                                                <p className="text-xs text-gray-400">Assigned Worker</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{worker.name}</p>
                                                {worker?.phone && <p className="text-xs text-gray-400">{worker.phone}</p>}
                                            </div>
                                        </div>
                                        {worker?._id && (
                                            <Link href={`/messages?recipientId=${worker._id}&recipientName=${encodeURIComponent(worker.name)}`}>
                                                <Button size="sm" variant="outline" leftIcon={<MessageSquare className="w-4 h-4" />}>
                                                    Message
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                )}

                                {/* Worker Quotation section */}
                                {hasQuotation && (
                                    <div className={`rounded-xl border p-5 ${
                                        wq.status === 'accepted' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                                        : wq.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                                    }`}>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                                            {wq.status === 'pending' ? "🔔 Worker's Quotation — Action Required" : "📋 Worker's Quotation"}
                                        </p>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Quoted Price</span>
                                                <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(wq.price)}</span>
                                            </div>
                                            {wq.availableDate && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Available From</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(wq.availableDate)}</span>
                                                </div>
                                            )}
                                            {wq.notes && (
                                                <div className="pt-2 border-t border-current/10">
                                                    <p className="text-gray-500 mb-1">Worker Notes</p>
                                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{wq.notes}</p>
                                                </div>
                                            )}
                                        </div>

                                        {wq.status === 'pending' && (
                                            <div className="flex gap-3 mt-4">
                                                <Button
                                                    variant="danger"
                                                    fullWidth
                                                    size="sm"
                                                    isLoading={isResponding === 'rejected'}
                                                    disabled={!!isResponding}
                                                    onClick={() => handleRespond('rejected')}
                                                >
                                                    Decline Quotation
                                                </Button>
                                                <Button
                                                    fullWidth
                                                    size="sm"
                                                    onClick={() => setPayingJob(selectedJob)}
                                                >
                                                    Accept & Pay Now
                                                </Button>
                                            </div>
                                        )}
                                        {wq.status === 'accepted' && selectedJob.status === 'awaiting-payment' && (
                                            <p className="text-center text-amber-600 font-medium text-sm mt-3">⏳ Awaiting payment.</p>
                                        )}
                                        {wq.status === 'accepted' && selectedJob.status !== 'awaiting-payment' && (
                                            <p className="text-center text-green-600 font-medium text-sm mt-3">✅ You accepted and paid. Job is in progress!</p>
                                        )}
                                        {wq.status === 'rejected' && (
                                            <p className="text-center text-red-600 font-medium text-sm mt-3">❌ You declined this quotation.</p>
                                        )}
                                    </div>
                                )}

                                {!hasQuotation && selectedJob.status === 'pending' && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
                                        ⏳ Waiting for the worker to review and send you a quotation.
                                    </div>
                                )}

                                <button onClick={() => setSelectedJob(null)} className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Review Modal */}
            {reviewingJob && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setReviewingJob(null)}
                >
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white pr-4">Leave a Review</h2>
                            <button
                                onClick={() => setReviewingJob(null)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none"
                                        >
                                            <Star
                                                className={`w-8 h-8 transition-colors ${
                                                    star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comment</label>
                                <textarea
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    rows={4}
                                    placeholder="How was the worker's service?"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>

                            <div className="mb-4">
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
                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => setReviewingJob(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                fullWidth
                                isLoading={isSubmittingReview}
                                onClick={handleSubmitReview}
                                disabled={!comment.trim() || !rating}
                            >
                                Submit Review
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>

        {/* Payment Modal */}
        {payingJob && (
            <PaymentModal
                job={payingJob}
                onClose={() => setPayingJob(null)}
                onSuccess={(jobId) => {
                    setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: 'in-progress' as JobStatus } : j));
                    setPayingJob(null);
                }}
            />
        )}

        {/* Complaint Modal */}
        {complainingJob && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Raise a Complaint</h3>
                        <button onClick={() => setComplainingJob(null)} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        If the worker hasn't completed the job satisfactorily, you can raise a complaint. The payment will remain in escrow and an admin will review your case.
                    </p>
                    <textarea
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
                        rows={4}
                        placeholder="Please explain the issue..."
                        value={complaintReason}
                        onChange={(e) => setComplaintReason(e.target.value)}
                    />
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Attach Evidence (Images/PDFs, Optional, Max 5)
                        </label>
                        <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={(e) => {
                                if (e.target.files) {
                                    const files = Array.from(e.target.files);
                                    if (files.length > 5) {
                                        toast.error('Maximum 5 files allowed');
                                        return;
                                    }
                                    setComplaintFiles(files);
                                }
                            }}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400"
                        />
                        {complaintFiles.length > 0 && (
                            <p className="text-xs text-gray-500 mt-2">{complaintFiles.length} file(s) selected</p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" fullWidth onClick={() => setComplainingJob(null)}>Cancel</Button>
                        <Button variant="danger" fullWidth isLoading={isSubmittingComplaint} onClick={handleComplaintSubmit} disabled={!complaintReason.trim()}>
                            Submit Complaint
                        </Button>
                    </div>
                </motion.div>
            </div>
        )}

        {/* Confirm Modals */}
        <ConfirmModal
            isOpen={!!confirmCancelId}
            onClose={() => setConfirmCancelId(null)}
            onConfirm={() => confirmCancelId && handleCancel(confirmCancelId)}
            title="Cancel Job"
            message="Are you sure you want to cancel this job?"
            isDanger={true}
            confirmText="Cancel Job"
        />

        <ConfirmModal
            isOpen={!!confirmReleaseId}
            onClose={() => setConfirmReleaseId(null)}
            onConfirm={() => confirmReleaseId && handleReleasePayment(confirmReleaseId)}
            title="Release Payment"
            message="Confirm the job is fully complete and release payment to the worker?"
            isDanger={false}
            confirmText="Confirm & Release"
        />
        </>
    );
}
