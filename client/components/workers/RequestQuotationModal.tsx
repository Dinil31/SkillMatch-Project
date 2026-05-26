'use client';

import React, { useState } from 'react';
import { X, Briefcase, FileText, DollarSign, Calendar, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { jobService } from '@/services/jobService';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const SERVICE_CATEGORIES = [
    'Web Development', 'Mobile Development', 'Graphic Design',
    'Digital Marketing', 'Content Writing', 'Video Editing',
    'Photography', 'Plumbing', 'Electrical', 'Carpentry',
    'Painting', 'Cleaning', 'Tutoring', 'Cooking', 'Other',
] as const;

interface RequestQuotationModalProps {
    workerId: string;
    workerName: string;
    suggestedCategory?: string;
    suggestedTitle?: string;
    onClose: () => void;
}

export function RequestQuotationModal({
    workerId,
    workerName,
    suggestedCategory,
    suggestedTitle,
    onClose,
}: RequestQuotationModalProps) {
    const { user } = useAuthStore();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        title: suggestedTitle || '',
        category: suggestedCategory || 'Other',
        description: '',
        budget: '',
        deadline: '',
        location: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const update = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.title.trim() || form.title.length < 5) e.title = 'Title must be at least 5 characters.';
        if (!form.description.trim() || form.description.length < 20) e.description = 'Description must be at least 20 characters.';
        if (!form.budget || isNaN(Number(form.budget)) || Number(form.budget) < 100) e.budget = 'Budget must be at least LKR 100.';
        if (form.deadline) {
            const d = new Date(form.deadline);
            if (d <= new Date()) e.deadline = 'Deadline must be a future date.';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { toast.error('Please log in to request a quotation.'); return; }
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await jobService.createJob({
                workerId,
                title: form.title.trim(),
                category: form.category,
                description: form.description.trim(),
                budget: Number(form.budget),
                deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
                location: form.location.trim(),
            } as any);

            toast.success(`Job request sent to ${workerName}! They will review and send you a quotation.`);
            onClose();
            router.push('/dashboard/customer/jobs');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to send request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Request a Quotation</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Sending to <span className="font-medium text-primary-600 dark:text-primary-400">{workerName}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            Job Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => update('title', e.target.value)}
                            placeholder="e.g. Build a portfolio website for my business"
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${
                                errors.title ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
                            }`}
                        />
                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                            Category
                        </label>
                        <select
                            value={form.category}
                            onChange={e => update('category', e.target.value)}
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                        >
                            {SERVICE_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            <FileText className="w-4 h-4 text-gray-400" />
                            Description of Work <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={form.description}
                            onChange={e => update('description', e.target.value)}
                            rows={4}
                            placeholder="Describe exactly what you need. Include any specific requirements, style preferences, or constraints..."
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition resize-none ${
                                errors.description ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
                            }`}
                        />
                        <div className="flex justify-between mt-1">
                            {errors.description
                                ? <p className="text-xs text-red-500">{errors.description}</p>
                                : <span />
                            }
                            <span className={`text-xs ml-auto ${form.description.length < 20 ? 'text-gray-400' : 'text-green-500'}`}>
                                {form.description.length} chars
                            </span>
                        </div>
                    </div>

                    {/* Budget & Deadline side by side */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                                Budget (LKR) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="100"
                                value={form.budget}
                                onChange={e => update('budget', e.target.value)}
                                placeholder="e.g. 15000"
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${
                                    errors.budget ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
                                }`}
                            />
                            {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                Deadline
                            </label>
                            <input
                                type="date"
                                value={form.deadline}
                                onChange={e => update('deadline', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${
                                    errors.deadline ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
                                }`}
                            />
                            {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            Location <span className="text-xs font-normal text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={form.location}
                            onChange={e => update('location', e.target.value)}
                            placeholder="e.g. Colombo 03, or Remote"
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                        />
                    </div>



                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            fullWidth
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            fullWidth
                            isLoading={isSubmitting}
                        >
                            Send Request
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
