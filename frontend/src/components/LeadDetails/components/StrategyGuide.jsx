import React from 'react';
import { Globe, Loader2, Zap, Server, Activity, AlertTriangle, Target } from 'lucide-react';

/**
 * StrategyGuide
 * Renders the "Radiografía Spider" tab content. Purely presentational.
 * Shows: loading state, tech matrix, vitals gauges, friction banner, tactical blueprint, raw pain vector.
 */
const StrategyGuide = ({ lead, spiderData, isSpiderLoading, aiResponse }) => {
    if (isSpiderLoading && !spiderData && !aiResponse) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-4 p-12">
                <div className="relative">
                    <Loader2 className="w-12 h-12 text-accent-blue animate-spin" />
                    <div className="absolute inset-0 bg-accent-blue/20 blur-xl rounded-full"></div>
                </div>
                <div className="text-center space-y-2">
                    Analizando Infraestructura Core
                    <p className="text-[10px] text-slate-400 font-mono">Calculando Costos Hundidos y Densidad de Fricción UX/UI...</p>
                </div>
                <div className="w-64 mt-6">
                    <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase mb-1">
                        <span>Extrayendo DOM Vectorial</span>
                        <span className="text-accent-blue animate-pulse">Running</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-accent-blue w-1/2 animate-pulse rounded-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!spiderData) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-300 flex flex-col h-full">
            {/* Tech Stack Matrix */}
            <div className="flex flex-col lg:flex-row gap-3 mb-2">
                <div className="flex-1 bg-[#0A0B10] p-5 rounded-2xl border border-white/[0.05] relative overflow-hidden group">
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Server className="w-3.5 h-3.5" /> Matrix Tecnológica
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full capitalize">
                            {spiderData.infrastructure_type || 'Desconocido'}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {lead.tech_stack?.length > 0 ? lead.tech_stack.map((t, i) => (
                            <span key={i} className="px-2 py-1 bg-white/[0.02] border border-white/10 rounded-md text-[10px] font-mono text-slate-300">{t}</span>
                        )) : <span className="text-xs text-slate-600 italic">No frameworks detectados</span>}
                    </div>
                </div>
            </div>

            {/* Vitals Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {/* Confianza */}
                <div className="bg-[#0A0B10] border border-white/[0.05] p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Activity className="w-3 h-3" /> Confianza (IA)</span>
                        <span className="text-xs font-black text-white">{spiderData.historical_confidence || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)] ${(spiderData.historical_confidence || 0) > 70 ? 'bg-emerald-400' : (spiderData.historical_confidence || 0) > 30 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${spiderData.historical_confidence || 0}%` }}></div>
                    </div>
                </div>
                {/* Velocidad */}
                <div className="bg-[#0A0B10] border border-white/[0.05] p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Zap className="w-3 h-3" /> Velocidad LCP</span>
                        <span className="text-xs font-black text-white">{spiderData.load_speed_score || 50}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${(spiderData.load_speed_score || 50) > 70 ? 'bg-emerald-400' : (spiderData.load_speed_score || 50) > 30 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${spiderData.load_speed_score || 50}%` }}></div>
                    </div>
                </div>
                {/* SEO */}
                <div className="bg-[#0A0B10] border border-white/[0.05] p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Globe className="w-3 h-3" /> Estructura SEO</span>
                        <span className="text-xs font-black text-white">{spiderData.seo_integrity_score || 60}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]" style={{ width: `${spiderData.seo_integrity_score || 60}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Friction Banner */}
            {spiderData.friction_score === 'HIGH' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400 leading-relaxed">
                        <span className="font-bold">Alta Fricción Detectada:</span> El Stack tecnológico del prospecto presenta dependencias severas (ej. Linktree, Wix, sin dominio propio). Fuga de prospectos premium altamente probable.
                    </p>
                </div>
            )}

            {/* Tactical Blueprint */}
            <div className="p-6 bg-slate-900/80 border-l-4 border-l-accent-blue rounded-r-2xl shadow-inner relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-48 h-full bg-gradient-to-l from-accent-blue/10 to-transparent pointer-events-none"></div>
                <div className="flex items-start gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex flex-shrink-0 items-center justify-center">
                        <Target className="w-5 h-5 text-accent-blue" />
                    </div>
                    <div>
                        <h5 className="text-[10px] font-black text-accent-blue uppercase tracking-widest mb-1">Blueprint de Venta</h5>
                        <h3 className="text-white font-bold text-base mb-2">
                            Objetivo: <span className="text-accent-blue">{spiderData.service || 'Ingeniería SEO'}</span>
                        </h3>
                        <p className="text-[12px] text-slate-300 leading-relaxed font-medium mb-3 relative">
                            Táctica a ejecutar: <strong className="text-white">{spiderData.tactic_name || 'Desconocida'}</strong><br />
                            <span className="text-slate-400 block mt-1">El bot MARIO ha sido parametrizado con este contexto. Sus mensajes de la derecha aplican ingeniería sociológica diseñada para detonar la Hemorragia de Negocios atada a este dolor técnico especifico. Cópialos o modifícalos ligeramente manteniendo el estatus.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Raw Vector Info */}
            {spiderData.pain && (
                <div className="p-4 bg-[#0B0B0C] border border-white/5 rounded-xl text-xs text-slate-400 font-mono whitespace-pre-wrap mt-auto">
                    <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">// Vector Base de Dolor (Raw)</div>
                    {spiderData.pain}
                </div>
            )}
        </div>
    );
};

export default StrategyGuide;
