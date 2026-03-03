import React from 'react';
import { Copy, MessageSquare, Mail, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AlertService from '../../../services/AlertService';
import { getWhatsAppLink } from '../../../utils/phoneUtils';

const ActionCard = ({ title, textContent, whatsAppText, icon, colorClass, lead }) => {
    const validWaNumber = getWhatsAppLink(lead?.phoneNumber, lead?.countryCode || 'AR');

    const handleCopy = () => {
        navigator.clipboard.writeText(textContent);
        AlertService.success("Copiado al portapapeles");
    };

    const handleWhatsApp = () => {
        if (!validWaNumber) return;
        window.open(`https://wa.me/${validWaNumber}?text=${encodeURIComponent(whatsAppText || textContent)}`, '_blank');
    };

    const handleEmail = () => {
        if (!lead?.email) return AlertService.warning("No hay email registrado");
        window.open(`mailto:${lead.email}?body=${encodeURIComponent(textContent)}`, '_blank');
    };

    return (
        <div className="bg-[#151720] border border-white/10 rounded-xl overflow-hidden shadow-2xl shrink-0">
            <div className="bg-slate-900/50 border-b border-white/5 py-2 px-4 shadow-inner">
                <span className={`text-[10px] font-black ${colorClass} uppercase tracking-widest flex items-center gap-2`}>
                    {icon}
                    {title}
                </span>
            </div>
            <div className="p-5 text-slate-200 text-sm font-sans leading-relaxed whitespace-pre-wrap prose prose-invert prose-xs max-w-none">
                <ReactMarkdown>
                    {textContent}
                </ReactMarkdown>
            </div>
            <div className="bg-[#0B0B0C] border-t border-white/5 p-4 flex flex-wrap items-center gap-3">
                <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm">
                    <Copy className="w-4 h-4 text-slate-300" /> Copiar
                </button>

                {validWaNumber ? (
                    <button onClick={handleWhatsApp} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm">
                        <MessageSquare className="w-4 h-4" /> Enviar WhatsApp
                    </button>
                ) : (
                    <button disabled title="Número inválido o no detectado" className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-500 text-[11px] font-black uppercase tracking-widest rounded-xl cursor-not-allowed border border-white/5">
                        <MessageSquare className="w-4 h-4 opacity-50" /> WhatsApp (ND)
                    </button>
                )}

                {lead?.email ? (
                    <button onClick={handleEmail} className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm">
                        <Mail className="w-4 h-4" /> Enviar Email
                    </button>
                ) : (
                    <button disabled title="Sin email detectado" className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-500 text-[11px] font-black uppercase tracking-widest rounded-xl cursor-not-allowed border border-white/5">
                        <Mail className="w-4 h-4 opacity-50" /> Email (ND)
                    </button>
                )}
            </div>
        </div>
    );
};

export default ActionCard;
