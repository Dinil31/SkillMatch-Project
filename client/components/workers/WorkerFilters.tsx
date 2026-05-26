'use client';

import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { WorkerFilters as WorkerFiltersType, ServiceCategory } from '@/types';

const categories: ServiceCategory[] = [
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

interface WorkerFiltersProps {
    onFilterChange: (filters: WorkerFiltersType) => void;
    isLoading?: boolean;
}

export function WorkerFilters({ onFilterChange, isLoading }: WorkerFiltersProps) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | ''>('');
    const [location, setLocation] = useState('');
    const [minRating, setMinRating] = useState('');
    const [maxRate, setMaxRate] = useState('');
    const [availability, setAvailability] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleApply = () => {
        onFilterChange({
            search: search || undefined,
            category: selectedCategory || undefined,
            location: location || undefined,
            minRating: minRating ? parseFloat(minRating) : undefined,
            maxRate: maxRate ? parseFloat(maxRate) : undefined,
            availability: (availability as WorkerFiltersType['availability']) || undefined,
        });
    };

    const handleReset = () => {
        setSearch('');
        setSelectedCategory('');
        setLocation('');
        setMinRating('');
        setMaxRate('');
        setAvailability('');
        onFilterChange({});
    };

    const hasActiveFilters = search || selectedCategory || location || minRating || maxRate || availability;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            {/* Search bar */}
            <div className="flex gap-2 mb-3">
                <div className="flex-1">
                    <Input
                        placeholder="Search workers by name or skill..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftIcon={<Search className="w-4 h-4" />}
                        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                    />
                </div>
                <Button
                    variant="outline"
                    size="md"
                    onClick={() => setIsExpanded(!isExpanded)}
                    leftIcon={<SlidersHorizontal className="w-4 h-4" />}
                    aria-expanded={isExpanded}
                >
                    Filters
                    {hasActiveFilters && (
                        <span className="ml-1 w-2 h-2 bg-primary-500 rounded-full" aria-hidden="true" />
                    )}
                </Button>
            </div>

            {/* Expanded filters */}
            {isExpanded && (
                <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    {/* Category */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                            Category
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                                    className={cn(
                                        'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                                        selectedCategory === cat
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Location */}
                        <Input
                            label="Location"
                            placeholder="City or district"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />

                        {/* Min Rating */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                Min Rating
                            </label>
                            <select
                                value={minRating}
                                onChange={(e) => setMinRating(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Any rating</option>
                                <option value="4.5">4.5+</option>
                                <option value="4">4.0+</option>
                                <option value="3.5">3.5+</option>
                                <option value="3">3.0+</option>
                            </select>
                        </div>

                        {/* Availability */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                                Availability
                            </label>
                            <select
                                value={availability}
                                onChange={(e) => setAvailability(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Any</option>
                                <option value="available">Available</option>
                                <option value="busy">Busy</option>
                            </select>
                        </div>
                    </div>

                    {/* Max hourly rate */}
                    <Input
                        label="Max Hourly Rate (LKR)"
                        type="number"
                        placeholder="e.g. 5000"
                        value={maxRate}
                        onChange={(e) => setMaxRate(e.target.value)}
                    />

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button onClick={handleApply} isLoading={isLoading} fullWidth>
                            Apply Filters
                        </Button>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                leftIcon={<X className="w-4 h-4" />}
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Quick apply when not expanded */}
            {!isExpanded && (
                <Button onClick={handleApply} isLoading={isLoading} size="sm" fullWidth>
                    Search
                </Button>
            )}
        </div>
    );
}
