import React, { useState } from 'react';
import { BarChart3, Cpu, Shield, Activity, RefreshCw } from 'lucide-react';

// Custom Hooks (all API logic lives here)
import useIntelligenceMetrics from './hooks/useIntelligenceMetrics';
import useEngineConfig from './hooks/useEngineConfig';

// Presentational Components (zero API calls)
import MetricsDashboard from './components/MetricsDashboard';
import EngineConfigForm from './components/EngineConfigForm';
import SecurityVaultForm from './components/SecurityVaultForm';

const TABS = [
    { id: 'financial', label: 'Dashboard Financiero', icon: BarChart3 },
    { id: 'engine', label: 'Config MARIO', icon: Cpu },
    { id: 'vault', label: 'Bóveda de Seguridad', icon: Shield },
];

/**
 * DataIntelligencePanel — Thin Orchestrator
 * Wires hooks to components. Owns only local UI state (activeTab).
 * All data fetching, sync, and saving delegated to custom hooks.
 */
const DataIntelligencePanel = () => {
    const [activeTab, setActiveTab] = useState('financial');

    const {
        usage, alerts, loading, syncing, selectedMonth,
        handleMonthChange, handleSyncStats, refresh
    } = useIntelligenceMetrics();

    const {
        config, isFetching, isSaving,
        engineForm, keysForm,
        updateEngineForm, updateKeysForm, saveConfig
    } = useEngineConfig();

    // Loading state
    if (loading || !usage) {
        return (
            <div className="p-10 space-y-6 animate-pulse">
                <div className="h-6 bg-white/5 rounded w-64"></div>
                <div className="h-96 bg-white/5 rounded-2xl"></div>
            </div>
        );
    }

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
                        onClick={() => refresh()}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
                    >
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </div>

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

            {/* Tab Content */}
            {activeTab === 'financial' && (
                <MetricsDashboard
                    usage={usage}
                    alerts={alerts}
                    selectedMonth={selectedMonth}
                    onMonthChange={handleMonthChange}
                    syncing={syncing}
                    onSync={handleSyncStats}
                    onRefresh={refresh}
                />
            )}

            {activeTab === 'engine' && (
                <EngineConfigForm
                    config={config}
                    engineForm={engineForm}
                    onChange={updateEngineForm}
                    onSave={saveConfig}
                    isSaving={isSaving}
                    isLoading={isFetching}
                />
            )}

            {activeTab === 'vault' && (
                <SecurityVaultForm
                    config={config}
                    keysForm={keysForm}
                    onChange={updateKeysForm}
                    onSave={saveConfig}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};

export default DataIntelligencePanel;
