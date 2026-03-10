import React from 'react';
import { MessageSquare, Clock } from 'lucide-react';

/**
 * GestionPanel
 * Renders the "Gestión" tab. CRM status grid and interaction history logs.
 * Purely presentational. Emits status selection events via onStatusSelect.
 */
const GestionPanel = ({ lead, onStatusSelect }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-300 flex flex-col h-full">
            <div className="p-5 bg-[#0B0B0C] rounded-2xl border border-white/5 shadow-inner">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Estado del Lead (CRM)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                        { label: 'Nuevo', color: 'slate' },
                        { label: 'Contactado', color: 'indigo' },
                        { label: 'Respuesta Positiva', color: 'blue' },
                        { label: 'En Espera', color: 'sky' },
                        { label: 'Cita Agendada', color: 'emerald' },
                        { label: 'Propuesta Enviada', color: 'teal' },
                        { label: 'Cerrado Ganado', color: 'amber' },
                        { label: 'Cerrado Perdido', color: 'rose' },
                        { label: 'Ignorado', color: 'neutral' },
                        { label: 'Descartados', color: 'zinc' },
                        { label: 'Sin WhatsApp', color: 'red' }
                    ].map(statusObj => {
                        const isActive = lead.status === statusObj.label;
                        let activeStyles = '';
                        if (isActive) {
                            switch (statusObj.color) {
                                case 'indigo': activeStyles = 'bg-indigo-500/20 text-indigo-400 border-indigo-500 shadow-md'; break;
                                case 'blue': activeStyles = 'bg-blue-500/20 text-blue-400 border-blue-500 shadow-md'; break;
                                case 'sky': activeStyles = 'bg-sky-500/20 text-sky-400 border-sky-500 shadow-md'; break;
                                case 'emerald': activeStyles = 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-md'; break;
                                case 'teal': activeStyles = 'bg-teal-500/20 text-teal-400 border-teal-500 shadow-md'; break;
                                case 'amber': activeStyles = 'bg-amber-500/20 text-amber-400 border-amber-500 shadow-md'; break;
                                case 'rose': activeStyles = 'bg-rose-500/20 text-rose-400 border-rose-500 shadow-md'; break;
                                case 'red': activeStyles = 'bg-red-500/20 text-red-500 border-red-500 shadow-md'; break;
                                case 'zinc': activeStyles = 'bg-zinc-500/20 text-zinc-400 border-zinc-500 shadow-md'; break;
                                case 'neutral': activeStyles = 'bg-slate-400/20 text-slate-400 border-slate-400 shadow-md'; break;
                                default: activeStyles = 'bg-slate-500/20 text-slate-300 border-slate-500 shadow-md';
                            }
                        } else {
                            activeStyles = 'bg-transparent text-slate-400 border-white/10 hover:border-white/20 hover:bg-white/5';
                        }

                        return (
                            <button
                                key={statusObj.label}
                                onClick={() => onStatusSelect(statusObj.label)}
                                className={`px-4 py-3 rounded-xl text-[10px] font-bold text-center transition-all border uppercase tracking-widest ${activeStyles}`}
                            >
                                {statusObj.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 p-5 bg-[#0B0B0C] rounded-2xl border border-white/5 shadow-inner flex flex-col">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Historial de Notas</h4>
                {lead.interactionLogs?.length > 0 ? (
                    <div className="space-y-3 flex-1 overflow-y-auto minimal-scrollbar">
                        {lead.interactionLogs.slice().reverse().map((log, i) => (
                            <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/10">
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    {new Date(log.timestamp).toLocaleDateString()} - <span className="text-accent-blue">{log.status}</span>
                                </p>
                                <p className="text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">{log.note || 'Sin nota.'}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                        <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
                        <p className="text-xs text-slate-500 italic text-center">Sin interacciones registradas.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GestionPanel;
