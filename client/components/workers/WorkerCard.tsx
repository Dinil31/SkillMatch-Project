'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatRating } from '@/lib/utils';
import type { WorkerProfile, User } from '@/types';

interface WorkerCardProps {
    worker: WorkerProfile;
    index?: number;
}

export function WorkerCard({ worker, index = 0 }: WorkerCardProps) {
    const user = worker.userId as User;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full"
        >
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
                <div className="relative">
                    <Avatar
                        src={user?.profileImage}
                        name={user?.name || 'Worker'}
                        size="lg"
                    />
                    {worker.isVerified && (
                        <span className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5" title="Verified worker">
                            <CheckCircle className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                        </span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {user?.name || 'Worker'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{worker.category}</p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {formatRating(worker.averageRating)}
                        </span>
                        <span className="text-xs text-gray-400">({worker.totalReviews})</span>
                    </div>
                </div>

                {/* Availability badge */}
                <Badge
                    variant={
                        worker.availability === 'available'
                            ? 'success'
                            : worker.availability === 'busy'
                                ? 'warning'
                                : 'danger'
                    }
                    dot
                    size="sm"
                >
                    {worker.availability}
                </Badge>
            </div>

            {/* Bio */}
            {worker.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {worker.bio}
                </p>
            )}

            {/* Skills */}
            {worker.skills && worker.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {worker.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="primary" size="sm">
                            {skill}
                        </Badge>
                    ))}
                    {worker.skills.length > 4 && (
                        <Badge variant="default" size="sm">
                            +{worker.skills.length - 4}
                        </Badge>
                    )}
                </div>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    {worker.locationType === 'island-wide' && 'Island Wide'}
                    {worker.locationType === 'districts' && worker.allowedDistricts && worker.allowedDistricts.length > 0 && worker.allowedDistricts.slice(0, 2).join(', ') + (worker.allowedDistricts.length > 2 ? '...' : '')}
                    {worker.locationType === 'districts' && (!worker.allowedDistricts || worker.allowedDistricts.length === 0) && 'Specific Districts'}
                    {worker.locationType === 'radius' && `Within ${worker.locationRadiusKm || 10}km`}
                </span>
                <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {worker.completedJobs} jobs done
                </span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
                <div>
                    <span className="text-xs text-gray-400">Starting from</span>
                    <p className="text-base font-bold text-gray-900 dark:text-white">
                        {worker.hourlyRate > 0 ? `${formatCurrency(worker.hourlyRate)}/hr` : 'Negotiable'}
                    </p>
                </div>
                <Link href={`/workers/${typeof user === 'object' ? user._id : user}`}>
                    <Button size="sm">View Profile</Button>
                </Link>
            </div>
        </motion.div>
    );
}
