'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, CreditCard, Lock, CheckCircle, Loader2,
    ShieldCheck, Briefcase, AlertCircle, User,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { paymentService } from '@/services/paymentService';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Job, User as UserType } from '@/types';

interface PaymentModalProps {
    job: Job;
    onClose: () => void;
    onSuccess: (jobId: string) => void;
}

type Step = 'summary' | 'method' | 'card' | 'paypal' | 'payhere' | 'processing' | 'success';

function formatCardNumber(value: string) {
    return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
}

export function PaymentModal({ job, onClose, onSuccess }: PaymentModalProps) {
    const [step, setStep] = useState<Step>('summary');
    const [orderData, setOrderData] = useState<any>(null);
    const [isInitiating, setIsInitiating] = useState(false);

    // Card form state
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardError, setCardError] = useState('');

    const wq = (job as any).workerQuotation;
    const worker = job.workerId as UserType;
    const amount = wq?.price || 0;
    const commission = parseFloat((amount * 0.1).toFixed(2));
    const workerPayout = parseFloat((amount - commission).toFixed(2));

    const handleProceedToMethod = async () => {
        setIsInitiating(true);
        try {
            const data = await paymentService.initiatePayment(job._id);
            setOrderData(data.order);
            setStep('method');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to initiate payment');
        } finally {
            setIsInitiating(false);
        }
    };

    const validateCard = () => {
        const rawNum = cardNumber.replace(/\s/g, '');
        if (rawNum.length < 16) return 'Enter a valid 16-digit card number';
        if (!cardName.trim()) return 'Enter the cardholder name';
        const [mm, yy] = expiry.split('/');
        if (!mm || !yy || isNaN(+mm) || isNaN(+yy) || +mm < 1 || +mm > 12) return 'Enter a valid expiry date (MM/YY)';
        if (cvv.length < 3) return 'Enter a valid CVV';
        return '';
    };

    const handlePayNow = async () => {
        if (step === 'card') {
            const err = validateCard();
            if (err) { setCardError(err); return; }
        }
        
        setCardError('');
        const prevStep = step;
        setStep('processing');

        // Simulate processing delay
        await new Promise(res => setTimeout(res, 2800));

        try {
            await paymentService.confirmPayment(job._id, orderData.orderId);
            setStep('success');
            setTimeout(() => {
                onSuccess(job._id);
                onClose();
                toast.success('Payment confirmed! Job is now in progress. 🎉');
            }, 2000);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Payment confirmation failed');
            setStep(prevStep);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                            <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-base">Secure Payment</p>
                            <p className="text-white/70 text-xs">Powered by SkillMatch.lk</p>
                        </div>
                    </div>
                    {step !== 'processing' && step !== 'success' && (
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                            <X className="w-5 h-5 text-white" />
                        </button>
                    )}
                </div>

                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {/* ── STEP 1: Summary ── */}
                        {step === 'summary' && (
                            <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Summary</p>

                                    {/* Job info */}
                                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4">
                                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center">
                                            <Briefcase className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{job.title}</p>
                                            <p className="text-xs text-gray-400">Worker: {worker?.name || 'Worker'}</p>
                                        </div>
                                    </div>

                                    {/* Price breakdown */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-gray-500">
                                            <span>Worker's quoted price</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(amount)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400 text-xs">
                                            <span>Platform fee (10%)</span>
                                            <span>{formatCurrency(commission)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400 text-xs">
                                            <span>Worker receives (90%)</span>
                                            <span className="text-green-600">{formatCurrency(workerPayout)}</span>
                                        </div>
                                        <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white text-base">
                                            <span>Total You Pay</span>
                                            <span className="text-primary-600">{formatCurrency(amount)}</span>
                                        </div>
                                    </div>

                                    {/* Escrow notice */}
                                    <div className="mt-4 flex items-start gap-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3">
                                        <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-blue-700 dark:text-blue-300">
                                            Your payment is held securely until the job is complete. Funds are only released to the worker after you confirm the work is done.
                                        </p>
                                    </div>
                                </div>

                                <Button fullWidth size="lg" isLoading={isInitiating} onClick={handleProceedToMethod} leftIcon={<CreditCard className="w-4 h-4" />}>
                                    Proceed to Payment
                                </Button>
                            </motion.div>
                        )}

                        {/* ── STEP 2: Choose Method ── */}
                        {step === 'method' && (
                            <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Payment Method</p>
                                
                                <div className="space-y-3">
                                    <button onClick={() => setStep('card')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">Credit / Debit Card</p>
                                                <p className="text-xs text-gray-500">Visa, MasterCard, Amex</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-400" />
                                    </button>

                                    <button onClick={() => setStep('paypal')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#003087] transition-colors text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#003087]/10 flex items-center justify-center">
                                                <span className="font-bold text-[#003087] italic text-lg">P</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">PayPal</p>
                                                <p className="text-xs text-gray-500">Fast and secure checkout</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-400" />
                                    </button>

                                    <button onClick={() => setStep('payhere')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-red-500 transition-colors text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                                <span className="font-bold text-red-600 text-xs">PayHere</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">PayHere</p>
                                                <p className="text-xs text-gray-500">Local payment gateway</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                                <Button variant="ghost" fullWidth onClick={() => setStep('summary')}>Back</Button>
                            </motion.div>
                        )}

                        {/* ── STEP 3A: Card Form ── */}
                        {step === 'card' && (
                            <motion.div key="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Card Details</p>

                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2 mb-4 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                            <strong>Demo mode</strong> — Enter any card details.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Card number */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Card Number</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={cardNumber}
                                                    onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                                                    placeholder="1234 5678 9012 3456"
                                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                                                />
                                                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>

                                        {/* Card name */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Cardholder Name</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={cardName}
                                                    onChange={e => setCardName(e.target.value)}
                                                    placeholder="JOHN SILVA"
                                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10 uppercase"
                                                />
                                                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>

                                        {/* Expiry + CVV */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Expiry (MM/YY)</label>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={expiry}
                                                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                                                    placeholder="12/27"
                                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">CVV</label>
                                                <input
                                                    type="password"
                                                    inputMode="numeric"
                                                    value={cvv}
                                                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                    placeholder="•••"
                                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>

                                        {cardError && (
                                            <p className="text-xs text-red-500 flex items-center gap-1">
                                                <AlertCircle className="w-3.5 h-3.5" /> {cardError}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setStep('method')}>Back</Button>
                                    <Button fullWidth onClick={handlePayNow} leftIcon={<Lock className="w-4 h-4" />}>
                                        Pay {formatCurrency(amount)}
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP 3B: PayPal ── */}
                        {step === 'paypal' && (
                            <motion.div key="paypal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center py-6">
                                <div className="w-16 h-16 rounded-full bg-[#003087]/10 mx-auto flex items-center justify-center">
                                    <span className="font-bold text-[#003087] italic text-3xl">P</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pay with PayPal</h3>
                                    <p className="text-sm text-gray-500 mt-1">You will be redirected to PayPal to complete your purchase securely.</p>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button variant="outline" onClick={() => setStep('method')}>Cancel</Button>
                                    <Button fullWidth className="bg-[#003087] hover:bg-[#00205b] text-white" onClick={handlePayNow}>
                                        Continue to PayPal
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP 3C: PayHere ── */}
                        {step === 'payhere' && (
                            <motion.div key="payhere" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center py-6">
                                <div className="w-16 h-16 rounded-full bg-red-50 mx-auto flex items-center justify-center">
                                    <span className="font-bold text-red-600 text-sm">PayHere</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pay with PayHere</h3>
                                    <p className="text-sm text-gray-500 mt-1">Supports local banks, Frimi, Genie, eZ Cash, and mCash.</p>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button variant="outline" onClick={() => setStep('method')}>Cancel</Button>
                                    <Button fullWidth className="bg-red-600 hover:bg-red-700 text-white" onClick={handlePayNow}>
                                        Proceed with PayHere
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP 4: Processing ── */}
                        {step === 'processing' && (
                            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 flex flex-col items-center gap-4 text-center">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">Processing Payment…</p>
                                    <p className="text-sm text-gray-500 mt-1">Please wait, do not close this window.</p>
                                </div>
                                <div className="flex flex-col gap-2 text-xs text-gray-400 mt-2">
                                    <p>✓ Verifying details</p>
                                    <p>✓ Contacting gateway</p>
                                    <p className="opacity-50">⟳ Confirming transaction…</p>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP 5: Success ── */}
                        {step === 'success' && (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="py-10 flex flex-col items-center gap-4 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                    className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center"
                                >
                                    <CheckCircle className="w-14 h-14 text-green-500" />
                                </motion.div>
                                <div>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">Payment Successful!</p>
                                    <p className="text-sm text-gray-500 mt-1">The job is now in progress.</p>
                                    <p className="text-xs text-gray-400 mt-2">{formatCurrency(amount)} held securely in escrow</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
