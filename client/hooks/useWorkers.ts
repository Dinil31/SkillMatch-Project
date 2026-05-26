'use client';

import { useState, useEffect, useCallback } from 'react';
import { workerService } from '@/services/workerService';
import type { WorkerProfile, WorkerFilters } from '@/types';

interface UseWorkersReturn {
    workers: WorkerProfile[];
    isLoading: boolean;
    error: string | null;
    total: number;
    pages: number;
    currentPage: number;
    refetch: () => void;
    setFilters: (filters: WorkerFilters) => void;
}

export function useWorkers(initialFilters: WorkerFilters = {}): UseWorkersReturn {
    const [workers, setWorkers] = useState<WorkerProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFiltersState] = useState<WorkerFilters>(initialFilters);

    const fetchWorkers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await workerService.getWorkers(filters);
            setWorkers(data.workers || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
            setCurrentPage(data.currentPage || 1);
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Failed to load workers';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    const setFilters = useCallback((newFilters: WorkerFilters) => {
        setFiltersState((prev) => ({ ...prev, ...newFilters, page: 1 }));
    }, []);

    return {
        workers,
        isLoading,
        error,
        total,
        pages,
        currentPage,
        refetch: fetchWorkers,
        setFilters,
    };
}
