'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { GigCard } from '@/components/gigs/GigCard';
import { GigCardSkeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { gigService } from '@/services/gigService';
import { Search, Package, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Gig, ServiceCategory } from '@/types';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const SRI_LANKA_DISTRICTS = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Moneragala', 'Ratnapura', 'Kegalle'
];

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

function GigsContent() {
    const searchParams = useSearchParams();
    
    const initialSearch = searchParams?.get('search') || '';
    const initialCategory = (searchParams?.get('category') as ServiceCategory) || '';
    const initialLocation = searchParams?.get('location') || '';

    const [gigs, setGigs] = useState<Gig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | ''>(initialCategory);
    const [sort, setSort] = useState('newest');
    const [locationType, setLocationType] = useState<string>(initialLocation ? 'districts' : '');
    const [district, setDistrict] = useState<string>(initialLocation);
    const [showFilters, setShowFilters] = useState(!!initialLocation);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    
    // Geo state
    const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
    const [geoLoading, setGeoLoading] = useState(false);

    const fetchGigs = async (pageNum = 1) => {
        setIsLoading(true);
        try {
            const data = await gigService.getGigs({
                search: search || undefined,
                category: selectedCategory || undefined,
                sort: sort !== 'newest' ? sort : undefined,
                locationType: locationType || undefined,
                districts: district || undefined,
                lat: coordinates?.lat,
                lng: coordinates?.lng,
                radius: locationType === 'radius' ? 10 : undefined, // default 10km radius
                limit: 12,
                page: pageNum,
            });
            setGigs(data.gigs || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Failed to load gigs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGigs(page);
    }, [selectedCategory, page, sort, locationType, district, coordinates]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchGigs(1);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Browse Gigs</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {total > 0 ? `${total} gigs available` : 'Discover services offered by skilled professionals'}
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-2 mb-6">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                        <div className="flex-1">
                            <Input
                                placeholder="Search gigs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                leftIcon={<Search className="w-4 h-4" />}
                            />
                        </div>
                        <Button type="submit" isLoading={isLoading}>Search</Button>
                    </form>
                    
                    <Button 
                        variant="outline" 
                        onClick={() => setShowFilters(!showFilters)}
                        leftIcon={<SlidersHorizontal className="w-4 h-4" />}
                    >
                        Filters {(locationType || sort !== 'newest') && <span className="ml-1 w-2 h-2 rounded-full bg-primary-500"></span>}
                    </Button>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 mb-6 flex flex-wrap gap-4">
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <label className="text-xs font-medium text-gray-500">Sort By</label>
                            <select 
                                value={sort} 
                                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            >
                                <option value="newest">Newest Arrivals</option>
                                <option value="rating">Highest Rated Worker</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <label className="text-xs font-medium text-gray-500">Location Type</label>
                            <select 
                                value={locationType} 
                                onChange={(e) => { 
                                    setLocationType(e.target.value); 
                                    setDistrict('');
                                    setPage(1);
                                }}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            >
                                <option value="">Any Location</option>
                                <option value="island-wide">Island-wide</option>
                                <option value="remote">Remote (Online)</option>
                                <option value="districts">Specific District</option>
                                <option value="radius">Nearby (10km Radius)</option>
                            </select>
                        </div>

                        {locationType === 'districts' && (
                            <div className="flex flex-col gap-1 min-w-[200px]">
                                <label className="text-xs font-medium text-gray-500">Select District</label>
                                <select 
                                    value={district} 
                                    onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                                >
                                    <option value="">All Districts</option>
                                    {SRI_LANKA_DISTRICTS.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {locationType === 'radius' && (
                            <div className="flex items-end min-w-[200px]">
                                <Button 
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setGeoLoading(true);
                                        navigator.geolocation.getCurrentPosition(
                                            (pos) => {
                                                setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                                                setPage(1);
                                                setGeoLoading(false);
                                                toast.success('Location updated for search');
                                            },
                                            () => {
                                                setGeoLoading(false);
                                                toast.error('Location access denied');
                                                setLocationType('');
                                            }
                                        );
                                    }}
                                    isLoading={geoLoading}
                                >
                                    {coordinates ? 'Update Current Location' : 'Get My Location'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Category filters */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <button
                        onClick={() => { setSelectedCategory(''); setPage(1); }}
                        className={cn(
                            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                            selectedCategory === ''
                                ? 'bg-primary-600 text-white'
                                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300'
                        )}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { setSelectedCategory(cat); setPage(1); }}
                            className={cn(
                                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                                selectedCategory === cat
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300'
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Gigs grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <GigCardSkeleton key={i} />
                        ))}
                    </div>
                ) : gigs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" aria-hidden="true" />
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            No gigs found
                        </h3>
                        <p className="text-gray-400 text-sm">Try different search terms or categories.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {gigs.map((gig, i) => (
                            <GigCard key={gig._id} gig={gig} index={i} />
                        ))}
                    </div>
                )}

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

export default function GigsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <GigsContent />
        </Suspense>
    );
}
