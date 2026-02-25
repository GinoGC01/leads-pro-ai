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
                    value={`${coverage.email.toFixed(1)}%`}
                    color="text-blue-600 bg-blue-50"
                    description="Enriquecidos"
                    trend={`Propulsado por AI`}
                />
                <MetricCard
                    icon={ShieldCheck}
                    label="High Ticket"
                    value={summary.totalHighTicket}
                    color="text-purple-600 bg-purple-50"
                    description="Critical"
                    trend={`Score > 90`}
                />
                <MetricCard
                    icon={Star}
                    label="Avg Lead Quality"
                    value={summary.avgScore.toFixed(0)}
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
                    value={`$${summary.totalInvested.toFixed(2)}`}
                    color="text-rose-600 bg-rose-50"
                    description="Google Cloud"
                    trend={`Proj: $${projection.monthlyEstimated.toFixed(0)}/mo`}
                />
            </div>

            {/* Billing Insight Bar (Optional extra wow factor) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
                <div className="flex flex-col">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-indigo-600" />
                        Billing Intelligence Breakdown
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">Análisis en tiempo real de costes por SKU de Google Places API v2.0</p>
                </div>

                <div className="flex-1 flex gap-2 h-3 mx-4">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(billing.discoveryCost / billing.totalEstimated) * 100}%` }} title="Discovery Cost"></div>
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(billing.detailsCost / billing.totalEstimated) * 100}%` }} title="Contact Data Cost"></div>
                    <div className="h-full bg-slate-200 rounded-full" style={{ width: `${(billing.enrichmentCost / billing.totalEstimated) * 100}%` }} title="AI Enrichment Cost"></div>
                </div>

                <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-tight text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Discovery</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Contact</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200"></span> Enrichment</div>
                </div>
            </div>
        </div>
    );
};

export default Metrics;
