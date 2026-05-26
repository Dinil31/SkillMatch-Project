'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WorkerCard } from '@/components/workers/WorkerCard';
import { WorkerFilters } from '@/components/workers/WorkerFilters';
import { WorkerCardSkeleton } from '@/components/ui/Skeleton';
import { useWorkers } from '@/hooks/useWorkers';
import { Users } from 'lucide-react';

export default function WorkersPage() {
    const [page, setPage] = useState(1);
    const { workers, isLoading, error, total, setFilters } = useWorkers({ limit: 12, page });

    const handleFilterChange = (filters: any) => {
        setPage(1);
        setFilters({ ...filters, page: 1 });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Find Skilled Workers
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {total > 0 ? `${total} professionals available` : 'Browse our talented professionals'}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <WorkerFilters onFilterChange={handleFilterChange} isLoading={isLoading} />
                        </div>
                    </div>

                    {/* Workers grid */}
                    <div className="lg:col-span-3">
                        {error ? (
                            <div className="text-center py-12">
                                <p className="text-red-500">{error}</p>
                            </div>
                        ) : isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <WorkerCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : workers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" aria-hidden="true" />
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    No workers found
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    Try adjusting your filters or search terms.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {workers.map((worker, i) => (
                                    <WorkerCard key={worker._id} worker={worker} index={i} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {total > 12 && (
                    <div className="flex items-center justify-center gap-3 mt-8">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-500">
                            Page {page} of {Math.ceil(total / 12)}
                        </span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= Math.ceil(total / 12) || isLoading}
                            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
