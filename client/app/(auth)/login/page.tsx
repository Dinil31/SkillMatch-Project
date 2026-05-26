'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormValues } from '@/lib/validations';

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading } = useAuth();

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        await login(data.email, data.password);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
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
                        Welcome back! Sign in to your account.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Sign In</h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

                        <div className="relative">
                            <Input
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
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
                                required
                                autoComplete="current-password"
                                {...register('password')}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button type="submit" isLoading={isLoading} fullWidth size="lg">
                            Sign In
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        <span className="text-xs text-gray-400">or</span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/register"
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                        >
                            Create one free
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
