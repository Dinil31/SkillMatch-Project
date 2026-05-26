'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, TrendingUp, Clock, ArrowUpCircle, DollarSign,
    Banknote, X, Building2, CreditCard, User, CheckCircle,
    AlertCircle, ChevronDown, ArrowDownCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { paymentService } from '@/services/paymentService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { WithdrawalRequest, BankDetails } from '@/types';
import toast from 'react-hot-toast';

const SRI_LANKA_BANKS = [
    'Bank of Ceylon', 'People\'s Bank', 'Commercial Bank', 'Hatton National Bank',
    'Sampath Bank', 'Seylan Bank', 'NTB', 'DFCC Bank', 'Nations Trust Bank',
    'Pan Asia Bank', 'Amana Bank', 'MCB Bank', 'Cargills Bank', 'Union Bank',
    'Other',
];

const statusConfig = {
    pending:    { label: 'Pending Review',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',  icon: Clock },
    processing: { label: 'Processing',       color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',      icon: Clock },
    completed:  { label: 'Transferred',      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',  icon: CheckCircle },
    rejected:   { label: 'Rejected',         color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',          icon: AlertCircle },
} as const;

export default function WorkerEarningsPage() {
    const [wallet, setWallet]         = useState<any>(null);
    const [isLoading, setIsLoading]   = useState(true);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [showModal, setShowModal]   = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bank form state
    const [amount, setAmount]                     = useState('');
    const [bankName, setBankName]                 = useState('');
    const [accountNumber, setAccountNumber]       = useState('');
    const [branchName, setBranchName]             = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');
    const [saveDetails, setSaveDetails]           = useState(true);
    const [showHistory, setShowHistory]           = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const [walletData, wdData, bankData] = await Promise.allSettled([
                paymentService.getWallet(),
                paymentService.getMyWithdrawals(),
                paymentService.getBankDetails(),
            ]);
            if (walletData.status === 'fulfilled') setWallet(walletData.value.wallet);
            if (wdData.status === 'fulfilled') setWithdrawals(wdData.value.requests || []);
            if (bankData.status === 'fulfilled' && bankData.value.bankDetails) {
                const bd: BankDetails = bankData.value.bankDetails;
                if (bd.bankName) setBankName(bd.bankName);
                if (bd.accountNumber) setAccountNumber(bd.accountNumber);
                if (bd.branchName) setBranchName(bd.branchName);
                if (bd.accountHolderName) setAccountHolderName(bd.accountHolderName);
            }
        } catch {
            // fallback handled per-promise
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleRequestPayout = () => {
        if (!wallet?.balance || wallet.balance <= 0) {
            toast.error('No available balance to withdraw.');
            return;
        }
        setAmount(String(wallet.balance));
        setShowModal(true);
    };

    const handleSubmitWithdrawal = async () => {
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount < 100) { toast.error('Minimum withdrawal is LKR 100'); return; }
        if (numAmount > (wallet?.balance || 0)) { toast.error('Amount exceeds available balance'); return; }
        if (!bankName) { toast.error('Please select a bank'); return; }
        if (!accountNumber) { toast.error('Please enter your account number'); return; }
        if (!branchName) { toast.error('Please enter branch name'); return; }
        if (!accountHolderName) { toast.error('Please enter account holder name'); return; }

        setIsSubmitting(true);
        try {
            await paymentService.requestWithdrawal({
                amount: numAmount, bankName, accountNumber, branchName, accountHolderName, saveDetails,
            });
            toast.success('Withdrawal request submitted! Admin will process it within 1–2 business days.');
            setShowModal(false);
            await load(); // refresh wallet + history
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to submit withdrawal request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const stats = [
        {
            label: 'Available Balance', value: wallet?.balance || 0,
            icon: Wallet, gradient: 'from-green-400 to-emerald-600',
            bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400',
            sub: 'Ready to withdraw', action: true,
        },
        {
            label: 'Pending (In Escrow)', value: wallet?.pendingBalance || 0,
            icon: Clock, gradient: 'from-yellow-400 to-amber-600',
            bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400',
            sub: 'Released on job completion',
        },
        {
            label: 'Total Earned', value: wallet?.totalEarned || 0,
            icon: TrendingUp, gradient: 'from-blue-400 to-indigo-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400',
            sub: 'All time earnings',
        },
        {
            label: 'Total Withdrawn', value: wallet?.totalWithdrawn || 0,
            icon: ArrowUpCircle, gradient: 'from-purple-400 to-violet-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400',
            sub: 'Successfully paid out',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Earnings</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track your wallet balance and manage withdrawals</p>
                </div>

                {/* Stats */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} height={140} className="rounded-2xl" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((stat, i) => (
                            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                <Card className="overflow-hidden h-full">
                                    <div className={`h-1.5 bg-gradient-to-r ${stat.gradient} -mx-6 -mt-6 mb-5 rounded-t-2xl`} />
                                    <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                                        <stat.icon className={`w-6 h-6 ${stat.text}`} />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stat.value)}</p>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">{stat.label}</p>
                                    <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                                    {stat.action && (
                                        <Button size="sm" className="mt-3" onClick={handleRequestPayout} leftIcon={<Banknote className="w-3.5 h-3.5" />}>
                                            Request Withdrawal
                                        </Button>
                                    )}
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* How earnings work */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl px-5 py-4 flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-semibold mb-1">How earnings work</p>
                        <p>SkillMatch.lk takes a <strong>10% platform commission</strong>. You receive <strong>90%</strong> of each quoted price. Funds are held securely until the customer confirms job completion, then released to your wallet. Withdrawals are processed within 1–2 business days and a payment slip is emailed to you.</p>
                    </div>
                </div>

                {/* Withdrawal History */}
                <div>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-3 hover:text-primary-600 transition-colors"
                    >
                        <ArrowDownCircle className="w-5 h-5" />
                        Withdrawal History
                        <ChevronDown className={cn('w-4 h-4 transition-transform', showHistory && 'rotate-180')} />
                    </button>
                    {showHistory && (
                        <div className="space-y-2">
                            {!withdrawals.length ? (
                                <Card>
                                    <div className="flex flex-col items-center py-10 text-center">
                                        <Banknote className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                                        <p className="text-sm text-gray-400">No withdrawal requests yet</p>
                                    </div>
                                </Card>
                            ) : withdrawals.map((wd, i) => {
                                const cfg = statusConfig[wd.status] || statusConfig.pending;
                                const StatusIcon = cfg.icon;
                                return (
                                    <motion.div key={wd._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                                        <Card>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                                    <Banknote className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{wd.bankName} — {wd.accountHolderName}</p>
                                                    <p className="text-xs text-gray-400">{wd.branchName} · ****{wd.accountNumber.slice(-4)} · {formatDate(wd.createdAt)}</p>
                                                    {wd.transactionRef && (
                                                        <p className="text-xs text-green-600 dark:text-green-400 font-mono mt-0.5">Ref: {wd.transactionRef}</p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(wd.amount)}</p>
                                                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', cfg.color)}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Transaction History */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Wallet Transactions</h2>
                    {isLoading ? (
                        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} height={64} className="rounded-xl" />)}</div>
                    ) : !wallet?.transactions?.length ? (
                        <Card>
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Wallet className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No transactions yet</h3>
                                <p className="text-sm text-gray-400">Complete jobs to start earning!</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {[...wallet.transactions].reverse().map((tx: any, i: number) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                    <Card>
                                        <div className="flex items-center gap-4">
                                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', tx.type === 'withdrawal' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20')}>
                                                {tx.type === 'withdrawal'
                                                    ? <ArrowUpCircle className="w-5 h-5 text-red-400" />
                                                    : <ArrowUpCircle className="w-5 h-5 text-green-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{tx.jobId?.title || 'Transaction'}</p>
                                                <p className="text-xs text-gray-400">{tx.description} · {formatDate(tx.date)}</p>
                                            </div>
                                            <p className={cn('font-bold flex-shrink-0', tx.type === 'withdrawal' ? 'text-red-500' : 'text-green-600 dark:text-green-400')}>
                                                {tx.type === 'withdrawal' ? '−' : '+'}{formatCurrency(tx.amount)}
                                            </p>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Withdrawal Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                        <Banknote className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Request Withdrawal</h2>
                                        <p className="text-xs text-gray-400">Available: {formatCurrency(wallet?.balance || 0)}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" aria-label="Close">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Withdrawal Amount (LKR) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">LKR</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            max={wallet?.balance || 0}
                                            min={100}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="0"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setAmount(String(wallet?.balance || 0))}
                                        className="text-xs text-primary-600 hover:underline mt-1"
                                    >
                                        Withdraw full balance ({formatCurrency(wallet?.balance || 0)})
                                    </button>
                                </div>

                                <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5" /> Bank Details
                                    </p>

                                    {/* Bank Name */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Bank Name <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={bankName}
                                            onChange={e => setBankName(e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">Select your bank</option>
                                            {SRI_LANKA_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>

                                    {/* Account Holder */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Account Holder Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={accountHolderName}
                                                onChange={e => setAccountHolderName(e.target.value)}
                                                placeholder="Full name as on bank account"
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Account Number */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Account Number <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={accountNumber}
                                                onChange={e => setAccountNumber(e.target.value)}
                                                placeholder="e.g. 123456789"
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Branch */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Branch Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={branchName}
                                                onChange={e => setBranchName(e.target.value)}
                                                placeholder="e.g. Colombo 03"
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Save details checkbox */}
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={saveDetails}
                                        onChange={e => setSaveDetails(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Save bank details for future withdrawals
                                    </span>
                                </label>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                                <Button variant="outline" onClick={() => setShowModal(false)} fullWidth>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmitWithdrawal} isLoading={isSubmitting} fullWidth leftIcon={<Banknote className="w-4 h-4" />}>
                                    Submit Request
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
