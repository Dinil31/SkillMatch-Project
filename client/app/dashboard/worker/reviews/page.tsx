'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MyReviewsList } from '@/components/reviews/MyReviewsList';

export default function WorkerReviewsPage() {
    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Reviews</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage the reviews you have written for customers.</p>
                </div>
                
                <MyReviewsList />
            </div>
        </DashboardLayout>
    );
}
