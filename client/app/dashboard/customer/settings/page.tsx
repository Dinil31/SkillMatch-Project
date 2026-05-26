'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Bell, AlertTriangle, Camera, CheckCircle, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { AvatarUpload } from '@/components/ui/AvatarUpload';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { authService } from '@/services/authService';

const otpSchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
});

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
});

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type OtpValues = z.infer<typeof otpSchema>;

export default function CustomerSettingsPage() {
    const { user, setUser, logout } = useAuthStore();
    const router = useRouter();
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        jobUpdates: true,
        messages: true,
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const [otpSending, setOtpSending] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('notificationPrefs');
        if (saved) setNotifications(JSON.parse(saved));
    }, []);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: user?.name || '' },
    });

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
    });

    const otpForm = useForm<OtpValues>({
        resolver: zodResolver(otpSchema),
    });

    const onProfileSubmit = async (data: ProfileFormValues) => {
        try {
            const { default: api } = await import('@/services/api');
            await api.put('/auth/profile', { name: data.name });
            toast.success('Profile updated successfully');
        } catch {
            toast.error('Failed to update profile. Please try again.');
        }
    };

    const onPasswordSubmit = async (data: PasswordFormValues) => {
        try {
            const { default: api } = await import('@/services/api');
            await api.put('/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            toast.success('Password changed successfully');
            passwordForm.reset();
        } catch {
            toast.error('Failed to change password. Check your current password.');
        }
    };

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

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences</p>
                </div>

                {/* Profile Section */}
                <Card>
                    <div className="flex items-center gap-2 mb-5">
                        <User className="w-5 h-5 text-primary-500" aria-hidden="true" />
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Profile</h2>
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
                            <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
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
                        <Button
                            type="submit"
                            isLoading={profileForm.formState.isSubmitting}
                        >
                            Save Profile
                        </Button>
                    </form>
                </Card>

                {/* Password Section */}
                <Card>
                    <div className="flex items-center gap-2 mb-5">
                        <Lock className="w-5 h-5 text-primary-500" aria-hidden="true" />
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
                            placeholder="Enter new password"
                            error={passwordForm.formState.errors.newPassword?.message}
                            required
                            autoComplete="new-password"
                            {...passwordForm.register('newPassword')}
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            placeholder="Confirm new password"
                            error={passwordForm.formState.errors.confirmPassword?.message}
                            required
                            autoComplete="new-password"
                            {...passwordForm.register('confirmPassword')}
                        />
                        <Button
                            type="submit"
                            isLoading={passwordForm.formState.isSubmitting}
                        >
                            Change Password
                        </Button>
                    </form>
                </Card>

                {/* Notifications Section */}
                <Card>
                    <div className="flex items-center gap-2 mb-5">
                        <Bell className="w-5 h-5 text-primary-500" aria-hidden="true" />
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { key: 'emailNotifications' as const, label: 'Email Notifications', description: 'Receive updates via email' },
                            { key: 'jobUpdates' as const, label: 'Job Updates', description: 'Get notified about job status changes' },
                            { key: 'messages' as const, label: 'Messages', description: 'Receive message notifications' },
                        ].map(({ key, label, description }) => (
                            <div key={key} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                                    <p className="text-xs text-gray-400">{description}</p>
                                </div>
                                <button
                                    role="switch"
                                    aria-checked={notifications[key]}
                                    onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${notifications[key] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications[key] ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>

                    <Button
                        className="mt-5"
                        onClick={() => {
                            localStorage.setItem('notificationPrefs', JSON.stringify(notifications));
                            toast.success('Notification preferences saved');
                        }}
                    >
                        Save Preferences
                    </Button>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-200 dark:border-red-900">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-500" aria-hidden="true" />
                        <h2 className="text-base font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                        Delete Account
                    </Button>
                </Card>
            </div>
            
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account"
                message="Are you absolutely sure? This will permanently delete your account and all data. This action cannot be undone."
                isDanger={true}
                confirmText="Delete Account"
            />
        </DashboardLayout>
    );
}
