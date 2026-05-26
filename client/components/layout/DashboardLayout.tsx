'use client';
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Menu, X } from 'lucide-react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Navbar />
            <div className="flex pt-16">
                {/* Desktop sidebar */}
                <div className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] flex-shrink-0">
                    <Sidebar />
                </div>

                {/* Mobile sidebar overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Mobile sidebar drawer */}
                <div className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] transform transition-transform duration-300 lg:hidden ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                    <Sidebar />
                </div>

                {/* Main content */}
                <main className="flex-1 min-w-0">
                    {/* Mobile top bar */}
                    <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Toggle sidebar"
                        >
                            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dashboard</span>
                    </div>
                    <div className="p-4 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
