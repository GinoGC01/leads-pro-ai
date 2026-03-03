import React, { useState, useEffect, useCallback } from 'react';
import {
    DollarSign, BarChart3, TrendingUp, ShieldCheck, Zap, AlertTriangle,
    Brain, RefreshCw, Shield, Eye, EyeOff, Save, Settings, Lock,
    ChevronRight, Activity, Database, Cpu
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const TABS = [
    { id: 'financial', label: 'Dashboard Financiero', icon: BarChart3 },
    { id: 'engine', label: 'Config MARIO', icon: Cpu },
    { id: 'vault', label: 'Bóveda de Seguridad', icon: Shield },
];

const DataIntelligencePanel = () => {
    const [activeTab, setActiveTab] = useState('financial');
    const [usage, setUsage] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');

    // Form state for config edit
    const [engineForm, setEngineForm] = useState({ model_name: 'gpt-4o-mini', temperature: 0.7, max_tokens: 1500 });
    const [keysForm, setKeysForm] = useState({ openai_key: '', google_places_key: '' });
    const [showOpenAI, setShowOpenAI] = useState(false);
    const [showGoogle, setShowGoogle] = useState(false);

    const fetchAll = useCallback(async (month) => {
        try {
            const monthParam = month || selectedMonth;
            const [usageRes, alertsRes, configRes] = await Promise.all([
                api.get('/intelligence/usage' + (monthParam ? `?month=${monthParam}` : '')),
                api.get('/intelligence/alerts'),
                api.get('/intelligence/config'),
            ]);
            setUsage(usageRes.data);
            if (!selectedMonth && usageRes.data.availableMonths?.length > 0) {
                // Auto-select the latest month with data
                setSelectedMonth(usageRes.data.availableMonths[0]);
            }
            setAlerts(alertsRes.data.alerts || []);
            setConfig(configRes.data);
            setEngineForm({
                model_name: configRes.data.ai_engine?.model_name || 'gpt-4o-mini',
                temperature: configRes.data.ai_engine?.temperature ?? 0.7,
                max_tokens: configRes.data.ai_engine?.max_tokens || 1500,
            });
            setKeysForm({
                openai_key: configRes.data.api_keys?.openai_key || '',
                google_places_key: configRes.data.api_keys?.google_places_key || '',
            });
        } catch (err) {
            console.error('[Intelligence] Fetch error:', err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        fetchAll();
        const interval = setInterval(() => fetchAll(), 30000);
        return () => clearInterval(interval);
    }, [fetchAll]);

    const handleMonthChange = (month) => {
        setSelectedMonth(month);
        fetchAll(month);
    };

    const handleSyncStats = async () => {
        setSyncing(true);
        try {
            const res = await api.post('/intelligence/sync-stats');
            if (res.data.success) {
                toast.success(`Sync: ${res.data.google.totalApiCalls} Google calls + ${res.data.openai.estimatedCalls} OpenAI calls`);
                await fetchAll();
            }
        } catch (err) {
            toast.error('Error en sync: ' + (err.response?.data?.message || err.message));
        } finally {
            setSyncing(false);
        }
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            const payload = {
                ai_engine: engineForm,
                api_keys: keysForm,
            };
            const res = await api.put('/intelligence/config', payload);
            if (res.data.success) {
                toast.success('Configuración guardada en la Bóveda');
                await fetchAll();
            }
        } catch (err) {
            toast.error('Error guardando: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading || !usage) {
        return (
            <div className="p-10 space-y-6 animate-pulse">
                <div className="h-6 bg-white/5 rounded w-64"></div>
                <div className="h-96 bg-white/5 rounded-2xl"></div>
            </div>
        );
    }

    const allTime = usage.allTime || { googleCalls: 0, openaiCalls: 0, totalCostUSD: 0 };
    const searchPercentage = Math.min(100, (usage.google.freeTierUsed / usage.google.freeTierLimit) * 100);
    const isFreeTier = usage.google.freeTierRemaining > 0;

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                            <Activity className="w-6 h-6 text-indigo-400" />
                        </div>
                        Data Intelligence Command Center
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                        Real-time API consumption · Engine control · Vault security
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSyncStats}
                        disabled={syncing}
                        className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-colors border border-indigo-500/20 text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
                    >
                        {syncing ? 'Sincronizando...' : '⟳ Sync Stats'}
                    </button>
                    <button
                        onClick={() => fetchAll()}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
                    >
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-2">
                    {alerts.map((alert, i) => (
                        <div key={i} className={`p-3 rounded-xl flex items-start gap-2 ${alert.level === 'critical' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'
                            }`}>
                            <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${alert.level === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
                            <p className={`text-xs font-bold ${alert.level === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                                {alert.message}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Tab Bar */}
            <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex-1 justify-center ${activeTab === tab.id
                                ? 'bg-indigo-500/15 text-indigo-400 shadow-lg shadow-indigo-500/10 border border-indigo-500/20'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ═══════════════ TAB 1: FINANCIAL DASHBOARD ═══════════════ */}
            {activeTab === 'financial' && (
                <div className="space-y-6">
                    {/* Hero Cost Card */}
                    <div className="bg-gradient-to-br from-slate-900 via-[#0e0e11] to-slate-900 rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/5 blur-3xl rounded-full"></div>
                        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/5 blur-3xl rounded-full"></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${isFreeTier ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'
                                    }`}>
                                    <ShieldCheck className={`w-3.5 h-3.5 ${isFreeTier ? 'text-emerald-400' : 'text-amber-400'}`} />
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isFreeTier ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {isFreeTier ? 'Free Tier Activo' : 'Billing Activo'}
                                    </span>
                                </div>
                                {/* Month Selector */}
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => handleMonthChange(e.target.value)}
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

                            {/* Visualizaciones Avanzadas (Recharts) */}
                            {usage.dailyBreakdown && usage.dailyBreakdown.length > 0 && (
                                <div className="mt-6 space-y-4">
                                    {/* Costos (BarChart Apilado tipo Google Cloud) */}
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
                                        {/* Uso Google (AreaChart - Polígono de Frecuencia) */}
                                        <div className="bg-[#161618] rounded-2xl p-6 border border-white/[0.05] shadow-xl">
                                            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">
                                                Volumen de Búsquedas (Google)
                                            </h3>
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

                                        {/* Uso OpenAI (AreaChart - Polígono de Frecuencia) */}
                                        <div className="bg-[#161618] rounded-2xl p-6 border border-white/[0.05] shadow-xl">
                                            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">
                                                Invocaciones IA (OpenAI)
                                            </h3>
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
            )}

            {/* ═══════════════ TAB 2: ENGINE CONFIG (MARIO) ═══════════════ */}
            {activeTab === 'engine' && (
                <div className="bg-gradient-to-br from-slate-900 via-[#0e0e11] to-slate-900 rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/5 blur-3xl rounded-full"></div>

                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                <Cpu className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white">Motor MARIO — Configuración IA</h2>
                                <p className="text-[10px] text-slate-500 font-mono">Cambios en tiempo real para todas las operaciones de IA</p>
                            </div>
                        </div>

                        {/* Model Selector */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modelo LLM</label>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {config?.available_models?.map(model => (
                                    <button
                                        key={model.id}
                                        onClick={() => setEngineForm(f => ({ ...f, model_name: model.id }))}
                                        className={`p-3 rounded-xl border text-left transition-all ${engineForm.model_name === model.id
                                            ? 'bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                                            : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                                            }`}
                                    >
                                        <p className={`text-xs font-black ${engineForm.model_name === model.id ? 'text-indigo-400' : 'text-white'}`}>
                                            {model.name}
                                        </p>
                                        <p className="text-[9px] text-slate-500 font-mono mt-1">
                                            ${model.inputCost} in · ${model.outputCost} out
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Temperature Slider */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temperatura</label>
                                <span className="text-sm font-black text-indigo-400 font-mono">{engineForm.temperature.toFixed(2)}</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={engineForm.temperature}
                                    onChange={e => setEngineForm(f => ({ ...f, temperature: parseFloat(e.target.value) }))}
                                    className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer
                                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                                        [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full
                                        [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-indigo-500/40
                                        [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20
                                        [&::-webkit-slider-thumb]:cursor-pointer"
                                />
                                <div className="flex justify-between mt-1">
                                    <span className="text-[8px] text-slate-600 font-mono">0.0 Determinístico</span>
                                    <span className="text-[8px] text-slate-600 font-mono">1.0 Creativo</span>
                                </div>
                            </div>
                        </div>

                        {/* Max Tokens */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Tokens</label>
                            <input
                                type="number"
                                min="100"
                                max="8000"
                                step="100"
                                value={engineForm.max_tokens}
                                onChange={e => setEngineForm(f => ({ ...f, max_tokens: parseInt(e.target.value) || 1500 }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm
                                    focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>

                        <button
                            onClick={handleSaveConfig}
                            disabled={saving}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-50
                                text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all
                                shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Guardando...' : 'Guardar Configuración del Motor'}
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════════════ TAB 3: SECURITY VAULT ═══════════════ */}
            {activeTab === 'vault' && (
                <div className="bg-gradient-to-br from-slate-900 via-[#0e0e11] to-slate-900 rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/5 blur-3xl rounded-full"></div>

                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <Lock className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white">Bóveda de Seguridad</h2>
                                <p className="text-[10px] text-slate-500 font-mono">AES-256-GCM · Las llaves jamás se envían desencriptadas</p>
                            </div>
                        </div>

                        {/* Security Info Banner */}
                        <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 flex items-start gap-3">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <div className="text-[10px] text-emerald-400/80 leading-relaxed">
                                <span className="font-black">Protocolo de seguridad activo.</span> Las llaves se encriptan con AES-256-GCM
                                antes de almacenarse. El frontend solo recibe versiones enmascaradas (ej: <span className="font-mono">sk-p...9x2A</span>).
                                Para actualizar una llave, ingresa el valor completo nuevo.
                            </div>
                        </div>

                        {/* OpenAI Key */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OpenAI API Key</label>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${config?.api_keys?.openai_source === 'vault'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                        {config?.api_keys?.openai_source === 'vault' ? '🔐 Vault' : '📁 .env'}
                                    </span>
                                    <button onClick={() => setShowOpenAI(!showOpenAI)} className="p-1 hover:bg-white/10 rounded transition-colors">
                                        {showOpenAI ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                                    </button>
                                </div>
                            </div>
                            <input
                                type={showOpenAI ? 'text' : 'password'}
                                value={keysForm.openai_key}
                                onChange={e => setKeysForm(f => ({ ...f, openai_key: e.target.value }))}
                                placeholder="sk-proj-..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm
                                    focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all
                                    placeholder:text-slate-600"
                            />
                        </div>

                        {/* Google Places Key */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google Places API Key</label>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${config?.api_keys?.google_source === 'vault'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                        {config?.api_keys?.google_source === 'vault' ? '🔐 Vault' : '📁 .env'}
                                    </span>
                                    <button onClick={() => setShowGoogle(!showGoogle)} className="p-1 hover:bg-white/10 rounded transition-colors">
                                        {showGoogle ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                                    </button>
                                </div>
                            </div>
                            <input
                                type={showGoogle ? 'text' : 'password'}
                                value={keysForm.google_places_key}
                                onChange={e => setKeysForm(f => ({ ...f, google_places_key: e.target.value }))}
                                placeholder="AIza..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm
                                    focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all
                                    placeholder:text-slate-600"
                            />
                        </div>

                        <button
                            onClick={handleSaveConfig}
                            disabled={saving}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-50
                                text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all
                                shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
                        >
                            <Shield className="w-4 h-4" />
                            {saving ? 'Encriptando...' : 'Guardar en Bóveda Segura'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataIntelligencePanel;
