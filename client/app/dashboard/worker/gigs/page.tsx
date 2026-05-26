'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PlusCircle, Briefcase, Eye, ShoppingBag, Edit2, Trash2, Package } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { gigService } from '@/services/gigService';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Gig, User } from '@/types';



export default function WorkerGigsPage() {
    const [gigs, setGigs] = useState<Gig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await gigService.getWorkerGigs();
                const loaded = data.gigs || [];
                setGigs(loaded);
            } catch {
                setGigs([]);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleDelete = async (gigId: string) => {
        setDeleting(gigId);
        try {
            await gigService.deleteGig(gigId);
            setGigs((prev) => prev.filter((g) => g._id !== gigId));
            toast.success('Gig deleted successfully');
        } catch {
            toast.error('Failed to delete gig');
        } finally {
            setDeleting(null);
        }
    };

    const stats = {
        total: gigs.length,
        active: gigs.filter((g) => g.isActive).length,
        totalOrders: gigs.reduce((sum, g) => sum + g.totalOrders, 0),
        totalViews: gigs.reduce((sum, g) => sum + g.views, 0),
    };

    const statCards = [
        { label: 'Total Gigs', value: stats.total, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Active', value: stats.active, icon: Package, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
        { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Gigs</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your service offerings</p>
                    </div>
                    <Link href="/dashboard/worker/gigs/new">
                        <Button leftIcon={<PlusCircle className="w-4 h-4" />}>Create New Gig</Button>
                    </Link>
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

                {/* Gigs grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} height={280} className="rounded-2xl" />
                        ))}
                    </div>
                ) : gigs.length === 0 ? (
                    <Card>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" aria-hidden="true" />
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                No gigs yet
                            </h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Create your first gig to start getting orders.
                            </p>
                            <Link href="/dashboard/worker/gigs/new">
                                <Button leftIcon={<PlusCircle className="w-4 h-4" />}>
                                    Create Your First Gig
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gigs.map((gig, i) => (
                            <motion.div
                                key={gig._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card padding="none" className="overflow-hidden flex flex-col h-full">
                                    {/* Image */}
                                    <div className="relative h-40 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/20 dark:to-secondary-900/20 flex-shrink-0">
                                        {gig.images && gig.images.length > 0 ? (
                                            <Image
                                                src={gig.images[0]}
                                                alt={gig.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Package className="w-12 h-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <Badge variant={gig.isActive ? 'success' : 'default'} size="sm" dot>
                                                {gig.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                            <Badge 
                                                variant={(gig as any).approvalStatus === 'approved' ? 'success' : (gig as any).approvalStatus === 'rejected' ? 'danger' : 'warning'} 
                                                size="sm"
                                            >
                                                {(gig as any).approvalStatus === 'approved' ? 'Approved' : (gig as any).approvalStatus === 'rejected' ? 'Rejected' : 'Pending Approval'}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 flex flex-col flex-1">
                                        <Badge variant="primary" size="sm" className="self-start mb-2">
                                            {gig.category}
                                        </Badge>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 flex-1">
                                            {gig.title}
                                        </h3>
                                        
                                        {(gig as any).approvalStatus === 'rejected' && (gig as any).rejectionReason && (
                                            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
                                                <strong>Rejected:</strong> {(gig as any).rejectionReason}
                                                <div className="mt-1 text-gray-500 dark:text-gray-400">Edit to resubmit for approval.</div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                                {formatCurrency(gig.price)}
                                            </span>
                                            <span>{gig.deliveryTime} {gig.deliveryUnit}</span>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                                            <span className="flex items-center gap-1">
                                                <ShoppingBag className="w-3 h-3" aria-hidden="true" />
                                                {gig.totalOrders} orders
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" aria-hidden="true" />
                                                {gig.views} views
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link href={`/dashboard/worker/gigs/${gig._id}/edit`} className="flex-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    fullWidth
                                                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                                                >
                                                    Edit
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                                                isLoading={deleting === gig._id}
                                                onClick={() => setConfirmDeleteId(gig._id)}
                                                aria-label={`Delete ${gig.title}`}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                title="Delete Gig"
                message="Are you sure you want to delete this gig? This action cannot be undone."
                isDanger={true}
                confirmText="Delete"
            />
        </DashboardLayout>
    );
}
