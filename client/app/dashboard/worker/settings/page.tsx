'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
    User, Lock, Bell, AlertTriangle, Camera, Briefcase,
    Phone, MapPin, Star, Tag, CheckCircle, ShieldCheck, X, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { AvatarUpload } from '@/components/ui/AvatarUpload';
import { useAuthStore } from '@/store/authStore';
import { workerService } from '@/services/workerService';
import { authService } from '@/services/authService';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

const SRI_LANKA_DISTRICTS = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Moneragala', 'Ratnapura', 'Kegalle',
];

const SERVICE_CATEGORIES = [
    'Web Development', 'Mobile Development', 'Graphic Design', 'Digital Marketing',
    'Content Writing', 'Video Editing', 'Photography', 'Plumbing', 'Electrical',
    'Carpentry', 'Painting', 'Cleaning', 'Tutoring', 'Cooking', 'Other',
] as const;

// ── Schemas ────────────────────────────────────────────────────────────────────
const profileSchema = z.object({
    name:  z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^(\+94|0)[0-9]{9}$/, 'Enter a valid Sri Lankan number (e.g. 0771234567)').or(z.literal('')),
});

const professionalSchema = z.object({
    bio:          z.string().max(1000, 'Bio cannot exceed 1000 characters').optional(),
    category:     z.string().min(1, 'Please select a category'),
    hourlyRate:   z.number({ invalid_type_error: 'Must be a number' }).min(0, 'Cannot be negative'),
    experience:   z.number({ invalid_type_error: 'Must be a number' }).min(0).max(50),
    availability: z.enum(['available', 'busy', 'unavailable']),
    skills:       z.string().optional(),   // comma-separated
    locationType: z.enum(['island-wide', 'remote', 'districts', 'radius']).default('island-wide'),
    allowedDistricts: z.array(z.string()).optional(),
    locationRadiusKm: z.number().optional(),
    locationCoordinates: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()]),
    }).optional(),
});

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword:     z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

const otpSchema = z.object({ otp: z.string().length(6, 'OTP must be 6 digits') });

type ProfileValues      = z.infer<typeof profileSchema>;
type ProfessionalValues = z.infer<typeof professionalSchema>;
type PasswordValues     = z.infer<typeof passwordSchema>;
type OtpValues          = z.infer<typeof otpSchema>;

export default function WorkerSettingsPage() {
    const { user, setUser, logout } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading]         = useState(true);
    const [workerProfile, setWorkerProfile] = useState<any>(null);
    const [showOtpInput, setShowOtpInput]   = useState(false);
    const [otpSending, setOtpSending]       = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
    const [retainedImages, setRetainedImages] = useState<string[]>([]);
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        jobUpdates: true,
        messages: true,
    });

    // ── Forms ──────────────────────────────────────────────────────────────────
    const profileForm = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: '', phone: '' },
    });

    const professionalForm = useForm<ProfessionalValues>({
        resolver: zodResolver(professionalSchema),
        defaultValues: {
            bio: '', category: 'Other', hourlyRate: 0,
            experience: 0, availability: 'available', skills: '',
            locationType: 'island-wide', allowedDistricts: [], locationRadiusKm: 10,
        },
    });

    const locationType = professionalForm.watch('locationType');
    const allowedDistricts = professionalForm.watch('allowedDistricts') || [];

    const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });
    const otpForm      = useForm<OtpValues>({ resolver: zodResolver(otpSchema) });

    // ── Load profile on mount ──────────────────────────────────────────────────
    const loadProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await workerService.getMyProfile();
            const profile = data.profile;
            setWorkerProfile(profile);

            // Pre-fill personal info from user store + populated userId
            const userData = profile?.userId || {};
            profileForm.reset({
                name:  userData.name  || user?.name  || '',
                phone: userData.phone || user?.phone || '',
            });

            if (profile) {
                setRetainedImages(profile.portfolio || []);
                professionalForm.reset({
                    bio:          profile.bio          || '',
                    category:     profile.category     || 'Other',
                    hourlyRate:   profile.hourlyRate   ?? 0,
                    experience:   profile.experience   ?? 0,
                    availability: profile.availability || 'available',
                    skills:       (profile.skills || []).join(', '),
                    locationType: profile.locationType || 'island-wide',
                    allowedDistricts: profile.allowedDistricts || [],
                    locationRadiusKm: profile.locationRadiusKm ?? 10,
                    locationCoordinates: profile.locationCoordinates,
                });
            }
        } catch {
            toast.error('Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    // ── Submit: Personal Info ──────────────────────────────────────────────────
    const onProfileSubmit = async (data: ProfileValues) => {
        try {
            const res = await workerService.updateUserInfo({ name: data.name, phone: data.phone });
            // Update local auth store
            if (user) setUser({ ...user, name: res.user.name, phone: res.user.phone });
            toast.success('Personal info updated successfully!');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to update profile');
        }
    };

    // ── Submit: Professional Info ──────────────────────────────────────────────
    const onProfessionalSubmit = async (data: ProfessionalValues) => {
        try {
            const skillsArray = (data.skills || '').split(',').map(s => s.trim()).filter(Boolean);
            
            const formData = new FormData();
            formData.append('bio', data.bio || '');
            formData.append('category', data.category);
            formData.append('hourlyRate', String(data.hourlyRate));
            formData.append('experience', String(data.experience));
            formData.append('availability', data.availability);
            
            skillsArray.forEach(skill => formData.append('skills[]', skill)); // Appending array as expected
            
            if (data.locationType) {
                formData.append('locationType', data.locationType);
            }
            if (data.locationType === 'districts' && data.allowedDistricts) {
                formData.append('allowedDistricts', JSON.stringify(data.allowedDistricts));
            }
            if (data.locationType === 'radius' && data.locationCoordinates) {
                formData.append('locationCoordinates', JSON.stringify(data.locationCoordinates));
                formData.append('locationRadiusKm', String(data.locationRadiusKm || 10));
            }

            formData.append('retainedPortfolio', JSON.stringify(retainedImages));
            
            portfolioImages.forEach(file => formData.append('images', file));

            if (workerProfile) {
                // Update existing profile
                await workerService.updateProfile(portfolioImages.length > 0 ? formData : {
                    bio: data.bio,
                    category: data.category,
                    hourlyRate: data.hourlyRate,
                    experience: data.experience,
                    availability: data.availability,
                    skills: skillsArray,
                    location: { city: (data as any).city || '', district: (data as any).district || '' },
                });
            } else {
                // Create profile for the first time
                await workerService.createProfile(formData);
            }
            toast.success('Professional info saved!');
            setPortfolioImages([]);
            await loadProfile();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to save professional info');
        }
    };

    // ── Submit: Password ───────────────────────────────────────────────────────
    const onPasswordSubmit = async (data: PasswordValues) => {
        try {
            await workerService.changePassword(data.currentPassword, data.newPassword);
            toast.success('Password changed successfully!');
            passwordForm.reset();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to change password');
        }
    };

    // ── OTP: Send & Verify ─────────────────────────────────────────────────────
    const handleSendOtp = async () => {
        setOtpSending(true);
        try {
            await authService.resendVerificationEmail();
            setShowOtpInput(true);
            toast.success('Verification email & OTP sent!');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to send verification email');
        } finally {
            setOtpSending(false);
        }
    };

    const onOtpSubmit = async (data: OtpValues) => {
        try {
            await authService.verifyEmailOtp(data.otp);
            if (user) setUser({ ...user, isVerified: true });
            setShowOtpInput(false);
            toast.success('✅ Email verified successfully!');
        } catch {
            toast.error('Invalid or expired OTP');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await authService.deleteAccount();
            toast.success('Account deleted successfully');
            logout();
            router.push('/');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to delete account');
        }
    };

    const handleAvatarUpload = async (file: File) => {
        setIsUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const { default: api } = await import('@/services/api');
            const res = await api.put('/auth/profile-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (user && res.data?.user) {
                setUser({ ...user, profileImage: res.data.user.profileImage });
            }
            toast.success('Profile picture updated');
        } catch {
            toast.error('Failed to update profile picture');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto space-y-5">
                    {[1, 2, 3].map(i => <Skeleton key={i} height={220} className="rounded-2xl" />)}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile & Settings</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and professional details</p>
                    </div>
                    {workerProfile && (
                        <Link href={`/workers/${user?._id}`}>
                            <Button type="button" variant="outline" leftIcon={<ExternalLink className="w-4 h-4" />}>
                                View Public Profile
                            </Button>
                        </Link>
                    )}
                </div>

                {/* ── 1. Personal Info ─────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Card>
                        <div className="flex items-center gap-2 mb-5">
                            <User className="w-5 h-5 text-primary-500" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Personal Info</h2>
                        </div>

                        {/* Avatar */}
                        <div className="flex items-center gap-4 mb-6">
                            <AvatarUpload
                                src={user?.profileImage}
                                name={user?.name || ''}
                                size="xl"
                                onUpload={handleAvatarUpload}
                                isLoading={isUploadingAvatar}
                            />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                                <p className="text-sm text-gray-400">{user?.email}</p>
                                <p className="text-xs mt-1">
                                    {user?.isVerified
                                        ? <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Email verified</span>
                                        : <span className="text-amber-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Email not verified</span>}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                            <Input
                                label="Full Name"
                                placeholder="Your full name"
                                leftIcon={<User className="w-4 h-4" />}
                                error={profileForm.formState.errors.name?.message}
                                required
                                {...profileForm.register('name')}
                            />
                            <div className="space-y-2">
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Input
                                            label="Email Address"
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            hint={user?.isVerified ? "Email cannot be changed" : "Verify your email to continue"}
                                        />
                                    </div>
                                    {!user?.isVerified && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSendOtp}
                                            isLoading={otpSending}
                                            className="mb-px flex-shrink-0"
                                        >
                                            Verify
                                        </Button>
                                    )}
                                </div>
                                
                                {showOtpInput && !user?.isVerified && (
                                    <form
                                        onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                                        className="flex gap-2"
                                    >
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            placeholder="Enter 6-digit OTP from email"
                                            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            {...otpForm.register('otp')}
                                        />
                                        <Button type="submit" size="sm" isLoading={otpForm.formState.isSubmitting}>
                                            Submit OTP
                                        </Button>
                                    </form>
                                )}
                            </div>

                            <Input
                                label="Phone Number"
                                type="tel"
                                placeholder="0771234567"
                                leftIcon={<Phone className="w-4 h-4" />}
                                error={profileForm.formState.errors.phone?.message}
                                {...profileForm.register('phone')}
                            />

                            <Button type="submit" isLoading={profileForm.formState.isSubmitting}>
                                Save Personal Info
                            </Button>
                        </form>
                    </Card>
                </motion.div>

                {/* ── 2. Professional Info ──────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                        <div className="flex items-center gap-2 mb-5">
                            <Briefcase className="w-5 h-5 text-primary-500" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Professional Info</h2>
                            {!workerProfile && (
                                <span className="ml-auto text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                                    Profile not created yet
                                </span>
                            )}
                        </div>

                        <form onSubmit={professionalForm.handleSubmit(onProfessionalSubmit)} className="space-y-4">
                            {/* Category */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Primary Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className={cn('w-full rounded-xl border px-3 py-2.5 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500',
                                        professionalForm.formState.errors.category
                                            ? 'border-red-400 dark:border-red-500'
                                            : 'border-gray-300 dark:border-gray-600'
                                    )}
                                    {...professionalForm.register('category')}
                                >
                                    {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                {professionalForm.formState.errors.category && (
                                    <p className="text-xs text-red-500">{professionalForm.formState.errors.category.message}</p>
                                )}
                            </div>

                            {/* Bio */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                                <textarea
                                    rows={3}
                                    placeholder="Tell customers about your experience and skills..."
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    {...professionalForm.register('bio')}
                                />
                                {professionalForm.formState.errors.bio && (
                                    <p className="text-xs text-red-500">{professionalForm.formState.errors.bio.message}</p>
                                )}
                            </div>

                            {/* Skills */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Skills</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. React, Node.js, Photoshop (comma separated)"
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    {...professionalForm.register('skills')}
                                />
                                <p className="text-xs text-gray-400">Separate skills with commas</p>
                            </div>

                            {/* Hourly Rate + Experience */}
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Hourly Rate (LKR)"
                                    type="number"
                                    min={0}
                                    placeholder="2500"
                                    leftIcon={<span className="text-xs font-bold text-gray-500">Rs.</span>}
                                    error={professionalForm.formState.errors.hourlyRate?.message}
                                    {...professionalForm.register('hourlyRate', { valueAsNumber: true })}
                                />
                                <Input
                                    label="Experience (years)"
                                    type="number"
                                    min={0}
                                    max={50}
                                    placeholder="3"
                                    leftIcon={<Star className="w-4 h-4" />}
                                    error={professionalForm.formState.errors.experience?.message}
                                    {...professionalForm.register('experience', { valueAsNumber: true })}
                                />
                            </div>

                            {/* Availability */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Availability</label>
                                <select
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    {...professionalForm.register('availability')}
                                >
                                    <option value="available">🟢 Available</option>
                                    <option value="busy">🟡 Busy</option>
                                    <option value="unavailable">🔴 Unavailable</option>
                                </select>
                            </div>

                            {/* Location Requirements */}
                            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                                    <MapPin className="w-3.5 h-3.5" /> Service Location
                                </p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location Type</label>
                                        <select
                                            className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            {...professionalForm.register('locationType')}
                                        >
                                            <option value="island-wide">Island Wide (All Sri Lanka)</option>
                                            <option value="districts">Specific Districts</option>
                                            <option value="radius">Within a Radius</option>
                                        </select>
                                    </div>

                                    {locationType === 'districts' && (
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                                                Select Service Districts
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {SRI_LANKA_DISTRICTS.map((district) => (
                                                    <label key={district} className="flex items-center gap-2 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={allowedDistricts.includes(district)}
                                                            onChange={(e) => {
                                                                const current = professionalForm.getValues('allowedDistricts') || [];
                                                                if (e.target.checked) {
                                                                    professionalForm.setValue('allowedDistricts', [...current, district]);
                                                                } else {
                                                                    professionalForm.setValue('allowedDistricts', current.filter(d => d !== district));
                                                                }
                                                            }}
                                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-colors"
                                                        />
                                                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                                            {district}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {locationType === 'radius' && (
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                                            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                                                <div className="flex-1 space-y-1.5">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Current Location
                                                    </label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="w-full justify-center"
                                                        leftIcon={<MapPin className="w-4 h-4" />}
                                                        onClick={() => {
                                                            if (navigator.geolocation) {
                                                                navigator.geolocation.getCurrentPosition(
                                                                    (position) => {
                                                                        professionalForm.setValue('locationCoordinates', {
                                                                            type: 'Point',
                                                                            coordinates: [position.coords.longitude, position.coords.latitude]
                                                                        });
                                                                        toast.success('Location acquired');
                                                                    },
                                                                    (error) => {
                                                                        console.error(error);
                                                                        toast.error('Failed to get location');
                                                                    }
                                                                );
                                                            } else {
                                                                toast.error('Geolocation is not supported by this browser.');
                                                            }
                                                        }}
                                                    >
                                                        {professionalForm.watch('locationCoordinates') ? 'Update Location' : 'Get My Location'}
                                                    </Button>
                                                    {professionalForm.watch('locationCoordinates') && (
                                                        <p className="text-xs text-green-600 dark:text-green-400">
                                                            Coordinates set: {professionalForm.watch('locationCoordinates')?.coordinates[1].toFixed(4)}, {professionalForm.watch('locationCoordinates')?.coordinates[0].toFixed(4)}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <Input
                                                        label="Radius (km)"
                                                        type="number"
                                                        min={1}
                                                        max={500}
                                                        {...professionalForm.register('locationRadiusKm', { valueAsNumber: true })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Portfolio Images */}
                            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                                    Portfolio Images
                                </label>
                                
                                {/* Existing Images */}
                                {retainedImages.length > 0 && (
                                    <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {retainedImages.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                                                <img src={img} alt={`Portfolio ${idx}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => setRetainedImages(retainedImages.filter((_, i) => i !== idx))}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upload New Images */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setPortfolioImages(Array.from(e.target.files));
                                        }
                                    }}
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                {portfolioImages.length > 0 && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                        {portfolioImages.length} new image(s) selected
                                    </p>
                                )}
                            </div>

                            <Button type="submit" isLoading={professionalForm.formState.isSubmitting}>
                                {workerProfile ? 'Save Professional Info' : 'Create Worker Profile'}
                            </Button>
                        </form>
                    </Card>
                </motion.div>

                {/* ── 3. Change Password ────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Card>
                        <div className="flex items-center gap-2 mb-5">
                            <Lock className="w-5 h-5 text-primary-500" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Change Password</h2>
                        </div>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <Input
                                label="Current Password"
                                type="password"
                                placeholder="Enter current password"
                                error={passwordForm.formState.errors.currentPassword?.message}
                                required
                                autoComplete="current-password"
                                {...passwordForm.register('currentPassword')}
                            />
                            <Input
                                label="New Password"
                                type="password"
                                placeholder="Minimum 6 characters"
                                error={passwordForm.formState.errors.newPassword?.message}
                                required
                                autoComplete="new-password"
                                {...passwordForm.register('newPassword')}
                            />
                            <Input
                                label="Confirm New Password"
                                type="password"
                                placeholder="Repeat new password"
                                error={passwordForm.formState.errors.confirmPassword?.message}
                                required
                                autoComplete="new-password"
                                {...passwordForm.register('confirmPassword')}
                            />
                            <Button type="submit" isLoading={passwordForm.formState.isSubmitting}>
                                Change Password
                            </Button>
                        </form>
                    </Card>
                </motion.div>

                {/* ── 4. Notifications ──────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card>
                        <div className="flex items-center gap-2 mb-5">
                            <Bell className="w-5 h-5 text-primary-500" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
                        </div>
                        <div className="space-y-4">
                            {([
                                { key: 'emailNotifications' as const, label: 'Email Notifications', description: 'Receive updates via email' },
                                { key: 'jobUpdates' as const, label: 'Job Updates', description: 'Get notified about job status changes' },
                                { key: 'messages' as const, label: 'Messages', description: 'Receive message notifications' },
                            ]).map(({ key, label, description }) => (
                                <div key={key} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                                        <p className="text-xs text-gray-400">{description}</p>
                                    </div>
                                    <button
                                        role="switch"
                                        aria-checked={notifications[key]}
                                        onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                                        className={cn(
                                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                                            notifications[key] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                                        )}
                                    >
                                        <span className={cn(
                                            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                                            notifications[key] ? 'translate-x-6' : 'translate-x-1'
                                        )} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <Button className="mt-5" onClick={() => toast.success('Notification preferences saved')}>
                            Save Preferences
                        </Button>
                    </Card>
                </motion.div>

                {/* ── 5. Danger Zone ────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <Card className="border-red-200 dark:border-red-900">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <h2 className="text-base font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                            Delete Account
                        </Button>
                    </Card>
                </motion.div>
            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account"
                message="Are you sure? This will permanently delete your account and all data."
                isDanger={true}
                confirmText="Delete Account"
            />
        </DashboardLayout>
    );
}
