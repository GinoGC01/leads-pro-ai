import React from 'react';

/**
 * ChartLegend — Pipeline status legend.
 * Receives pre-computed legendData array with label, color, count, pct.
 * Pure presentational — zero math.
 */
const ChartLegend = ({ items }) => {
    return (
        <div className="flex flex-col gap-5">
            {items.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-6 hover:bg-white/5 p-2 -mx-2 rounded-xl cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.glowColor}` }}
                        />
                        <span className="text-xs font-bold text-slate-300">{item.label}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] font-bold text-slate-500">({item.count})</span>
                        <span className="text-sm font-black text-white min-w-[32px] text-right">{item.pct}%</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChartLegend;
