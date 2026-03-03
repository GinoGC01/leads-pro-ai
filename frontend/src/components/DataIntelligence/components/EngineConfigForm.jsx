import React from 'react';
import { Cpu, Save } from 'lucide-react';

/**
 * EngineConfigForm
 * Renders the "Config MARIO" tab. Purely presentational.
 * Shows: model selector grid, temperature slider, max tokens input, save button.
 */
const EngineConfigForm = ({ config, engineForm, onChange, onSave, isSaving, isLoading }) => {
    if (isLoading || !config) {
        return (
            <div className="p-10 animate-pulse">
                <div className="h-6 bg-white/5 rounded w-48 mb-6"></div>
                <div className="h-48 bg-white/5 rounded-2xl"></div>
            </div>
        );
    }

    return (
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
                                onClick={() => onChange(f => ({ ...f, model_name: model.id }))}
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
                            onChange={e => onChange(f => ({ ...f, temperature: parseFloat(e.target.value) }))}
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
                        onChange={e => onChange(f => ({ ...f, max_tokens: parseInt(e.target.value) || 1500 }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm
                            focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                </div>

                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-50
                        text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all
                        shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Guardando...' : 'Guardar Configuración del Motor'}
                </button>
            </div>
        </div>
    );
};

export default EngineConfigForm;
