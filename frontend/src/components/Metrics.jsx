import React from 'react';
import { Users, Globe, Mail, Star, TrendingUp, DollarSign, Activity, PieChart, ShieldCheck } from 'lucide-react';

const MetricCard = ({ icon: Icon, label, value, color, description, trend }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3 group hover:border-indigo-300 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-50/50">
        <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 shadow-sm border border-current border-opacity-10 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 transition-transform" />
            </div>
            {description && (
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {description}
                    </span>
                    {trend && (
                        <span className={`text-[9px] font-bold mt-1 ${trend.startsWith('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {trend}
                        </span>
                    )}
                </div>
            )}
        </div>
        <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
    </div>
);

const Metrics = ({ stats }) => {
    if (!stats || !stats.summary) return null;

    const { summary, coverage, billing, efficiency, projection } = stats;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <MetricCard
                    icon={Users}
                    label="Capture Database"
                    value={summary.totalLeads}
                    color="text-indigo-600 bg-indigo-50"
                    description="Total Leads"
                    trend={`${summary.totalSearches} Búsquedas`}
                />
                <MetricCard
                    icon={Activity}
                    label="Email Coverage"
                    value={`${(coverage?.email || 0).toFixed(1)}%`}
                    color="text-blue-600 bg-blue-50"
                    description="Enriquecidos"
                    trend={`Propulsado por AI`}
                />
                <MetricCard
                    icon={ShieldCheck}
                    label="High Ticket"
                    value={summary.totalHighTicket || 0}
                    color="text-purple-600 bg-purple-50"
                    description="Critical"
                    trend={`Score > 90`}
                />
                <MetricCard
                    icon={Star}
                    label="Avg Lead Quality"
                    value={(summary.avgScore || 0).toFixed(0)}
                    color="text-amber-600 bg-amber-50"
                    description="Calidad AI"
                    trend="Escala 0-100"
                />
                <MetricCard
                    icon={TrendingUp}
                    label="ROI Potential"
                    value={`$${efficiency.roiPotential.toLocaleString()}`}
                    color="text-emerald-600 bg-emerald-50"
                    description="Proyectado"
                    trend="Ventas B2B"
                />
                <MetricCard
                    icon={DollarSign}
                    label="API Investment"
                    value={`$${(summary.totalInvested || 0).toFixed(2)}`}
                    color="text-rose-600 bg-rose-50"
                    description="Real Billing"
                    trend={`Propulsado por Free Tier`}
                />
            </div>
        </div>
    );
};

export default Metrics;
