import React from 'react';

/**
 * StatCard — Generic reusable metric card.
 * Purely visual, receives all data via props.
 */
const StatCard = ({ title, value, subtitle, icon: Icon, colorClass = 'text-indigo-400', bgColorClass = 'bg-indigo-500/10' }) => {
    return (
        <div className="bg-white/[0.03] rounded-xl p-5 border border-white/5 space-y-2">
            <div className="flex items-center gap-2">
                {Icon && (
                    <div className={`p-1.5 ${bgColorClass} rounded-lg`}>
                        <Icon className={`w-4 h-4 ${colorClass}`} />
                    </div>
                )}
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
            </div>
            <p className={`text-2xl font-black ${colorClass} tracking-tight`}>{value}</p>
            {subtitle && <p className="text-[9px] text-slate-500 font-mono">{subtitle}</p>}
        </div>
    );
};

export default StatCard;
