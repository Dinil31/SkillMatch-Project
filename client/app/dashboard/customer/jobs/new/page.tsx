'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, DollarSign, Calendar, FileText, UserCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { jobService } from '@/services/jobService';
import toast from 'react-hot-toast';
import type { ServiceCategory } from '@/types';

const SERVICE_CATEGORIES: ServiceCategory[] = [
    'Web Development',
    'Mobile Development',
    'Graphic Design',
    'Digital Marketing',
    'Content Writing',
    'Video Editing',
    'Photography',
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Painting',
    'Cleaning',
    'Tutoring',
    'Cooking',
    'Other',
];

const jobPostSchema = z.object({
    title: z
        .string()
        .min(5, 'Title must be at least 5 characters')
        .max(100, 'Title cannot exceed 100 characters'),
    category: z.string().min(1, 'Please select a category'),
    description: z
        .string()
        .min(20, 'Description must be at least 20 characters')
        .max(2000, 'Description cannot exceed 2000 characters'),
    budget: z
        .number({ invalid_type_error: 'Budget must be a number' })
        .min(500, 'Budget must be at least LKR 500'),
    deadline: z
        .string()
        .min(1, 'Deadline is required')
        .refine((val) => {
            const date = new Date(val);
            return date > new Date();
        }, 'Deadline must be a future date'),
    workerName: z.string().optional(),
});

type JobPostFormValues = z.infer<typeof jobPostSchema>;

export default function PostNewJobPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultWorkerName = searchParams.get('workerName') || '';
    const defaultWorkerId = searchParams.get('workerId') || '';

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<JobPostFormValues>({
        resolver: zodResolver(jobPostSchema),
        defaultValues: {
            workerName: defaultWorkerName,
        }
    });

    const onSubmit = async (data: JobPostFormValues) => {
        try {
            await jobService.createJob({
                title: data.title,
                description: data.description,
                category: data.category as ServiceCategory,
                budget: data.budget,
                deadline: data.deadline,
                workerId: defaultWorkerId || data.workerName || undefined,
            });
            toast.success('Job posted successfully!');
            router.push('/dashboard/customer/jobs');
        } catch {
            toast.error('Failed to post job. Please try again.');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/customer/jobs">
                        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Post a New Job</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                            Find the right worker for your task
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Job Details */}
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-primary-500" aria-hidden="true" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Job Details</h2>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Job Title"
                                placeholder="e.g. Fix leaking pipe in bathroom"
                                error={errors.title?.message}
                                required
                                {...register('title')}
                            />

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Category <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                                </label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    {...register('category')}
                                >
                                    <option value="">Select a category</option>
                                    {SERVICE_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                {errors.category && (
                                    <p className="text-xs text-red-500">{errors.category.message}</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Description <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                                </label>
                                <textarea
                                    rows={5}
                                    placeholder="Describe the job in detail. What needs to be done? Any specific requirements?"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                    {...register('description')}
                                />
                                {errors.description && (
                                    <p className="text-xs text-red-500">{errors.description.message}</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Budget & Timeline */}
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-5 h-5 text-primary-500" aria-hidden="true" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Budget &amp; Timeline</h2>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Budget (LKR)"
                                type="number"
                                placeholder="e.g. 5000"
                                leftIcon={<span className="text-xs font-medium">Rs.</span>}
                                error={errors.budget?.message}
                                required
                                min={500}
                                {...register('budget', { valueAsNumber: true })}
                            />

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Deadline <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="date"
                                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 pl-10 pr-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        {...register('deadline')}
                                    />
                                </div>
                                {errors.deadline && (
                                    <p className="text-xs text-red-500">{errors.deadline.message}</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Assign Worker (Optional) */}
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <UserCheck className="w-5 h-5 text-primary-500" aria-hidden="true" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Assign Worker (Optional)</h2>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Leave blank to post publicly and get quotes from workers
                        </p>

                        <Input
                            label="Worker Name"
                            placeholder="e.g. John Silva"
                            hint="Enter a worker's name to assign this job directly"
                            readOnly={!!defaultWorkerName}
                            {...register('workerName')}
                        />
                    </Card>

                    {/* Submit */}
                    <div className="flex gap-3">
                        <Link href="/dashboard/customer/jobs" className="flex-1">
                            <Button variant="outline" fullWidth type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" isLoading={isSubmitting} fullWidth className="flex-1">
                            Post Job
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
