import React from 'react';
import useApiTelemetry from './hooks/useApiTelemetry';
import AlertBanner from './components/AlertBanner';
import CostSummary from './components/CostSummary';
import GoogleUsageTracker from './components/GoogleUsageTracker';
import OpenAIUsageTracker from './components/OpenAIUsageTracker';

/**
 * DataIntelligenceWidget — Thin Orchestrator
 * Wires the useApiTelemetry hook to pure presentational components.
 * Zero API calls. Only responsibility: layout and conditional rendering.
 */
const DataIntelligenceWidget = () => {
    const { usage, alerts, isLoading, error } = useApiTelemetry();

    if (isLoading && !usage) {
        return (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-32 mb-4"></div>
                <div className="h-8 bg-white/5 rounded w-24 mb-6"></div>
                <div className="space-y-3">
                    <div className="h-2 bg-white/5 rounded"></div>
                    <div className="h-2 bg-white/5 rounded"></div>
                </div>
            </div>
        );
    }

    if (error && !usage) {
        return (
            <div className="text-red-400 p-4 bg-red-900/20 rounded-xl border border-red-500/20 text-xs font-bold">
                Error de conexión con el backend de métricas.
            </div>
        );
    }

    if (!usage) return null;

    const isFreeTier = usage.google.freeTierRemaining > 0;

    return (
        <div className="space-y-4">
            <AlertBanner alerts={alerts} />

            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full"></div>

                <div className="relative z-10 space-y-5">
                    <CostSummary
                        totalCostUSD={usage.totalCostUSD}
                        month={usage.month}
                        isFreeTier={isFreeTier}
                    />

                    {/* API Breakdown */}
                    <div className="space-y-4 pt-2 border-t border-slate-800/50">
                        <GoogleUsageTracker usage={usage.google} />
                        <OpenAIUsageTracker usage={usage.openai} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataIntelligenceWidget;
