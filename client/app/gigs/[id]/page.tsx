'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Star, CheckCircle, MessageSquare, ArrowLeft, FileText, Check, X } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { RequestQuotationModal } from '@/components/workers/RequestQuotationModal';
import { gigService } from '@/services/gigService';
import { formatCurrency, formatRating, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import type { Gig, User } from '@/types';

export default function GigDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
    const [gig, setGig] = useState<Gig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [showQuotationModal, setShowQuotationModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            toast.error('Please register to view full gig details');
            router.replace('/register');
        }
    }, [authLoading, isAuthenticated, router]);

    const handleUpdateStatus = async (approvalStatus: 'approved' | 'rejected') => {
        setActionLoading(approvalStatus);
        try {
            const { default: api } = await import('@/services/api');
            await api.put(`/gigs/${id}/status`, { approvalStatus });
            toast.success(`Gig ${approvalStatus}`);
            setGig(prev => prev ? { ...prev, approvalStatus } as Gig : null);
        } catch {
            toast.error(`Failed to update gig status`);
        } finally {
            setActionLoading(null);
        }
    };

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await gigService.getGigById(id);
                setGig(data.gig);
            } catch (error) {
                console.error('Failed to load gig:', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (id && isAuthenticated) load();
    }, [id, isAuthenticated, authLoading]);

    if (authLoading || (!isAuthenticated && !authLoading)) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                </main>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <Navbar />
                <div className="max-w-5xl mx-auto px-4 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <Skeleton height={400} className="rounded-2xl" />
                        <Skeleton height={200} className="rounded-2xl" />
                    </div>
                    <Skeleton height={300} className="rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!gig) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className="text-gray-500">Gig not found.</p>
                </div>
                <Footer />
            </div>
        );
    }

    const worker = gig.workerId as User;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
                {/* Back link */}
                <Link
                    href="/gigs"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    Back to Gigs
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Images */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                            <div className="relative h-80 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/20 dark:to-secondary-900/20">
                                {gig.images && gig.images.length > 0 ? (
                                    <Image
                                        src={gig.images[activeImage]}
                                        alt={`${gig.title} - image ${activeImage + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 66vw"
                                        priority
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-6xl opacity-20" aria-hidden="true">🎨</span>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail strip */}
                            {gig.images && gig.images.length > 1 && (
                                <div className="flex gap-2 p-4 overflow-x-auto">
                                    {gig.images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveImage(i)}
                                            className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${activeImage === i ? 'border-primary-500' : 'border-transparent'
                                                }`}
                                            aria-label={`View image ${i + 1}`}
                                            aria-pressed={activeImage === i}
                                        >
                                            <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Gig details */}
                        <Card>
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <Badge variant="primary" size="sm" className="mb-2">{gig.category}</Badge>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{gig.title}</h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                                {gig.deliveryTime && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" aria-hidden="true" />
                                        Delivery: {gig.deliveryTime} {gig.deliveryUnit}
                                    </span>
                                )}
                                <span>Posted {formatDate(gig.createdAt)}</span>
                            </div>

                            <div className="prose dark:prose-invert max-w-none">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                                    {gig.description}
                                </p>
                            </div>

                            {gig.tags && gig.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {gig.tags.map((tag) => (
                                        <Badge key={tag} variant="default" size="sm">#{tag}</Badge>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Pricing card */}
                        <Card className="sticky top-24">
                            <div className="text-center mb-4">
                                <p className="text-sm text-gray-400">
                                    {gig.pricingModel === 'custom' ? 'Starts at' : gig.pricingModel === 'hourly' || gig.pricingModel === 'daily' ? 'Rate' : 'Fixed Price'}
                                </p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(gig.price)}
                                    {gig.pricingModel === 'hourly' && <span className="text-lg font-normal">/hr</span>}
                                    {gig.pricingModel === 'daily' && <span className="text-lg font-normal">/day</span>}
                                </p>
                                {gig.pricingModel === 'custom' && gig.pricingDescription && (
                                    <p className="text-sm text-primary-600 dark:text-primary-400 mt-2 font-medium">
                                        {gig.pricingDescription}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2 mb-6">
                                {gig.deliveryTime && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                                        {gig.deliveryTime} {gig.deliveryUnit} delivery
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                                    {gig.totalOrders} orders completed
                                </div>
                            </div>

                            {user?.role === 'admin' ? (
                                <div className="space-y-3">
                                    {(!('approvalStatus' in gig) || (gig as any).approvalStatus === 'pending') ? (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="success"
                                                fullWidth
                                                isLoading={actionLoading === 'approved'}
                                                onClick={() => handleUpdateStatus('approved')}
                                                leftIcon={<Check className="w-4 h-4" />}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="danger"
                                                fullWidth
                                                isLoading={actionLoading === 'rejected'}
                                                onClick={() => handleUpdateStatus('rejected')}
                                                leftIcon={<X className="w-4 h-4" />}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Badge variant={(gig as any).approvalStatus === 'approved' ? 'success' : 'danger'} className="w-full justify-center text-lg py-1">
                                                Status: {(gig as any).approvalStatus}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Button fullWidth size="lg" leftIcon={<FileText className="w-4 h-4" />} onClick={() => {
                                    setShowQuotationModal(true);
                                }}>
                                    Request Quotation
                                </Button>
                            )}
                        </Card>

                        {/* Worker card */}
                        <Card>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">About the Worker</h3>
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar src={worker?.profileImage} name={worker?.name || ''} size="md" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{worker?.name}</p>
                                    {worker?.isVerified && (
                                        <span className="flex items-center gap-1 text-xs text-blue-500">
                                            <CheckCircle className="w-3 h-3" aria-hidden="true" />
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Link href={`/workers/${worker?._id}`}>
                                <Button variant="outline" size="sm" fullWidth>
                                    View Profile
                                </Button>
                            </Link>
                        </Card>
                    </div>
                </div>
            </main>

            <Footer />

            {showQuotationModal && gig && (
                <RequestQuotationModal
                    workerId={(gig.workerId as User)?._id || ''}
                    workerName={(gig.workerId as User)?.name || 'Worker'}
                    suggestedCategory={gig.category}
                    suggestedTitle={gig.title}
                    onClose={() => setShowQuotationModal(false)}
                />
            )}
        </div>
    );
}
