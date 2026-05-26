'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Ban, Trash2, RefreshCw, Filter, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { User } from '@/types';



export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const LIMIT = 10;

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const { default: api } = await import('@/services/api');
            const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
            if (search) params.set('search', search);
            if (roleFilter) params.set('role', roleFilter);
            if (statusFilter) params.set('status', statusFilter);
            const res = await api.get(`/admin/users?${params}`);
            setUsers(res.data.users);
            setTotal(res.data.total);
        } catch {
            setUsers([]);
            setTotal(0);
        } finally {
            setIsLoading(false);
        }
    }, [page, search, roleFilter, statusFilter]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const handleBan = async (userId: string, currentStatus: string) => {
        setActionLoading(userId);
        try {
            const { default: api } = await import('@/services/api');
            await api.put(`/admin/users/${userId}/ban`);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: currentStatus === 'banned' ? 'active' : 'banned' } : u));
            toast.success(currentStatus === 'banned' ? 'User unbanned' : 'User banned');
        } catch {
            toast.error('Action failed. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId: string) => {
        setActionLoading(userId);
        try {
            const { default: api } = await import('@/services/api');
            await api.delete(`/admin/users/${userId}`);
            setUsers(prev => prev.filter(u => u._id !== userId));
            toast.success('User deleted');
        } catch {
            toast.error('Failed to delete user.');
        } finally {
            setActionLoading(null);
            setConfirmDelete(null);
        }
    };

    const pages = Math.ceil(total / LIMIT);

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} total users</p>
                    </div>
                    <Button size="sm" variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={loadUsers}>Refresh</Button>
                </div>

                {/* Filters */}
                <Card padding="sm">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Search by name or email..."
                                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div className="flex gap-2">
                            <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                                className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option value="">All Roles</option>
                                <option value="customer">Customer</option>
                                <option value="worker">Worker</option>
                                <option value="admin">Admin</option>
                            </select>
                            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="banned">Banned</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Table */}
                <Card padding="none">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Verified</th>
                                    <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {isLoading ? (
                                    [...Array(6)].map((_, i) => (
                                        <tr key={i}><td colSpan={6} className="px-6 py-3"><Skeleton height={40} className="rounded-lg" /></td></tr>
                                    ))
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No users found</td></tr>
                                ) : (
                                    users.map((user, i) => (
                                        <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={user.profileImage} name={user.name} size="sm" />
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                                        <p className="text-xs text-gray-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge variant={user.role === 'worker' ? 'secondary' : user.role === 'admin' ? 'danger' : 'primary'} size="sm">
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge variant={user.status === 'active' ? 'success' : user.status === 'banned' ? 'danger' : 'warning'} dot size="sm">
                                                    {user.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4">
                                                {user.isVerified
                                                    ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><UserCheck className="w-3.5 h-3.5" />Verified</span>
                                                    : <span className="flex items-center gap-1 text-gray-400 text-xs"><UserX className="w-3.5 h-3.5" />Unverified</span>}
                                            </td>
                                            <td className="px-4 py-4 text-gray-500 dark:text-gray-400 text-xs">{formatDate(user.createdAt)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {confirmDelete === user._id ? (
                                                        <>
                                                            <span className="text-xs text-red-600 font-medium">Confirm?</span>
                                                            <Button size="sm" variant="danger" isLoading={actionLoading === user._id}
                                                                onClick={() => handleDelete(user._id)}>Yes</Button>
                                                            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>No</Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button size="sm" variant={user.status === 'banned' ? 'outline' : 'ghost'}
                                                                isLoading={actionLoading === user._id}
                                                                leftIcon={<Ban className="w-3.5 h-3.5" />}
                                                                onClick={() => handleBan(user._id, user.status)}
                                                                className={user.status === 'banned' ? 'text-green-600 border-green-300' : 'text-orange-600 hover:bg-orange-50'}>
                                                                {user.status === 'banned' ? 'Unban' : 'Ban'}
                                                            </Button>
                                                            {user.role !== 'admin' && (
                                                                <Button size="sm" variant="ghost" leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                                                                    onClick={() => setConfirmDelete(user._id)}
                                                                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                                                                    Delete
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-sm text-gray-500">Page {page} of {pages}</p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                    leftIcon={<ChevronLeft className="w-4 h-4" />}>Prev</Button>
                                <Button size="sm" variant="outline" disabled={page === pages} onClick={() => setPage(p => p + 1)}
                                    rightIcon={<ChevronRight className="w-4 h-4" />}>Next</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
