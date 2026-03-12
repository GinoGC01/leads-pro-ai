import React, { useState } from 'react';
import { Copy, MessageSquare, Mail, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AlertService from '../../../services/AlertService';
import { getWhatsAppLink } from '../../../utils/phoneUtils';

const ActionCard = ({ title, subtitle, textContent, whatsAppText, icon, colorClass, borderColor, lead }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const validWaNumber = getWhatsAppLink(lead?.phoneNumber, lead?.countryCode || 'AR');

    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(textContent);
        AlertService.success("Copiado al portapapeles");
    };

    const handleWhatsApp = (e) => {
        e.stopPropagation();
        if (!validWaNumber) return;
        window.open(`https://wa.me/${validWaNumber}?text=${encodeURIComponent(whatsAppText || textContent)}`, '_blank');
    };

    const handleEmail = (e) => {
        e.stopPropagation();
        
        // 1. Respaldo: Copiamos al portapapeles por seguridad (URI Overflow prevention)
        navigator.clipboard.writeText(textContent);
        AlertService.success("Texto copiado. Abriendo correo...");

        // 2. Forzar Gmail Web (API no oficial de Google Compose)
        const subject = encodeURIComponent("Auditoría de Infraestructura Estratégica"); 
        const body = encodeURIComponent(textContent);
        
        // Esto abre la ventana de redacción de Gmail directamente en el navegador
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${lead.email}&su=${subject}&body=${body}`;
        
        window.open(gmailUrl, '_blank');
    };

    return (
        <div className={`group relative bg-[#18181b] border-l-4 ${borderColor || 'border-l-[#27272a]'} border border-[#27272a] rounded-r-xl transition-all overflow-hidden`}>
            
            {/* Header (Stitch Design) */}
            <div 
                className="p-4 hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <span className={colorClass}>
                        {icon}
                    </span>
                    <div>
                        <p className={`font-bold text-[13px] ${colorClass}`}>{title}</p>
                        {subtitle && <p className="text-[11px] text-slate-400 italic mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : 'group-hover:text-white'}`} />
            </div>

            {/* Body (Markdown + Actions) */}
            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-5 pt-0 text-slate-300 text-[13px] font-sans leading-relaxed whitespace-pre-wrap prose prose-invert prose-xs max-w-none border-t border-[#27272a] mt-2 pt-4 bg-[#09090b]/50">
                    <ReactMarkdown>
                        {textContent}
                    </ReactMarkdown>
                </div>
                
                {/* Actions Footer */}
                <div className="bg-[#0B0B0C] border-t border-[#27272a] p-3 px-4 flex flex-wrap items-center gap-2">
                    <button 
                        onClick={handleCopy} 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 text-[10px] font-bold uppercase tracking-widest rounded transition-all"
                    >
                        <Copy className="w-3.5 h-3.5" /> Copiar
                    </button>

                    {validWaNumber ? (
                        <button 
                            onClick={handleWhatsApp} 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest rounded transition-all"
                        >
                            <MessageSquare className="w-3.5 h-3.5" /> Enviar
                        </button>
                    ) : (
                        <button 
                            disabled 
                            title="Número no válido" 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18181b] text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded cursor-not-allowed border border-[#27272a]"
                        >
                            <MessageSquare className="w-3.5 h-3.5 opacity-50" /> WA N/D
                        </button>
                    )}

                    {lead?.email ? (
                        <button 
                            onClick={handleEmail} 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d59f2]/10 hover:bg-[#0d59f2]/20 text-[#0d59f2] border border-[#0d59f2]/20 text-[10px] font-bold uppercase tracking-widest rounded transition-all"
                        >
                            <Mail className="w-3.5 h-3.5" /> {lead.email}
                        </button>
                    ) : (
                        <button 
                            disabled 
                            title="Sin email" 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18181b] text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded cursor-not-allowed border border-[#27272a]"
                        >
                            <Mail className="w-3.5 h-3.5 opacity-50" /> N/A
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActionCard;