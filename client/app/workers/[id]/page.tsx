'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    Star,
    MapPin,
    Clock,
    CheckCircle,
    Briefcase,
    Award,
    MessageSquare,
    FileText,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { RequestQuotationModal } from '@/components/workers/RequestQuotationModal';
import { workerService } from '@/services/workerService';
import { reviewService } from '@/services/reviewService';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { formatCurrency, formatRating, getStatusConfig } from '@/lib/utils';
import type { WorkerProfile, User, Review } from '@/types';

export default function WorkerProfilePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();
    const [worker, setWorker] = useState<WorkerProfile | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about');
    const [showQuotationModal, setShowQuotationModal] = useState(false);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const [workerData, reviewData] = await Promise.all([
                    workerService.getWorkerById(id),
                    reviewService.getWorkerReviews(id),
                ]);
                setWorker(workerData.worker);
                setReviews(reviewData.reviews || []);
            } catch (error) {
                console.error('Failed to load worker profile:', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (id && isAuthenticated) load();
    }, [id, isAuthenticated, authLoading]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            toast.error('Please register to view full worker profile');
            router.replace('/register');
        }
    }, [authLoading, isAuthenticated, router]);

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
                <div className="max-w-5xl mx-auto px-4 pt-24 pb-16 space-y-6">
                    <Skeleton height={200} className="rounded-2xl" />
                    <div className="grid grid-cols-3 gap-4">
                        <Skeleton height={100} className="rounded-xl" />
                        <Skeleton height={100} className="rounded-xl" />
                        <Skeleton height={100} className="rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!worker) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className="text-gray-500">Worker not found.</p>
                </div>
                <Footer />
            </div>
        );
    }

    const user = worker.userId as User;
    const statusConfig = getStatusConfig(worker.availability);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
                {/* Profile header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 mb-6"
                >
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="relative flex-shrink-0">
                            <Avatar src={user?.profileImage} name={user?.name || ''} size="xl" />
                            {worker.isVerified && (
                                <span className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1" title="Verified worker">
                                    <CheckCircle className="w-4 h-4 text-white" aria-hidden="true" />
                                </span>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {user?.name}
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400">{worker.category}</p>

                                    <div className="flex flex-wrap items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {formatRating(worker.averageRating)}
                                            </span>
                                            <span className="text-sm text-gray-400">({worker.totalReviews} reviews)</span>
                                        </div>

                                        <span className="flex items-center gap-1 text-sm text-gray-500">
                                            <MapPin className="w-4 h-4" aria-hidden="true" />
                                            {worker.locationType === 'island-wide' && 'Island Wide'}
                                            {worker.locationType === 'districts' && worker.allowedDistricts && worker.allowedDistricts.length > 0 && worker.allowedDistricts.join(', ')}
                                            {worker.locationType === 'districts' && (!worker.allowedDistricts || worker.allowedDistricts.length === 0) && 'Specific Districts'}
                                            {worker.locationType === 'radius' && `Within ${worker.locationRadiusKm || 10}km radius`}
                                        </span>

                                        <span className="flex items-center gap-1 text-sm text-gray-500">
                                            <Briefcase className="w-4 h-4" aria-hidden="true" />
                                            {worker.completedJobs} jobs completed
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                    <Badge
                                        variant={worker.availability === 'available' ? 'success' : 'warning'}
                                        dot
                                    >
                                        {statusConfig.label}
                                    </Badge>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {worker.hourlyRate > 0 ? `${formatCurrency(worker.hourlyRate)}/hr` : 'Negotiable'}
                                    </p>
                                </div>
                            </div>

                            {/* Skills */}
                            {worker.skills && worker.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {worker.skills.map((skill) => (
                                        <Badge key={skill} variant="primary" size="sm">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    leftIcon={<MessageSquare className="w-4 h-4" />}
                                    onClick={() => {
                                        const targetUser = worker?.userId as User;
                                        if (!targetUser) return;
                                        router.push(`/messages?recipientId=${targetUser._id}&recipientName=${encodeURIComponent(targetUser.name)}&recipientImage=${encodeURIComponent(targetUser.profileImage || '')}`);
                                    }}
                                >
                                    Message
                                </Button>
                                <Button
                                    leftIcon={<FileText className="w-4 h-4" />}
                                    disabled={worker?.availability !== 'available'}
                                    onClick={() => setShowQuotationModal(true)}
                                    className="flex-1"
                                >
                                    {worker?.availability === 'available' ? 'Request Quotation' : 'Currently Unavailable'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Experience', value: `${worker.experience} yrs`, icon: Clock },
                        { label: 'Jobs Done', value: worker.completedJobs, icon: Briefcase },
                        { label: 'Certifications', value: worker.certifications?.length || 0, icon: Award },
                    ].map(({ label, value, icon: Icon }) => (
                        <Card key={label} className="text-center" padding="sm">
                            <Icon className="w-5 h-5 text-primary-500 mx-auto mb-1" aria-hidden="true" />
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                            <p className="text-xs text-gray-400">{label}</p>
                        </Card>
                    ))}
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="flex border-b border-gray-200 dark:border-gray-700" role="tablist">
                        {(['about', 'portfolio', 'reviews'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                role="tab"
                                aria-selected={activeTab === tab}
                                className={`flex-1 py-4 text-sm font-medium capitalize transition-colors ${activeTab === tab
                                        ? 'text-primary-600 border-b-2 border-primary-600'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {tab}
                                {tab === 'reviews' && ` (${reviews.length})`}
                            </button>
                        ))}
                    </div>

                    <div className="p-6" role="tabpanel">
                        {activeTab === 'about' && (
                            <div className="space-y-6">
                                {worker.bio && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About</h3>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{worker.bio}</p>
                                    </div>
                                )}
                                {worker.certifications && worker.certifications.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Certifications</h3>
                                        <ul className="space-y-1">
                                            {worker.certifications.map((cert, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                                                    {cert}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'portfolio' && (
                            <div>
                                {worker.portfolio && worker.portfolio.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {worker.portfolio.map((img, i) => (
                                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                <Image
                                                    src={img}
                                                    alt={`Portfolio item ${i + 1}`}
                                                    fill
                                                    className="object-cover hover:scale-105 transition-transform duration-300"
                                                    sizes="(max-width: 768px) 50vw, 33vw"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No portfolio items yet.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="space-y-4">
                                {reviews.length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">No reviews yet.</p>
                                ) : (
                                    reviews.map((review) => (
                                        <ReviewCard key={review._id} review={review} />
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />

            {showQuotationModal && worker && (
                <RequestQuotationModal
                    workerId={(worker.userId as User)?._id || ''}
                    workerName={(worker.userId as User)?.name || 'Worker'}
                    suggestedCategory={worker.category}
                    onClose={() => setShowQuotationModal(false)}
                />
            )}
        </div>
    );
}
