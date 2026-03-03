import React from 'react';
import {
    DollarSign, Zap, Brain, TrendingUp, ShieldCheck, AlertTriangle, RefreshCw, Activity
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * MetricsDashboard
 * Renders the "Dashboard Financiero" tab. Purely presentational.
 * Shows: hero cost card, API breakdowns (Google + OpenAI), Recharts charts, efficiency badge.
 */
const MetricsDashboard = ({ usage, alerts, selectedMonth, onMonthChange, syncing, onSync, onRefresh }) => {
    if (!usage) return null;

    const allTime = usage.allTime || { googleCalls: 0, openaiCalls: 0, totalCostUSD: 0 };
    const searchPercentage = Math.min(100, (usage.google.freeTierUsed / usage.google.freeTierLimit) * 100);
    const isFreeTier = usage.google.freeTierRemaining > 0;

    return (
        <div className="space-y-6">
            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-2">
                    {alerts.map((alert, i) => (
                        <div key={i} className={`p-3 rounded-xl flex items-start gap-2 ${alert.level === 'critical' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                            <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${alert.level === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
                            <p className={`text-xs font-bold ${alert.level === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>{alert.message}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Hero Cost Card */}
            <div className="bg-gradient-to-br from-slate-900 via-[#0e0e11] to-slate-900 rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/5 blur-3xl rounded-full"></div>
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/5 blur-3xl rounded-full"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${isFreeTier ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                            <ShieldCheck className={`w-3.5 h-3.5 ${isFreeTier ? 'text-emerald-400' : 'text-amber-400'}`} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isFreeTier ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {isFreeTier ? 'Free Tier Activo' : 'Billing Activo'}
                            </span>
                        </div>
                        <select
                            value={selectedMonth}
                            onChange={(e) => onMonthChange(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs font-bold text-slate-400 cursor-pointer focus:outline-none focus:border-indigo-500/50"
                        >
                            {(usage.availableMonths || []).map(m => (
                                <option key={m} value={m} className="bg-[#1a1a1a] text-slate-300">{m}</option>
                            ))}
                        </select>
                    </div>

                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">Gasto Total Acumulado</p>
                    <div className="flex items-baseline gap-2 mb-2">
                        <h2 className="text-5xl font-black text-white tracking-tighter">
                            ${allTime.totalCostUSD.toFixed(2)}
                        </h2>
                        <span className="text-sm text-slate-500 font-bold">USD</span>
                    </div>
                    <p className="text-slate-600 text-[9px] font-bold mb-6">
                        Mes seleccionado: ${usage.totalCostUSD.toFixed(4)} USD | Google: {allTime.googleCalls} req | OpenAI: {allTime.openaiCalls} calls
                    </p>

                    {/* API Breakdown Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Google Places */}
                        <div className="bg-white/[0.03] rounded-xl p-5 border border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-500/10 rounded-lg">
                                        <Zap className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <span className="text-xs font-black text-white uppercase tracking-wider">Google Places</span>
                                </div>
                                <span className="text-sm font-black text-amber-400">${usage.google.costUSD.toFixed(3)}</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500 font-bold">Text Search (Pro)</span>
                                    <span className="text-slate-400 font-mono">{usage.google.textSearchCount} req</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${searchPercentage >= 90 ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]' :
                                            searchPercentage >= 70 ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]' :
                                                'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                                            }`}
                                        style={{ width: `${searchPercentage}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-500">
                                    <span>{usage.google.freeTierUsed}/{usage.google.freeTierLimit} gratis</span>
                                    <span>${usage.google.pricePerRequest}/req</span>
                                </div>
                            </div>
                        </div>

                        {/* OpenAI */}
                        <div className="bg-white/[0.03] rounded-xl p-5 border border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-purple-500/10 rounded-lg">
                                        <Brain className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <span className="text-xs font-black text-white uppercase tracking-wider">OpenAI</span>
                                </div>
                                <span className="text-sm font-black text-purple-400">${usage.openai.costUSD.toFixed(4)}</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500 font-bold">Modelo Activo</span>
                                    <span className="text-indigo-400 font-mono font-bold">{usage.openai.activeModel}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-white/5 rounded-lg p-2 text-center">
                                        <p className="text-[8px] font-bold text-slate-500 uppercase">Calls</p>
                                        <p className="text-sm font-black text-white">{usage.openai.totalCalls}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 text-center">
                                        <p className="text-[8px] font-bold text-slate-500 uppercase">Input</p>
                                        <p className="text-sm font-black text-white">{(usage.openai.tokensInput / 1000).toFixed(1)}k</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 text-center">
                                        <p className="text-[8px] font-bold text-slate-500 uppercase">Output</p>
                                        <p className="text-sm font-black text-white">{(usage.openai.tokensOutput / 1000).toFixed(1)}k</p>
                                    </div>
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-500">
                                    <span>${usage.openai.pricing?.input}/1M in · ${usage.openai.pricing?.output}/1M out</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recharts Visualizations */}
                    {usage.dailyBreakdown && usage.dailyBreakdown.length > 0 && (
                        <div className="mt-6 space-y-4">
                            {/* Stacked Bar Chart */}
                            <div className="bg-[#161618] rounded-2xl p-6 border border-white/[0.05] shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                                        Costo Diario de APIs (USD)
                                    </h3>
                                </div>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height={256}>
                                        <BarChart data={usage.dailyBreakdown.slice(-14)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                                            <XAxis dataKey="date" tickFormatter={(v) => v.slice(8) + ' ' + usage.month.slice(5, 7)} stroke="#666" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Costo']}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                                            <Bar dataKey="googleCostUSD" name="Google Places API" stackId="a" fill="#3b82f6" />
                                            <Bar dataKey="openaiCostUSD" name="OpenAI (MARIO/Spider)" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {/* Google Area Chart */}
                                <div className="bg-[#161618] rounded-2xl p-6 border border-white/[0.05] shadow-xl">
                                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Volumen de Búsquedas (Google)</h3>
                                    <div className="h-40 w-full">
                                        <ResponsiveContainer width="100%" height={160}>
                                            <AreaChart data={usage.dailyBreakdown.slice(-14)}>
                                                <defs>
                                                    <linearGradient id="colorGoogle" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                                                <XAxis dataKey="date" tickFormatter={(v) => v.slice(8)} stroke="#666" fontSize={9} tickLine={false} axisLine={false} />
                                                <RechartsTooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }} />
                                                <Area type="monotone" dataKey="googleCalls" name="Requests" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorGoogle)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* OpenAI Area Chart */}
                                <div className="bg-[#161618] rounded-2xl p-6 border border-white/[0.05] shadow-xl">
                                    <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">Invocaciones IA (OpenAI)</h3>
                                    <div className="h-40 w-full">
                                        <ResponsiveContainer width="100%" height={160}>
                                            <AreaChart data={usage.dailyBreakdown.slice(-14)}>
                                                <defs>
                                                    <linearGradient id="colorOpenAI" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                                                <XAxis dataKey="date" tickFormatter={(v) => v.slice(8)} stroke="#666" fontSize={9} tickLine={false} axisLine={false} />
                                                <RechartsTooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }} />
                                                <Area type="monotone" dataKey="openaiCalls" name="Operaciones" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorOpenAI)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Efficiency Badge */}
            {usage.totalCostUSD < 1 && (
                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                        Eficiencia Máxima — Gasto mensual menor a $1 USD
                    </span>
                </div>
            )}
        </div>
    );
};

export default MetricsDashboard;
