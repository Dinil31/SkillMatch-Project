import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface QuotationModalProps {
    onClose: () => void;
    onSubmit: (data: { budget: number, deliveryTime: number, deliveryUnit: string, description: string }) => void;
    isSubmitting: boolean;
}

export function QuotationModal({ onClose, onSubmit, isSubmitting }: QuotationModalProps) {
    const [budget, setBudget] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('1');
    const [deliveryUnit, setDeliveryUnit] = useState('days');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            budget: Number(budget),
            deliveryTime: Number(deliveryTime),
            deliveryUnit,
            description
        });
    };

    return (
        <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center p-4 rounded-2xl" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-sm p-4 shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white">Send Quotation</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Budget (LKR)</label>
                        <input
                            type="number"
                            required
                            min="100"
                            value={budget}
                            onChange={e => setBudget(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g. 5000"
                        />
                    </div>
                    
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Time</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={deliveryTime}
                                onChange={e => setDeliveryTime(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
                            <select
                                value={deliveryUnit}
                                onChange={e => setDeliveryUnit(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                                <option value="weeks">Weeks</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Details</label>
                        <textarea
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 resize-none h-20"
                            placeholder="What's included..."
                        />
                    </div>
                    
                    <div className="pt-2">
                        <Button type="submit" fullWidth isLoading={isSubmitting}>
                            Send Quotation
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
