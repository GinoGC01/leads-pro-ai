import React from 'react';
import classNames from 'classnames';
import { TrendingUp } from 'lucide-react';
import Tooltip from '../Tooltip';

/**
 * MetricCard — Reusable KPI card wrapper.
 * Handles layout, primary/secondary styling, pill badges, tooltips, and icon rendering.
 * Children slot receives graphic sub-components (Sparkline, OppScoreGraphic, etc.)
 * ZERO business logic — pure presentation.
 */
const MetricCard = ({ icon: Icon, title, value, pillText, pillColor, isPrimary, tooltipText, tooltipPosition, children }) => {
    const cardContent = (
        <div className={classNames(
            "p-6 rounded-3xl flex flex-col justify-between h-[180px] relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl w-full",
            isPrimary ? "bg-white text-black shadow-lg shadow-white/5" : "bg-app-card text-white border border-white/5 hover:border-white/10"
        )}>
            {/* Decorative background glow for primary */}
            {isPrimary && <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent-blue/10 blur-3xl rounded-full pointer-events-none"></div>}

            <div className="flex justify-between items-start relative z-10">
                <span className={classNames(
                    "text-xs font-bold uppercase tracking-widest",
                    isPrimary ? "text-slate-500" : "text-slate-400"
                )}>{title}</span>

                {isPrimary ? (
                    <div className="bg-black text-white p-2.5 rounded-2xl shadow-md">
                        <Icon strokeWidth={2.5} className="w-4 h-4" />
                    </div>
                ) : (
                    <div className="bg-white/5 p-2.5 rounded-2xl text-slate-400 border border-white/5">
                        <Icon strokeWidth={2} className="w-4 h-4" />
                    </div>
                )}
            </div>

            <div className="relative z-10 mt-auto">
                <div className="flex items-end justify-between">
                    <div className="flex items-end gap-3">
                        <span className={classNames(
                            "text-4xl font-black tracking-tighter",
                            isPrimary ? "text-black" : "text-white"
                        )}>{value}</span>

                        {pillText && (
                            <span className={classNames(
                                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg mb-1.5 border",
                                pillColor === 'green'
                                    ? classNames(isPrimary ? "bg-[#00e57c]/10 text-[#00c868] border-[#00e57c]/20" : "bg-pastel-green/10 text-pastel-green border-pastel-green/20")
                                    : "bg-white/5 text-slate-400 border-white/10"
                            )}>
                                {pillColor === 'green' && <TrendingUp className="w-3 h-3" />}
                                {pillText}
                            </span>
                        )}
                    </div>
                    {isPrimary && children}
                </div>
                {!isPrimary && children}
            </div>
        </div>
    );

    if (tooltipText) {
        return <Tooltip text={tooltipText} position={tooltipPosition || 'top'}>{cardContent}</Tooltip>;
    }

    return cardContent;
};

export default MetricCard;
