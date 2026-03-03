import { useState, useMemo, useCallback } from 'react';

/**
 * Hook: useTableProcessing
 * Pure math: filtering + sorting + counts.
 * Everything wrapped in useMemo — zero network calls.
 */
const useTableProcessing = (rawLeads) => {
    const [filters, setFilters] = useState({
        onlyWordPress: false,
        onlyWithEmail: false,
        onlyHighTicket: false,
        onlyAds: false,
        excludeZombies: false,
        performance: 'all',
    });

    const [sortConfig, setSortConfig] = useState({ key: 'leadOpportunityScore', direction: 'desc' });

    // Heavy computation: filter → sort (memoized)
    const processedLeads = useMemo(() => {
        let result = [...rawLeads].filter(lead => {
            if (filters.onlyWordPress) {
                if (!lead.tech_stack?.some(t => t.toLowerCase().includes('wordpress'))) return false;
            }
            if (filters.onlyWithEmail && !lead.email) return false;
            if (filters.onlyHighTicket && !lead.isHighTicket) return false;
            if (filters.onlyAds && !lead.is_advertising) return false;
            if (filters.excludeZombies && lead.is_zombie) return false;
            if (filters.performance === 'fast') {
                if (!lead.performance_metrics?.ttfb || lead.performance_metrics.ttfb > 500) return false;
            }
            if (filters.performance === 'slow') {
                if (!lead.performance_metrics?.ttfb || lead.performance_metrics.ttfb < 1500) return false;
            }
            return true;
        });

        if (sortConfig) {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                if (sortConfig.key === 'ttfb') {
                    aValue = a.performance_metrics?.ttfb || Infinity;
                    bValue = b.performance_metrics?.ttfb || Infinity;
                }
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [rawLeads, filters, sortConfig]);

    // Filter badge counts (memoized separately so they don't recompute on sort changes)
    const counts = useMemo(() => ({
        wordpress: rawLeads.filter(l => l.tech_stack?.some(t => t.toLowerCase().includes('wordpress'))).length,
        withEmail: rawLeads.filter(l => l.email).length,
        highTicket: rawLeads.filter(l => l.isHighTicket).length,
        ads: rawLeads.filter(l => l.is_advertising).length,
        zombies: rawLeads.filter(l => l.is_zombie).length,
        fast: rawLeads.filter(l => l.performance_metrics?.ttfb > 0 && l.performance_metrics.ttfb <= 500).length,
        slow: rawLeads.filter(l => l.performance_metrics?.ttfb >= 1500).length,
    }), [rawLeads]);

    const toggleFilter = useCallback((key) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const setPerfFilter = useCallback((val) => {
        setFilters(prev => ({ ...prev, performance: val }));
    }, []);

    const requestSort = useCallback((key) => {
        setSortConfig(prev => {
            const direction = prev && prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc';
            return { key, direction };
        });
    }, []);

    return { processedLeads, filters, sortConfig, counts, toggleFilter, setPerfFilter, requestSort };
};

export default useTableProcessing;
