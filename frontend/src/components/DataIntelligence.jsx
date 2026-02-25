import React from 'react';
import { DollarSign, BarChart3, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

const DataIntelligence = ({ billing }) => {
    if (!billing) return null;

    const {
        textSearchUsage,
        detailsUsage,
        textSearchLimit,
        detailsLimit,
        realBillableCost,
        theoreticalSavings
    } = billing;

    const searchPercentage = Math.min(100, (textSearchUsage / textSearchLimit) * 100);
    const detailsPercentage = Math.min(100, (detailsUsage / detailsLimit) * 100);

    return (
        <div className="space-y-4">
            {/* Main Financial Card (Compact & Sidebar Ready) */}
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden group">
                {/* Subtle corner glow */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full"></div>

                <div className="relative z-10 space-y-5">
                    {/* Header: Shield & Month */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Free Mode</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            {new Date().toLocaleDateString('es-ES', { month: 'short' })} 2026
                        </span>
                    </div>

                    {/* Main Pricing Display */}
                    <div>
                        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">Gasto Facturable</p>
                        <div className="flex items-baseline gap-1.5">
                            <h2 className="text-3xl font-black text-white tracking-tighter">
                                ${realBillableCost.toFixed(2)}
                            </h2>
                            <span className="text-[10px] text-slate-500 font-bold">USD</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            <p className="text-[10px] text-emerald-400 font-black flex items-center gap-1">
                                Ahorro: +${theoreticalSavings.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bars (Stacked for Sidebar) */}
                    <div className="space-y-4 pt-2 border-t border-slate-800/50">
                        {/* Text Search Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-1.5">
                                    <Zap className="w-3 h-3 text-amber-400" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Búsquedas</span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-500">
                                    {textSearchUsage}/{textSearchLimit}
                                </span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.3)] ${searchPercentage >= 90 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                                    style={{ width: `${searchPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Place Details Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-1.5">
                                    <BarChart3 className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Detalles</span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-500">
                                    {detailsUsage}/{detailsLimit}
                                </span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.3)] ${detailsPercentage >= 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${detailsPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Micro-Banner */}
            {realBillableCost === 0 && (
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-800 uppercase">Eficiencia: 100%</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataIntelligence;
