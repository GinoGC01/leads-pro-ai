import React from 'react';
import { Zap } from 'lucide-react';

/**
 * GoogleUsageTracker — Displays Google Places Text Search usage
 * with a color-changing progress bar (blue < 70%, amber < 90%, red >= 90%).
 * Pure presentational.
 */
const GoogleUsageTracker = ({ usage }) => {
    if (!usage) return null;

    const searchPercentage = Math.min(100, (usage.textSearchCount / usage.freeTierLimit) * 100);

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Google Places</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                    {usage.textSearchCount}/{usage.freeTierLimit}
                </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                        searchPercentage >= 90
                            ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                            : searchPercentage >= 70
                                ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                : 'bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.3)]'
                    }`}
                    style={{ width: `${searchPercentage}%` }}
                ></div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-500">
                <span>${usage.costUSD.toFixed(3)} USD</span>
                <span>{usage.freeTierRemaining} req gratis restantes</span>
            </div>
        </div>
    );
};

export default GoogleUsageTracker;
