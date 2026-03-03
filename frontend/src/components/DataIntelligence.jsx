import React, { useState, useEffect } from 'react';
import { DollarSign, BarChart3, TrendingUp, ShieldCheck, Zap, AlertTriangle, Brain, RefreshCw } from 'lucide-react';
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const DataIntelligence = () => {
    const [usage, setUsage] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [usageRes, alertsRes] = await Promise.all([
                api.get('/intelligence/usage'),
                api.get('/intelligence/alerts'),
            ]);
            setUsage(usageRes.data);
            setAlerts(alertsRes.data.alerts || []);
        } catch (err) {
            console.error('[DataIntelligence] Fetch error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading || !usage) {
        return (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-32 mb-4"></div>
                <div className="h-8 bg-white/5 rounded w-24 mb-6"></div>
                <div className="space-y-3">
                    <div className="h-2 bg-white/5 rounded"></div>
                    <div className="h-2 bg-white/5 rounded"></div>
                </div>
            </div>
        );
    }

    const searchPercentage = Math.min(100, (usage.google.textSearchCount / usage.google.freeTierLimit) * 100);
    const isFreeTier = usage.google.freeTierRemaining > 0;

    return (
        <div className="space-y-4">
            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-2">
                    {alerts.map((alert, i) => (
                        <div key={i} className={`p-3 rounded-xl flex items-start gap-2 ${alert.level === 'critical' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'
                            }`}>
                            <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${alert.level === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
                            <p className={`text-[10px] font-bold ${alert.level === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                                {alert.message}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Financial Card */}
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full"></div>

                <div className="relative z-10 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isFreeTier ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'
                            }`}>
                            <ShieldCheck className={`w-3 h-3 ${isFreeTier ? 'text-emerald-400' : 'text-amber-400'}`} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isFreeTier ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {isFreeTier ? 'Free Tier Activo' : 'Billing Activo'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                {usage.month}
                            </span>
                            <button onClick={fetchData} className="p-1 hover:bg-white/5 rounded transition-colors">
                                <RefreshCw className="w-3 h-3 text-slate-500" />
                            </button>
                        </div>
                    </div>

                    {/* Total Cost Display */}
                    <div>
                        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">Gasto Total Mes</p>
                        <div className="flex items-baseline gap-1.5">
                            <h2 className="text-3xl font-black text-white tracking-tighter">
                                ${usage.totalCostUSD.toFixed(2)}
                            </h2>
                            <span className="text-[10px] text-slate-500 font-bold">USD</span>
                        </div>
                    </div>

                    {/* API Breakdown */}
                    <div className="space-y-4 pt-2 border-t border-slate-800/50">
                        {/* Google Places */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-1.5">
                                    <Zap className="w-3 h-3 text-amber-400" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Google Places</span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-500">
                                    {usage.google.textSearchCount}/{usage.google.freeTierLimit}
                                </span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${searchPercentage >= 90 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : searchPercentage >= 70 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.3)]'}`}
                                    style={{ width: `${searchPercentage}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500">
                                <span>${usage.google.costUSD.toFixed(3)} USD</span>
                                <span>{usage.google.freeTierRemaining} req gratis restantes</span>
                            </div>
                        </div>

                        {/* OpenAI */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-1.5">
                                    <Brain className="w-3 h-3 text-purple-400" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">OpenAI GPT-4o</span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-500">
                                    {usage.openai.totalCalls} calls
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 rounded-lg p-2.5">
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Input</p>
                                    <p className="text-sm font-black text-white">{(usage.openai.tokensInput / 1000).toFixed(1)}k</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-2.5">
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Output</p>
                                    <p className="text-sm font-black text-white">{(usage.openai.tokensOutput / 1000).toFixed(1)}k</p>
                                </div>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500">
                                <span>${usage.openai.costUSD.toFixed(4)} USD</span>
                                <span>{usage.openai.tokensTotal.toLocaleString()} tokens total</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Efficiency Badge */}
            {usage.totalCostUSD < 1 && (
                <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase">
                            Eficiencia Máxima — Costo &lt; $1 USD
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataIntelligence;
