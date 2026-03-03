import React from 'react';
import { Brain } from 'lucide-react';

/**
 * OpenAIUsageTracker — Displays OpenAI token consumption (Input/Output),
 * total calls, and exact cost in USD.
 * Pure presentational.
 */
const OpenAIUsageTracker = ({ usage }) => {
    if (!usage) return null;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-1.5">
                    <Brain className="w-3 h-3 text-purple-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">OpenAI GPT-4o</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                    {usage.totalCalls} calls
                </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-2.5">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Input</p>
                    <p className="text-sm font-black text-white">{(usage.tokensInput / 1000).toFixed(1)}k</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2.5">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Output</p>
                    <p className="text-sm font-black text-white">{(usage.tokensOutput / 1000).toFixed(1)}k</p>
                </div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-500">
                <span>${usage.costUSD.toFixed(4)} USD</span>
                <span>{usage.tokensTotal.toLocaleString()} tokens total</span>
            </div>
        </div>
    );
};

export default OpenAIUsageTracker;
