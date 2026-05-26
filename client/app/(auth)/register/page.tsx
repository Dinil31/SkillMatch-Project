'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Briefcase, ShoppingBag, Phone, ShieldCheck, X, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { registerSchema, type RegisterFormValues } from '@/lib/validations';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const { register: registerUser, isLoading, fetchMe } = useAuth();

    // OTP modal state
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: 'customer' },
    });

    const selectedRole = watch('role');

    const onSubmit = async (data: RegisterFormValues) => {
        const { confirmPassword, ...submitData } = data;
        try {
            await registerUser(submitData as any, false);
            // After registration, prompt for OTP
            setRegisteredEmail(data.email);
            // OTP is automatically sent by backend register controller
            setShowOtpModal(true);
            toast.success('Account created! Enter the OTP sent to your email to verify your account.');
        } catch {
            // Error handled in useAuth
        }
    };

    const handleVerifyOtp = async () => {
        if (otpCode.length !== 6) {
            toast.error('Please enter the 6-digit OTP code');
            return;
        }
        setOtpLoading(true);
        try {
            await authService.verifyEmailOtp(otpCode);
            await fetchMe();
            setShowOtpModal(false);
            toast.success('✅ Email verified! Welcome to SkillMatch.lk');
            // Navigate after successful verification
            if (selectedRole === 'worker') router.push('/dashboard/worker');
            else router.push('/dashboard/customer');
        } catch {
            toast.error('Invalid or expired OTP. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResendLoading(true);
        try {
            await authService.resendVerificationEmail();
            toast.success('New OTP and link sent to your email!');
            setOtpCode('');
        } catch {
            toast.error('Failed to resend OTP. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl">
                        <span className="text-3xl">🇱🇰</span>
                        <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            SkillMatch.lk
                        </span>
                    </Link>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                        Create your free account today.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Account</h1>

                    {/* Role selection */}
                    <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            I want to... <span className="text-red-500" aria-hidden="true">*</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account type">
                            <button
                                type="button"
                                onClick={() => setValue('role', 'customer')}
                                className={cn(
                                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                                    selectedRole === 'customer'
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                )}
                                role="radio"
                                aria-checked={selectedRole === 'customer'}
                            >
                                <ShoppingBag className={cn('w-6 h-6', selectedRole === 'customer' ? 'text-primary-600' : 'text-gray-400')} aria-hidden="true" />
                                <span className={cn('text-sm font-medium', selectedRole === 'customer' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400')}>
                                    Hire Workers
                                </span>
                                <span className="text-xs text-gray-400">I need services</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setValue('role', 'worker')}
                                className={cn(
                                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                                    selectedRole === 'worker'
                                        ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                )}
                                role="radio"
                                aria-checked={selectedRole === 'worker'}
                            >
                                <Briefcase className={cn('w-6 h-6', selectedRole === 'worker' ? 'text-secondary-600' : 'text-gray-400')} aria-hidden="true" />
                                <span className={cn('text-sm font-medium', selectedRole === 'worker' ? 'text-secondary-700 dark:text-secondary-400' : 'text-gray-600 dark:text-gray-400')}>
                                    Offer Services
                                </span>
                                <span className="text-xs text-gray-400">I provide skills</span>
                            </button>
                        </div>
                        {errors.role && (
                            <p className="text-xs text-red-500 mt-1" role="alert">{errors.role.message}</p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="John Doe"
                            leftIcon={<User className="w-4 h-4" />}
                            error={errors.name?.message}
                            required
                            autoComplete="name"
                            {...register('name')}
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@example.com"
                            leftIcon={<Mail className="w-4 h-4" />}
                            error={errors.email?.message}
                            required
                            autoComplete="email"
                            {...register('email')}
                        />

                        <Input
                            label="Phone Number"
                            type="tel"
                            placeholder="0771234567"
                            leftIcon={<Phone className="w-4 h-4" />}
                            error={errors.phone?.message}
                            hint="Sri Lankan number"
                            required
                            autoComplete="tel"
                            {...register('phone')}
                        />

                        <Input
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min. 6 characters"
                            leftIcon={<Lock className="w-4 h-4" />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="pointer-events-auto text-gray-400 hover:text-gray-600"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            }
                            error={errors.password?.message}
                            hint="Must contain uppercase letter and number"
                            required
                            autoComplete="new-password"
                            {...register('password')}
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="Repeat your password"
                            leftIcon={<Lock className="w-4 h-4" />}
                            error={errors.confirmPassword?.message}
                            required
                            autoComplete="new-password"
                            {...register('confirmPassword')}
                        />

                        <Button type="submit" isLoading={isLoading} fullWidth size="lg">
                            Create Account
                        </Button>
                    </form>

                    <p className="text-center text-xs text-gray-400 mt-4">
                        By creating an account, you agree to our{' '}
                        <Link href="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                    </p>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>

            {/* OTP Verification Modal */}
            <AnimatePresence>
                {showOtpModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 w-full max-w-sm relative"
                        >
                            {/* Close */}
                            <button
                                onClick={() => setShowOtpModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Icon */}
                            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-7 h-7 text-primary-600" />
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
                                Verify Your Email
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                                A 6-digit OTP has been sent to your email. Enter it below to verify{' '}
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{registeredEmail}</span>.
                            </p>

                            {/* OTP Input */}
                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                                    OTP Code
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="• • • • • •"
                                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 transition-colors placeholder:text-gray-300 placeholder:tracking-normal"
                                    aria-label="OTP code"
                                    id="otp-input"
                                />
                            </div>

                            <Button
                                fullWidth
                                onClick={handleVerifyOtp}
                                isLoading={otpLoading}
                                size="lg"
                                className="mb-3"
                            >
                                Verify Email
                            </Button>

                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendLoading}
                                className="w-full flex items-center justify-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={cn('w-3.5 h-3.5', resendLoading && 'animate-spin')} />
                                {resendLoading ? 'Sending...' : 'Resend OTP'}
                            </button>

                            <p className="text-xs text-gray-400 text-center mt-4">
                                You can verify later from your account settings.{' '}
                                <button
                                    onClick={() => {
                                        setShowOtpModal(false);
                                        if (selectedRole === 'worker') router.push('/dashboard/worker');
                                        else router.push('/dashboard/customer');
                                    }}
                                    className="text-primary-600 hover:underline"
                                >
                                    Skip for now
                                </button>
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
