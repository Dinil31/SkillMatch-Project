'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowRight, Search, Star, Shield, Zap, Users,
    CheckCircle, MessageSquare, CreditCard, MapPin,
    Clock, TrendingUp, Award, ChevronRight,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import {
    dummyCategories, dummyStats, dummyReviews
} from '@/lib/dummyData';
import { formatCurrency, formatRating } from '@/lib/utils';
import type { User, WorkerProfile, Gig } from '@/types';
import { workerService } from '@/services/workerService';
import { gigService } from '@/services/gigService';
import { reviewService } from '@/services/reviewService';
import { useEffect } from 'react';

const SRI_LANKA_DISTRICTS = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Moneragala', 'Ratnapura', 'Kegalle'
];

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } }),
};

const steps = [
    { step: '01', icon: Search, title: 'Search & Discover', description: 'Browse thousands of verified professionals or post your job requirements.' },
    { step: '02', icon: MessageSquare, title: 'Connect & Discuss', description: 'Chat directly with workers, discuss your project, and agree on terms.' },
    { step: '03', icon: CreditCard, title: 'Hire & Pay Safely', description: "Hire with confidence. Payment is only released when you're satisfied." },
];

export default function HomePage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [location, setLocation] = useState('');
    const [workers, setWorkers] = useState<WorkerProfile[]>([]);
    const [gigs, setGigs] = useState<Gig[]>([]);
    const [topReviews, setTopReviews] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const workersRes = await workerService.getWorkers({ limit: 6 });
                if (workersRes.success) setWorkers(workersRes.workers || []);
                
                const gigsRes = await gigService.getGigs({ limit: 6 });
                if (gigsRes.success) setGigs(gigsRes.gigs || []);

                const reviewsRes = await reviewService.getPublicTopReviews();
                if (reviewsRes.success) setTopReviews(reviewsRes.reviews || []);
            } catch (err) {
                console.error("Failed to load home page data:", err);
            }
        };
        load();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search.trim()) params.append('search', search.trim());
        if (location.trim()) params.append('location', location.trim());
        
        if (params.toString()) {
            router.push(`/gigs?${params.toString()}`);
        } else {
            router.push('/gigs');
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <Navbar />

            {/* ── ULTRA MINIMAL HERO ─────────────────────────────────────────────────────────── */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
                {/* Subtle Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                
                {/* Soft Glowing Orb */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="flex justify-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md shadow-sm">
                            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Over 10,000 verified pros</span>
                        </div>
                    </motion.div>

                    <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
                        className="text-6xl sm:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.95] mb-8">
                        The modern way <br className="hidden sm:block" />
                        to <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary-600 to-blue-500">hire talent.</span>
                    </motion.h1>

                    <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
                        className="text-xl sm:text-2xl text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium tracking-tight">
                        Connect with top-tier professionals across Sri Lanka. High quality work, secure payments, zero friction.
                    </motion.p>

                    {/* Search Component */}
                    <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="max-w-3xl mx-auto">
                        <form onSubmit={handleSearch} className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-blue-500 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                            <div className="relative flex flex-col sm:flex-row items-center bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800 rounded-2xl sm:rounded-full p-2 shadow-2xl sm:divide-x divide-gray-200 dark:divide-gray-800 gap-2 sm:gap-0">
                                <div className="flex-1 flex items-center px-4 w-full py-2 sm:py-0">
                                    <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="What do you need help with?"
                                        className="w-full bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 text-base focus:ring-0 outline-none"
                                    />
                                </div>
                                <div className="flex-1 flex items-center px-4 w-full py-2 sm:py-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 pt-3 sm:pt-0">
                                    <MapPin className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                                    <select
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        className="w-full bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 text-base focus:ring-0 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled hidden>Select Location</option>
                                        <option value="">Anywhere in Sri Lanka</option>
                                        {SRI_LANKA_DISTRICTS.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <Button type="submit" size="lg" className="w-full sm:w-auto rounded-xl sm:rounded-full px-8 py-3 text-base font-semibold shadow-none sm:ml-2 mt-2 sm:mt-0">
                                    Search
                                </Button>
                            </div>
                        </form>
                    </motion.div>

                    {/* Tags */}
                    <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}
                        className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-gray-400">
                        {['Web Development', 'UI/UX Design', 'Plumbing', 'Electrician'].map(tag => (
                            <button key={tag} onClick={() => router.push(`/gigs?search=${encodeURIComponent(tag)}`)}
                                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                {tag}
                            </button>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── STATS BAR ────────────────────────────────────────────────────── */}
            <section className="py-14 bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {dummyStats.map((stat, i) => (
                            <motion.div key={stat.label} variants={fadeUp} initial="hidden" whileInView="show"
                                viewport={{ once: true }} custom={i} className="text-center">
                                <div className="text-3xl mb-1">{stat.icon}</div>
                                <p className="text-3xl sm:text-4xl font-extrabold text-primary-600 dark:text-primary-400 tracking-tight">
                                    {stat.value}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CATEGORIES ───────────────────────────────────────────────────── */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                        className="flex items-end justify-between mb-10">
                        <div>
                            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2">Explore</p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Browse by Category</h2>
                        </div>
                        <Link href="/gigs" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:gap-2 transition-all">
                            View all <ChevronRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {dummyCategories.map((cat, i) => (
                            <motion.div key={cat.name} variants={fadeUp} initial="hidden" whileInView="show"
                                viewport={{ once: true }} custom={i * 0.5}>
                                <Link href={`/gigs?category=${encodeURIComponent(cat.name)}`}
                                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-sm`}>
                                        {cat.icon}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
                                            {cat.name}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">{cat.count} gigs</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURED WORKERS ─────────────────────────────────────────────── */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                        className="flex items-end justify-between mb-10">
                        <div>
                            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2">Top Talent</p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Featured Workers</h2>
                        </div>
                        <Link href="/workers" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:gap-2 transition-all">
                            See all workers <ChevronRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workers.length === 0 ? (
                            <p className="text-gray-500 col-span-full text-center">No featured workers found.</p>
                        ) : workers.map((worker, i) => {
                            const user = worker.userId as User;
                            return (
                                <motion.div key={worker._id} variants={fadeUp} initial="hidden" whileInView="show"
                                    viewport={{ once: true }} custom={i * 0.5}
                                    className="group bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    {/* top row */}
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="relative shrink-0">
                                            <Avatar src={user?.profileImage} name={user?.name} size="lg" />
                                            {worker.isVerified && (
                                                <span className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white dark:border-gray-950">
                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{user?.name}</h3>
                                                    <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{worker.category}</p>
                                                </div>
                                                <Badge variant={worker.availability === 'available' ? 'success' : 'warning'} dot size="sm">
                                                    {worker.availability}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1 mt-1.5">
                                                {[...Array(5)].map((_, s) => (
                                                    <Star key={s} className={`w-3.5 h-3.5 ${s < Math.round(worker.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-700'}`} />
                                                ))}
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1">{formatRating(worker.averageRating)}</span>
                                                <span className="text-xs text-gray-400">({worker.totalReviews})</span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">{worker.bio}</p>

                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {worker.skills.slice(0, 4).map(skill => (
                                            <span key={skill} className="text-xs px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                        {worker.skills.length > 4 && (
                                            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">
                                                +{worker.skills.length - 4}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-5">
                                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{worker.location.city}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{worker.completedJobs} jobs</span>
                                        <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{worker.experience}y exp</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div>
                                            <p className="text-xs text-gray-400">Starting from</p>
                                            <p className="text-base font-extrabold text-gray-900 dark:text-white">
                                                {formatCurrency(worker.hourlyRate)}<span className="text-xs font-normal text-gray-400">/hr</span>
                                            </p>
                                        </div>
                                        <Link href={`/workers/${user?._id}`}>
                                            <Button size="sm" className="group-hover:bg-primary-700 transition-colors">View Profile</Button>
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── FEATURED GIGS ────────────────────────────────────────────────── */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                        className="flex items-end justify-between mb-10">
                        <div>
                            <p className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-widest mb-2">Marketplace</p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Popular Gigs</h2>
                        </div>
                        <Link href="/gigs" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:gap-2 transition-all">
                            Browse all gigs <ChevronRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gigs.length === 0 ? (
                            <p className="text-gray-500 col-span-full text-center">No popular gigs found.</p>
                        ) : gigs.map((gig, i) => {
                            const user = gig.workerId as User;
                            return (
                                <motion.div key={gig._id} variants={fadeUp} initial="hidden" whileInView="show"
                                    viewport={{ once: true }} custom={i * 0.5}
                                    className="group bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    {/* image */}
                                    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-950 dark:to-secondary-950">
                                        {gig.images[0] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={gig.images[0]} alt={gig.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-5xl">🎯</div>
                                        )}
                                        <div className="absolute top-3 left-3">
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300 backdrop-blur-sm">
                                                {gig.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug mb-3 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                            {gig.title}
                                        </h3>

                                        <div className="flex items-center gap-2 mb-4">
                                            <Avatar src={user?.profileImage} name={user?.name} size="xs" />
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{user?.name}</span>
                                            {user?.isVerified && <CheckCircle className="w-3.5 h-3.5 text-blue-500" />}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                                            <span className="flex items-center gap-1">
                                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                {formatRating(gig.workerRating ?? 0)} ({gig.workerReviewsCount ?? 0})
                                            </span>
                                            <span>•</span>
                                            <span>{gig.totalOrders} orders</span>
                                            <span>•</span>
                                            <span>{gig.deliveryTime}d delivery</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                                            <div>
                                                <p className="text-xs text-gray-400">Starting at</p>
                                                <p className="text-base font-extrabold text-gray-900 dark:text-white">{formatCurrency(gig.price)}</p>
                                            </div>
                                            <Link href={`/gigs/${gig._id}`}>
                                                <Button size="sm" variant="outline">View Gig</Button>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                        className="text-center mb-14">
                        <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2">Simple Process</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">How It Works</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* connector line */}
                        <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 dark:from-primary-900 dark:via-primary-700 dark:to-primary-900" />

                        {steps.map((step, i) => (
                            <motion.div key={step.step} variants={fadeUp} initial="hidden" whileInView="show"
                                viewport={{ once: true }} custom={i} className="relative text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 text-white mb-5 shadow-lg shadow-primary-200 dark:shadow-primary-900/50 relative z-10">
                                    <step.icon className="w-8 h-8" />
                                </div>
                                <span className="block text-xs font-bold text-primary-400 uppercase tracking-widest mb-2">Step {step.step}</span>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── WHY SKILLMATCH ───────────────────────────────────────────────── */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                        className="text-center mb-14">
                        <p className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-widest mb-2">Why Us</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Why Choose SkillMatch.lk?</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Shield, title: 'Verified Professionals', desc: 'Every worker is background-checked and identity-verified before joining.', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
                            { icon: Zap, title: 'Fast Matching', desc: 'Our smart algorithm connects you with the right professional in minutes.', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
                            { icon: Award, title: 'Quality Guaranteed', desc: 'Read real reviews from verified customers before making your decision.', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
                            { icon: Users, title: 'Local Talent', desc: 'Support local Sri Lankan professionals and grow the economy together.', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
                        ].map((f, i) => (
                            <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="show"
                                viewport={{ once: true }} custom={i}
                                className="p-6 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                                    <f.icon className={`w-6 h-6 ${f.color}`} />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>



            {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                        className="text-center mb-14">
                        <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2">Testimonials</p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">What People Say About Us</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {topReviews.map((review, i) => {
                            const customer = review.customerId as any;
                            return (
                                <motion.div key={review._id} variants={fadeUp} initial="hidden" whileInView="show"
                                    viewport={{ once: true }} custom={i}
                                    className="bg-white dark:bg-gray-950 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative"
                                >
                                    <div className="flex items-center gap-1 mb-6">
                                        {[...Array(5)].map((_, j) => (
                                            <Star key={j} className={`w-5 h-5 ${j < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-700'}`} />
                                        ))}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 mb-8 italic leading-relaxed text-sm">
                                        "{review.comment}"
                                    </p>
                                    <div className="flex items-center gap-4 mt-auto">
                                        <Avatar src={customer?.profileImage} name={customer?.name} size="md" />
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{customer?.name}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Verified Customer</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────────────────── */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700" />
                <div className="absolute inset-0 opacity-[0.06]"
                    style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl" />

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
                            Ready to Get Started?
                        </h2>
                        <p className="text-white/75 text-lg mb-10 max-w-xl mx-auto">
                            Join 12,000+ customers and workers already using SkillMatch.lk to get things done.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/register">
                                <Button size="lg"
                                    className="bg-white text-primary-700 hover:bg-gray-50 shadow-xl font-bold px-8 rounded-2xl">
                                    Create Free Account <ArrowRight className="w-5 h-5" />
                                </Button>
                            </Link>
                            <Link href="/workers">
                                <Button size="lg" variant="outline"
                                    className="border-white/40 text-white hover:bg-white/10 rounded-2xl px-8">
                                    Browse Workers
                                </Button>
                            </Link>
                        </div>
                        <p className="text-white/50 text-sm mt-6">No credit card required · Free to join</p>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
