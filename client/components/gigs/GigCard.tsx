'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, Eye } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import type { Gig, User } from '@/types';

interface GigCardProps {
    gig: Gig;
    index?: number;
}

export function GigCard({ gig, index = 0 }: GigCardProps) {
    const worker = gig.workerId as User;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="h-full"
        >
            <Link href={`/gigs/${gig._id}`} className="block group h-full">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full">
                    {/* Image */}
                    <div className="relative h-48 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/20 dark:to-secondary-900/20 overflow-hidden">
                        {gig.images && gig.images.length > 0 ? (
                            <Image
                                src={gig.images[0]}
                                alt={gig.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-4xl opacity-30">🎨</span>
                            </div>
                        )}

                        {/* Category badge */}
                        <div className="absolute top-3 left-3">
                            <Badge variant="primary" size="sm">
                                {gig.category}
                            </Badge>
                        </div>

                        {/* Views */}
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
                            <Eye className="w-3 h-3" aria-hidden="true" />
                            {gig.views}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                        {/* Worker info */}
                        <div className="flex items-center gap-2 mb-3">
                            <Avatar
                                src={worker?.profileImage}
                                name={worker?.name || 'Worker'}
                                size="xs"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {worker?.name || 'Worker'}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {gig.title}
                        </h3>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
                            {gig.deliveryTime ? (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>
                                        {gig.deliveryTime} {gig.deliveryUnit}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                </div>
                            )}
                            <div className="text-right">
                                <span className="text-xs text-gray-400">
                                    {gig.pricingModel === 'custom' ? 'Starts at' : gig.pricingModel === 'hourly' || gig.pricingModel === 'daily' ? 'Rate' : 'Fixed Price'}
                                </span>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(gig.price)}
                                    {gig.pricingModel === 'hourly' && <span className="text-xs font-normal">/hr</span>}
                                    {gig.pricingModel === 'daily' && <span className="text-xs font-normal">/day</span>}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
