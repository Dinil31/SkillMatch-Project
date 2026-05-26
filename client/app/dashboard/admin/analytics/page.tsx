'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Briefcase, Star, DollarSign, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { dummyCategories } from '@/lib/dummyData';

const monthlyData = [
    { month: 'Nov', jobs: 210, revenue: 1850000, users: 89 },
    { month: 'Dec', jobs: 280, revenue: 2400000, users: 124 },
    { month: 'Jan', jobs: 320, revenue: 2900000, users: 156 },
    { month: 'Feb', jobs: 290, revenue: 2650000, users: 143 },
    { month: 'Mar', jobs: 410, revenue: 3700000, users: 198 },
    { month: 'Apr', jobs: 480, revenue: 4200000, users: 231 },
];

const maxJobs = Math.max(...monthlyData.map(d => d.jobs));
const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));
const maxUsers = Math.max(...monthlyData.map(d => d.users));

const topCategories = dummyCategories.slice(0, 8).map((c, i) => ({
    ...c, jobs: [124, 89, 76, 67, 58, 52, 48, 43][i] ?? 30,
}));
const maxCatJobs = Math.max(...topCategories.map(c => c.jobs));

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07 } }) };

export default function AdminAnalyticsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-primary-600" /> Analytics
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform performance and insights</p>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Revenue', value: formatCurrency(18450000), change: '+18%', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
                        { label: 'Monthly Active Users', value: '3,241', change: '+12%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
                        { label: 'Jobs This Month', value: '480', change: '+17%', icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
                        { label: 'Avg. Rating', value: '4.8 ★', change: '+0.2', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
                    ].map((kpi, i) => (
                        <motion.div key={kpi.label} variants={fadeUp} initial="hidden" animate="show" custom={i}>
                            <Card className="hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                                        <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                                    </div>
                                    <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-full">{kpi.change}</span>
                                </div>
                                <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{kpi.value}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{kpi.label}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Monthly jobs bar chart */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <CardTitle>Monthly Jobs (Last 6 Months)</CardTitle>
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                            {monthlyData[0].month} – {monthlyData[monthlyData.length - 1].month} {new Date().getFullYear()}
                        </span>
                    </div>
                    <div className="flex items-end gap-3 h-48">
                        {monthlyData.map((d, i) => (
                            <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{d.jobs}</span>
                                <motion.div className="w-full rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400"
                                    initial={{ height: 0 }} animate={{ height: `${(d.jobs / maxJobs) * 160}px` }}
                                    transition={{ duration: 0.6, delay: i * 0.08 }} />
                                <span className="text-xs text-gray-400">{d.month}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue chart */}
                    <Card>
                        <CardTitle className="mb-6">Monthly Revenue</CardTitle>
                        <div className="flex items-end gap-3 h-40">
                            {monthlyData.map((d, i) => (
                                <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                                    <motion.div className="w-full rounded-t-lg bg-gradient-to-t from-green-600 to-green-400"
                                        initial={{ height: 0 }} animate={{ height: `${(d.revenue / maxRevenue) * 128}px` }}
                                        transition={{ duration: 0.6, delay: i * 0.08 }} />
                                    <span className="text-xs text-gray-400">{d.month}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between text-sm">
                            <span className="text-gray-500">Total (6 months)</span>
                            <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(monthlyData.reduce((a, d) => a + d.revenue, 0))}</span>
                        </div>
                    </Card>

                    {/* New users chart */}
                    <Card>
                        <CardTitle className="mb-6">New User Registrations</CardTitle>
                        <div className="flex items-end gap-3 h-40">
                            {monthlyData.map((d, i) => (
                                <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{d.users}</span>
                                    <motion.div className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-purple-400"
                                        initial={{ height: 0 }} animate={{ height: `${(d.users / maxUsers) * 112}px` }}
                                        transition={{ duration: 0.6, delay: i * 0.08 }} />
                                    <span className="text-xs text-gray-400">{d.month}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between text-sm">
                            <span className="text-gray-500">Total new users</span>
                            <span className="font-bold text-gray-900 dark:text-white">{monthlyData.reduce((a, d) => a + d.users, 0).toLocaleString()}</span>
                        </div>
                    </Card>
                </div>

                {/* Top categories */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <CardTitle>Top Categories by Jobs</CardTitle>
                        <TrendingUp className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="space-y-3">
                        {topCategories.map((cat, i) => (
                            <motion.div key={cat.name} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg w-8 text-center">{cat.icon}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{cat.jobs} jobs</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div className={`h-full rounded-full bg-gradient-to-r ${cat.color}`}
                                                initial={{ width: 0 }} whileInView={{ width: `${(cat.jobs / maxCatJobs) * 100}%` }}
                                                viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.06 }} />
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 w-10 text-right">{Math.round((cat.jobs / maxCatJobs) * 100)}%</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
