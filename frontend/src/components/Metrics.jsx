import React from 'react';
import { Users, Globe, Mail, Star, TrendingUp, DollarSign } from 'lucide-react';

const MetricCard = ({ icon: Icon, label, value, color, description }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3 group hover:border-indigo-300 transition-all duration-300">
        <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 shadow-sm border border-current border-opacity-10`}>
                <Icon className="w-5 h-5" />
            </div>
            {description && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    {description}
                </span>
            )}
        </div>
        <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
    </div>
);

const Metrics = ({ stats }) => {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <MetricCard
                icon={Users}
                label="Leads"
                value={stats.total}
                color="text-indigo-600 bg-indigo-50"
                description="Total Search"
            />
            <MetricCard
                icon={Globe}
                label="Con Web"
                value={stats.withWeb}
                color="text-emerald-600 bg-emerald-50"
                description={`${stats.total > 0 ? ((stats.withWeb / stats.total) * 100).toFixed(0) : 0}%`}
            />
            <MetricCard
                icon={Mail}
                label="Con Email"
                value={stats.withEmail}
                color="text-blue-600 bg-blue-50"
                description={`${stats.total > 0 ? ((stats.withEmail / stats.total) * 100).toFixed(0) : 0}%`}
            />
            <MetricCard
                icon={Star}
                label="Avg Rating"
                value={stats.avgRating?.toFixed(1) || 0}
                color="text-amber-600 bg-amber-50"
                description="Google Local"
            />
            <MetricCard
                icon={TrendingUp}
                label="Oportunidad"
                value="Alta"
                color="text-purple-600 bg-purple-50"
                description="Dominante"
            />
            <MetricCard
                icon={DollarSign}
                label="Costo API"
                value={`$${stats.totalCost?.toFixed(3) || 0}`}
                color="text-rose-600 bg-rose-50"
                description="Estimado"
            />
        </div>
    );
};

export default Metrics;
