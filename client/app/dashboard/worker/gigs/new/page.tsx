'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, DollarSign, Clock, Tag, FileText, MapPin } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { gigService } from '@/services/gigService';
import { gigSchema, type GigFormValues } from '@/lib/validations';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import type { ServiceCategory, GigFormData } from '@/types';

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

export default function CreateGigPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [geoLoading, setGeoLoading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<GigFormValues>({
        resolver: zodResolver(gigSchema),
        defaultValues: {
            title: '',
            description: '',
            category: 'Other',
            price: 500,
            pricingModel: 'fixed',
            pricingDescription: '',
            deliveryTime: 1,
            deliveryUnit: 'days',
            locationType: 'island-wide',
            allowedDistricts: [],
            locationRadiusKm: 10,
        },
    });

    const locationType = watch('locationType');
    const allowedDistricts = watch('allowedDistricts') || [];
    const pricingModel = watch('pricingModel');

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
            if (data.tags && data.tags.length > 0) formData.append('tags', JSON.stringify(data.tags));
            
            if (locationType === 'radius' && watch('locationCoordinates')) {
                formData.append('locationCoordinates', JSON.stringify(watch('locationCoordinates')));
                formData.append('locationRadiusKm', String(watch('locationRadiusKm')));
            } else if (locationType === 'districts') {
                formData.append('allowedDistricts', JSON.stringify(allowedDistricts));
            }
            formData.append('locationType', locationType);

            selectedImages.forEach((file) => {
                formData.append('images', file);
            });

            await gigService.createGig(formData);
            toast.success('Gig created successfully!');
            router.push('/dashboard/worker/gigs');
            
            // Artificial delay to prevent duplicate submissions while Next.js navigates
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error: unknown) {
            const message =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Failed to create gig. Please try again.';
            toast.error(message);
        }
    };

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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Gig</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                            Offer your services to customers
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

                            {locationType === 'districts' && (
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
                                                    checked={allowedDistricts.includes(district)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setValue('allowedDistricts', [...allowedDistricts, district]);
                                                        } else {
                                                            setValue('allowedDistricts', allowedDistricts.filter(d => d !== district));
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

                            {locationType === 'radius' && (
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

                    {/* Pricing */}
                    <Card>
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-5 h-5 text-primary-500" aria-hidden="true" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Pricing & Delivery</h2>
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
                                    label={pricingModel === 'custom' ? "Starting Price (LKR)" : "Price (LKR)"}
                                    type="number"
                                    placeholder="e.g. 5000"
                                    leftIcon={<span className="text-xs font-medium">Rs.</span>}
                                    error={errors.price?.message}
                                    required
                                    min={100}
                                    {...register('price', { valueAsNumber: true })}
                                />
                            </div>

                            {pricingModel === 'custom' && (
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
                                    setValueAs: (v: string) =>
                                        typeof v === 'string'
                                            ? v.split(',').map((t) => t.trim()).filter(Boolean)
                                            : v,
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
                                    Upload Images (up to 5)
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
                                        {selectedImages.length} image(s) selected
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
                            Create Gig
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
