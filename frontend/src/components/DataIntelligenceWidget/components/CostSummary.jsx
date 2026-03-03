import React from 'react';
import { ShieldCheck, RefreshCw, TrendingUp } from 'lucide-react';

/**
 * CostSummary — Displays the total monthly cost in USD,
 * free tier / billing badge, month label, and the efficiency medal.
 * Pure presentational.
 */
const CostSummary = ({ totalCostUSD, month, isFreeTier, onRefresh }) => {
    const isEfficient = totalCostUSD < 1.0;

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${
                    isFreeTier
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-amber-500/10 border border-amber-500/20'
                }`}>
                    <ShieldCheck className={`w-3 h-3 ${isFreeTier ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                        isFreeTier ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                        {isFreeTier ? 'Free Tier Activo' : 'Billing Activo'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{month}</span>
                    {onRefresh && (
                        <button onClick={onRefresh} className="p-1 hover:bg-white/5 rounded transition-colors">
                            <RefreshCw className="w-3 h-3 text-slate-500" />
                        </button>
                    )}
                </div>
            </div>

            {/* Total Cost Display */}
            <div>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">Gasto Total Mes</p>
                <div className="flex items-baseline gap-1.5">
                    <h2 className="text-3xl font-black text-white tracking-tighter">
                        ${totalCostUSD.toFixed(2)}
                    </h2>
                    <span className="text-[10px] text-slate-500 font-bold">USD</span>
                </div>
            </div>

            {/* Efficiency Badge (conditional) */}
            {isEfficient && (
                <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase">
                            Eficiencia Máxima — Costo &lt; $1 USD
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CostSummary;
