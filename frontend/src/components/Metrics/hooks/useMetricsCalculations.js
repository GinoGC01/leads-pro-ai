import { useMemo } from 'react';

/**
 * Hook: useMetricsCalculations
 * Extracts ALL formatting and math from the Metrics UI layer.
 * The magic number 5000 is now a configurable parameter (campaignTargetSize).
 */
const useMetricsCalculations = (summary, campaignTargetSize = 5000) => {
    return useMemo(() => {
        if (!summary) return null;

        const totalLeads = summary.totalLeads?.toLocaleString() || '0';
        const activeSearches = summary.totalSearches || '1';
        const avgScore = (summary.avgScore || 0).toFixed(0);

        const rawDominance = Math.min(100, Math.round((summary.totalLeads / campaignTargetSize) * 100));
        const marketDominance = rawDominance;

        // Growth pill data (can be made dynamic from backend in the future)
        const leadGrowth = '+12.5%';
        const dominanceGrowth = '+5.6%';

        return {
            totalLeads,
            activeSearches,
            avgScore,
            avgScoreRaw: summary.avgScore || 0,
            marketDominance,
            marketDominancePct: `${rawDominance}%`,
            leadGrowth,
            dominanceGrowth,
            campaignTargetSize,
        };
    }, [summary, campaignTargetSize]);
};

export default useMetricsCalculations;
