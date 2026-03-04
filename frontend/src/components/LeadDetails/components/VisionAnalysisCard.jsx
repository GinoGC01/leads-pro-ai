import React from 'react';
import { Camera, AlertCircle, TrendingUp } from 'lucide-react';

const VisionAnalysisCard = ({ analysis }) => {
    if (!analysis) return null;

    const { ux_score_1_to_10, design_era, critical_frictions, sales_angle_recommendation } = analysis;

    const scoreColor = ux_score_1_to_10 >= 8 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                   : ux_score_1_to_10 >= 5 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                   : 'text-red-400 bg-red-500/10 border-red-500/20';

    return (
        <div className="bg-app-card rounded-2xl border border-white/5 overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-fuchsia-400" />
                    <div>
                        <h4 className="text-[12px] font-black text-white uppercase tracking-widest">Deep Vision UX/UI</h4>
                        <p className="text-[9px] text-slate-400">Análisis visual con Modelo Multimodal</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className="px-2.5 py-1 rounded bg-fuchsia-500/10 text-fuchsia-400 text-[10px] font-black uppercase border border-fuchsia-500/20">
                        Era: {design_era}
                    </span>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase border ${scoreColor}`}>
                        Score: {ux_score_1_to_10}/10
                    </span>
                </div>
            </div>

            {/* Frictions Section */}
            <div className="p-5 bg-[#0B0B0C] space-y-4 border-b border-white/5">
                <h5 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" /> Fricciones Críticas Detectadas
                </h5>
                <ul className="space-y-2">
                    {critical_frictions?.map((friction, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs text-slate-300 bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>
                            <span>{friction}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Sales Angle Section */}
            <div className="p-5 bg-indigo-900/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none"></div>
                <h5 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                    <TrendingUp className="w-4 h-4 text-indigo-400" /> Ángulo Estratégico de Ventas
                </h5>
                <div className="relative z-10 bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl text-indigo-100 text-xs leading-relaxed font-medium shadow-inner">
                    <div className="absolute -left-1 top-4 w-2 h-full bg-indigo-500/50 blur-sm"></div>
                    <div dangerouslySetInnerHTML={{ __html: sales_angle_recommendation.replace(/\ng/g, '<br/>') }} />
                </div>
            </div>
        </div>
    );
};

export default VisionAnalysisCard;
