'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, DollarSign, Clock, Tag, FileText, ToggleLeft, ToggleRight, MapPin } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { gigService } from '@/services/gigService';
import { gigSchema, type GigFormValues } from '@/lib/validations';
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

const SRI_LANKA_DISTRICTS = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Moneragala', 'Ratnapura', 'Kegalle'
];

export default function EditGigPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const [geoLoading, setGeoLoading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<GigFormValues>({
        resolver: zodResolver(gigSchema),
        defaultValues: {
            deliveryUnit: 'days',
        },
    });

    useEffect(() => {
        async function fetchGig() {
            try {
                const data = await gigService.getGigById(id);
                const gig = data.data ?? data;
                setIsActive(gig.isActive ?? true);
                reset({
                    title: gig.title ?? '',
                    category: gig.category ?? '',
                    description: gig.description ?? '',
                    price: gig.price ?? 0,
                    pricingModel: gig.pricingModel ?? 'fixed',
                    pricingDescription: gig.pricingDescription ?? '',
                    deliveryTime: gig.deliveryTime ?? undefined,
                    deliveryUnit: gig.deliveryUnit ?? 'days',
                    tags: Array.isArray(gig.tags) ? gig.tags : [],
                    locationType: gig.locationType ?? 'island-wide',
                    allowedDistricts: Array.isArray(gig.allowedDistricts) ? gig.allowedDistricts : [],
                    locationRadiusKm: gig.locationRadiusKm ?? 10,
                    locationCoordinates: gig.locationCoordinates,
                });
            } catch (error: unknown) {
                const message =
                    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                    'Failed to load gig details.';
                toast.error(message);
                router.push('/dashboard/worker/gigs');
            } finally {
                setIsLoading(false);
            }
        }

        fetchGig();
    }, [id, reset, router]);

    const onSubmit = async (data: GigFormValues) => {
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('category', data.category);
            formData.append('price', String(data.price));
            formData.append('pricingModel', data.pricingModel || 'fixed');
            if (data.pricingDescription) formData.append('pricingDescription', data.pricingDescription);
            if (data.deliveryTime) formData.append('deliveryTime', String(data.deliveryTime));
            if (data.deliveryUnit) formData.append('deliveryUnit', data.deliveryUnit);
            formData.append('isActive', String(isActive));
            
            if (data.tags && data.tags.length > 0) {
                formData.append('tags', JSON.stringify(data.tags));
            }

            if (data.locationType === 'radius' && data.locationCoordinates) {
                formData.append('locationCoordinates', JSON.stringify(data.locationCoordinates));
                formData.append('locationRadiusKm', String(data.locationRadiusKm));
            } else if (data.locationType === 'districts' && data.allowedDistricts) {
                formData.append('allowedDistricts', JSON.stringify(data.allowedDistricts));
            }
            formData.append('locationType', data.locationType);

            if (selectedImages.length > 0) {
                selectedImages.forEach((file) => {
                    formData.append('images', file);
                });
            }

            await gigService.updateGig(id, selectedImages.length > 0 ? formData : {
                title: data.title,
                description: data.description,
                category: data.category,
                price: data.price,
                pricingModel: data.pricingModel || 'fixed',
                pricingDescription: data.pricingDescription,
                deliveryTime: data.deliveryTime,
                deliveryUnit: data.deliveryUnit,
                tags: data.tags ?? [],
                isActive,
                locationType: data.locationType,
                allowedDistricts: data.locationType === 'districts' ? data.allowedDistricts : [],
                locationRadiusKm: data.locationType === 'radius' ? data.locationRadiusKm : undefined,
                locationCoordinates: data.locationType === 'radius' ? data.locationCoordinates : undefined,
            });
            
            toast.success('Gig updated!');
            router.push('/dashboard/worker/gigs');
            
            // Artificial delay to prevent duplicate submissions while Next.js navigates
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error: unknown) {
            const message =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Failed to update gig. Please try again.';
            toast.error(message);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Header skeleton */}
                    <div className="flex items-center gap-4">
                        <Skeleton width={80} height={36} className="rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton variant="text" width={160} height={28} />
                            <Skeleton variant="text" width={220} height={16} />
                        </div>
                    </div>

                    {/* Status card skeleton */}
                    <Skeleton height={80} className="rounded-xl" />

                    {/* Basic info card skeleton */}
                    <Skeleton height={260} className="rounded-xl" />

                    {/* Pricing card skeleton */}
                    <Skeleton height={180} className="rounded-xl" />

                    {/* Tags card skeleton */}
                    <Skeleton height={120} className="rounded-xl" />

                    {/* Buttons skeleton */}
                    <div className="flex gap-3">
                        <Skeleton height={44} className="rounded-lg flex-1" />
                        <Skeleton height={44} className="rounded-lg flex-1" />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/worker/gigs">
                        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Gig</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                            Update your gig details
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Gig Status Toggle */}
                    <Card>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isActive ? (
                                    <ToggleRight className="w-5 h-5 text-green-500" aria-hidden="true" />
                                ) : (
                                    <ToggleLeft className="w-5 h-5 text-gray-400" aria-hidden="true" />
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Gig Status
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {isActive ? 'Your gig is visible to customers' : 'Your gig is hidden from customers'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={isActive}
                                aria-label="Toggle gig status"
                                onClick={() => setIsActive((prev) => !prev)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                                    isActive
                                        ? 'bg-green-500'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                        isActive ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                                <span className="sr-only">{isActive ? 'Active' : 'Inactive'}</span>
                            </button>
                        </div>
                        <p className="mt-2 text-xs font-medium">
                            <span className={isActive ? 'text-green-500' : 'text-gray-400'}>
                                {isActive ? '● Active' : '● Inactive'}
                            </span>
                        </p>
                    </Card>

                    {/* Basic Info */}
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-primary-500" aria-hidden="true" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Basic Information</h2>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Gig Title"
                                placeholder="e.g. I will build a professional website for your business"
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
                                    placeholder="Describe your gig in detail. What will you deliver? What do you need from the client?"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                    {...register('description')}
                                />
                                {errors.description && (
                                    <p className="text-xs text-red-500">{errors.description.message}</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Location Requirements */}
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-primary-500" aria-hidden="true" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Location Requirements</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Service Location
                                </label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm"
                                    {...register('locationType')}
                                >
                                    <option value="island-wide">Island-wide (Default)</option>
                                    <option value="remote">Remote IT Job (No physical presence needed)</option>
                                    <option value="districts">Specific Districts</option>
                                    <option value="radius">Nearby (Custom Radius)</option>
                                </select>
                            </div>

                            {watch('locationType') === 'districts' && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Select Districts
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {SRI_LANKA_DISTRICTS.map((district) => (
                                            <label key={district} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    value={district}
                                                    checked={(watch('allowedDistricts') || []).includes(district)}
                                                    onChange={(e) => {
                                                        const current = watch('allowedDistricts') || [];
                                                        if (e.target.checked) {
                                                            setValue('allowedDistricts', [...current, district]);
                                                        } else {
                                                            setValue('allowedDistricts', current.filter(d => d !== district));
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                />
                                                {district}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {watch('locationType') === 'radius' && (
                                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Current Location
                                        </label>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => {
                                                setGeoLoading(true);
                                                navigator.geolocation.getCurrentPosition(
                                                    (pos) => {
                                                        setValue('locationCoordinates', {
                                                            type: 'Point',
                                                            coordinates: [pos.coords.longitude, pos.coords.latitude]
                                                        });
                                                        setGeoLoading(false);
                                                        toast.success('Location acquired');
                                                    },
                                                    () => {
                                                        setGeoLoading(false);
                                                        toast.error('Failed to get location');
                                                    }
                                                );
                                            }}
                                            isLoading={geoLoading}
                                        >
                                            Get My Coordinates
                                        </Button>
                                        {watch('locationCoordinates') && (
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                Coordinates set: {watch('locationCoordinates')?.coordinates[1].toFixed(4)}, {watch('locationCoordinates')?.coordinates[0].toFixed(4)}
                                            </p>
                                        )}
                                    </div>
                                    <Input
                                        label="Service Radius (km)"
                                        type="number"
                                        min={1}
                                        max={500}
                                        {...register('locationRadiusKm', { valueAsNumber: true })}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Pricing & Delivery */}
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-5 h-5 text-primary-500" aria-hidden="true" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Pricing &amp; Delivery</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Pricing Model
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        {...register('pricingModel')}
                                    >
                                        <option value="fixed">Fixed Price</option>
                                        <option value="hourly">Hourly Rate</option>
                                        <option value="daily">Daily Rate</option>
                                        <option value="custom">Custom Package</option>
                                    </select>
                                </div>
                                
                                <Input
                                    label={watch('pricingModel') === 'custom' ? "Starting Price (LKR)" : "Price (LKR)"}
                                    type="number"
                                    placeholder="e.g. 5000"
                                    leftIcon={<span className="text-xs font-medium">Rs.</span>}
                                    error={errors.price?.message}
                                    required
                                    min={100}
                                    {...register('price', { valueAsNumber: true })}
                                />
                            </div>

                            {watch('pricingModel') === 'custom' && (
                                <Input
                                    label="Custom Pricing Description"
                                    placeholder="e.g. 20 photos with edits"
                                    error={errors.pricingDescription?.message}
                                    {...register('pricingDescription')}
                                />
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Delivery Time (Optional)"
                                    type="number"
                                    placeholder="e.g. 7"
                                    leftIcon={<Clock className="w-4 h-4" />}
                                    error={errors.deliveryTime?.message}
                                    min={1}
                                    {...register('deliveryTime', { valueAsNumber: true })}
                                />

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Unit
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        {...register('deliveryUnit')}
                                    >
                                        <option value="hours">Hours</option>
                                        <option value="days">Days</option>
                                        <option value="weeks">Weeks</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Tags */}
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <Tag className="w-5 h-5 text-primary-500" aria-hidden="true" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Tags</h2>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tags (comma-separated)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. React, Node.js, Full Stack"
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                {...register('tags', {
                                    setValueAs: (v: string | string[]) =>
                                        Array.isArray(v)
                                            ? v
                                            : typeof v === 'string'
                                            ? v.split(',').map((t) => t.trim()).filter(Boolean)
                                            : [],
                                })}
                            />
                            <p className="text-xs text-gray-400">
                                Add relevant tags to help customers find your gig
                            </p>
                        </div>
                    </Card>

                    {/* Images */}
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-primary-500" aria-hidden="true" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Images</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Upload New Images (up to 5)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            const files = Array.from(e.target.files);
                                            if (files.length > 5) {
                                                toast.error('You can only upload up to 5 images');
                                                setSelectedImages(files.slice(0, 5));
                                            } else {
                                                setSelectedImages(files);
                                            }
                                        }
                                    }}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm"
                                />
                                {selectedImages.length > 0 && (
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        {selectedImages.length} image(s) selected for upload
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Submit */}
                    <div className="flex gap-3">
                        <Link href="/dashboard/worker/gigs" className="flex-1">
                            <Button variant="outline" fullWidth type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" isLoading={isSubmitting} fullWidth className="flex-1">
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
