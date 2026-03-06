import React, { useState } from 'react';
import { Loader2, RefreshCw, Target, Bot, AlertTriangle, Star, CheckCircle2, MessageSquareText, ShieldAlert, Zap } from 'lucide-react';
import ActionCard from './ActionCard';
import { scoreStrategy, regenerateStrategy } from '../../../services/api'; 
import toast from 'react-hot-toast';

/**
 * MarioPanel
 * Renders the right-column MARIO copilot panel.
 * Shows: bot header, regenerate button, strategic block, parsed ActionCards, RLHF console.
 * Styled with Stitch 'War Room' Aesthetic
 */
const MarioPanel = ({ lead, aiResponse, strategyId, isSpiderLoading, isAiLoading, onRegenerate, onFetchSpider }) => {
    
    // RLHF State
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isUpsellAdded, setIsUpsellAdded] = useState(false);

    const handleRLHFSubmit = async () => {
        if (!strategyId) {
            toast.error("No hay ID de estrategia para enviar feedback.");
            return;
        }
        
        try {
            setIsRegenerating(true);
            
            // 1. Submit the score and feedback
            await scoreStrategy(strategyId, rating, feedback);
            
            // 2. Trigger regeneration if low score
            toast.loading("Reforzando aprendizaje y regenerando estrategia...", { id: 'rlhf' });
            await onRegenerate(true);
            toast.success("Estrategia regenerada vía RLHF", { id: 'rlhf' });
            
            // Reset state
            setRating(0);
            setFeedback('');
        } catch (error) {
            console.error("Error with RLHF/Regeneration:", error);
            toast.error("Error al procesar el feedback o regenerar.", { id: 'rlhf' });
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-[#09090b] text-slate-100 border-l border-[#27272a] relative shadow-xl h-full font-sans">
            
            {/* Header Section */}
            <header className="sticky top-0 z-50 bg-[#18181b]/80 backdrop-blur-md border-b border-[#27272a] px-5 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Bot className="text-emerald-500 w-8 h-8" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                    </div>
                    <div>
                        <h1 className="text-xs font-bold tracking-widest uppercase text-slate-400">MARIO V2</h1>
                        <p className="text-[14px] font-bold leading-none text-slate-100 mt-1">Neuro-Symbolic Closer</p>
                    </div>
                </div>
                {!isSpiderLoading && !isAiLoading && !isRegenerating && aiResponse && (
                    <button
                        onClick={() => onRegenerate(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#27272a] bg-[#18181b] hover:bg-slate-800 transition-colors text-xs font-bold text-slate-300"
                        title="Regeneración Simple"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refrescar
                    </button>
                )}
                {(isSpiderLoading || isAiLoading || isRegenerating) && <div className="w-2 h-2 rounded-full bg-[#0d59f2] animate-pulse"></div>}
            </header>

            <main className="flex-1 overflow-y-auto px-5 py-6 space-y-8 minimal-scrollbar relative">
                {isSpiderLoading || isAiLoading || isRegenerating ? (
                    <div className="h-full w-full flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono uppercase gap-4 absolute inset-0 z-50 bg-[#09090b]/80 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0d59f2]" />
                        <span>MARIO procesando war room...</span>
                    </div>
                ) : (
                    aiResponse ? (
                        <>
                            {(() => {
                                let parsedStrategy;
                                if (typeof aiResponse === 'object' && aiResponse !== null) {
                                    parsedStrategy = aiResponse;
                                } else {
                                    try {
                                        let cleanJSON = aiResponse;
                                        if (typeof cleanJSON === 'string' && cleanJSON.startsWith('```json')) {
                                            cleanJSON = cleanJSON.replace(/^```json\n/, '').replace(/\n```$/, '');
                                        }
                                        parsedStrategy = JSON.parse(cleanJSON);
                                    } catch (e) {
                                        return (
                                            <div className="text-red-400 text-xs p-4 bg-red-900/10 border border-red-900/20 rounded-xl overflow-x-auto whitespace-pre-wrap">
                                                Error parseando Battlecard. Respuesta cruda:<br />
                                                {typeof aiResponse === 'object' ? JSON.stringify(aiResponse, null, 2) : aiResponse}
                                            </div>
                                        );
                                    }
                                }

                                const ragCited = parsedStrategy?.internal_reasoning?.rag_sources_cited;
                                const isNoContext = ragCited === 'NO_CONTEXT_FOUND';
                                
                                const approachOverview = parsedStrategy?.strategic_planning?.approach_overview;
                                const coreOffer = parsedStrategy?.solution_architecture?.core_offer;
                                const innovativeUpsell = parsedStrategy?.solution_architecture?.innovative_upsell;

                                const copyData = parsedStrategy?.sales_funnel_copy || parsedStrategy;

                                const cards = [
                                    { key: parsedStrategy.sales_funnel_copy ? 'opening_message' : 'ataque_inicial', title: 'Primer Contacto', colorClass: 'text-[#0d59f2]', borderColor: 'border-l-[#0d59f2]', icon: <MessageSquareText className="w-5 h-5" />, subtitle: 'Ataque sugerido' },
                                    { key: parsedStrategy.sales_funnel_copy ? 'follow_up_pressure' : 'reaccion_ignorado', title: 'Seguimiento (48hs)', colorClass: 'text-emerald-500', borderColor: 'border-l-emerald-500', icon: <RefreshCw className="w-5 h-5" />, subtitle: 'Reactivación' },
                                    { key: parsedStrategy.sales_funnel_copy ? 'closing_script' : 'reaccion_favorable', title: 'Script de Cierre', colorClass: 'text-slate-100', borderColor: 'border-l-slate-600', icon: <Zap className="w-5 h-5" />, subtitle: 'Llamado a la acción' },
                                    { key: parsedStrategy.sales_funnel_copy ? 'objection_handling' : 'reaccion_objecion', title: 'Resolución de Objeciones', colorClass: 'text-amber-500', borderColor: 'border-l-amber-500', icon: <ShieldAlert className="w-5 h-5" />, subtitle: 'Manejo defensivo' },
                                ];

                                return (
                                    <>
                                        {/* AI Context Alert */}
                                        {isNoContext && (
                                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                                <div className="flex items-start gap-3">
                                                    <div className="bg-amber-500/20 p-2 rounded-lg shrink-0">
                                                        <AlertTriangle className="text-amber-500 w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-amber-500 font-bold text-sm uppercase tracking-wider mb-1">Falta de Contexto</h3>
                                                        <p className="text-slate-300 text-[13px] leading-relaxed">
                                                            <code className="text-amber-500/80 font-mono text-xs bg-amber-500/10 px-1 py-0.5 rounded mr-1">NO_CONTEXT_FOUND</code> 
                                                            Se requiere información de nicho en la base de datos RAG para optimizar. MARIO aplicó lógica comercial genérica de alta conversión como respaldo.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Strategic Block */}
                                        {approachOverview && (
                                            <section>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                                                        <Target className="w-5 h-5 text-emerald-500" />
                                                        Resumen Estratégico
                                                    </h2>
                                                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">Live Ops</span>
                                                </div>
                                                <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 shadow-inner">
                                                    <p className="text-[14px] text-slate-300 leading-relaxed font-light mb-5">
                                                        {approachOverview}
                                                    </p>
                                                    
                                                    {(coreOffer || innovativeUpsell) && (
                                                        <div className="flex flex-wrap gap-3">
                                                            {coreOffer && (
                                                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#09090b] border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                                    <span className="text-xs font-medium text-slate-200">Core Offer: {coreOffer}</span>
                                                                </div>
                                                            )}
                                                            {innovativeUpsell && (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#09090b] border border-[#0d59f2]/30 shadow-[0_0_10px_rgba(13,89,242,0.05)]">
                                                                        <span className="w-2 h-2 rounded-full bg-[#0d59f2]"></span>
                                                                        <span className="text-xs font-medium text-slate-200">Upsell: {innovativeUpsell}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            if (isRegenerating || isUpsellAdded) return;
                                                                            setIsRegenerating(true);
                                                                            onRegenerate(true, { force_upsell: true })
                                                                                .then(() => setIsUpsellAdded(true))
                                                                                .catch((e) => toast.error("Error al inyectar upsell."))
                                                                                .finally(() => setIsRegenerating(false));
                                                                        }}
                                                                        disabled={isRegenerating || isUpsellAdded}
                                                                        className={`text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 transition-all outline-none ${
                                                                            isUpsellAdded 
                                                                                ? 'text-emerald-500 cursor-default' 
                                                                                : 'text-slate-500 hover:text-slate-200'
                                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                        title="Inyectar estratégico en copy"
                                                                    >
                                                                        {isRegenerating ? (
                                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                                        ) : isUpsellAdded ? (
                                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                                        ) : null}
                                                                        {isUpsellAdded ? 'Agregado' : 'Añadir al Copy'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </section>
                                        )}

                                        {/* Sales Funnel Action Cards */}
                                        <section className="space-y-4">
                                            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Pipeline Protocol</h2>
                                            
                                            {cards.map(card => {
                                                const textContent = copyData[card.key];
                                                if (!textContent || typeof textContent !== 'string') return null;

                                                const salesRep = localStorage.getItem('salesRepName') || 'nuestro equipo';
                                                const processedForWA = textContent.replace(/\[TÚ\]/g, salesRep).replace(/\[Nombre del Prospector\]/g, salesRep).replace(/\[Tu Nombre\]/g, salesRep);

                                                return (
                                                    <ActionCard
                                                        key={card.key}
                                                        title={card.title}
                                                        subtitle={card.subtitle}
                                                        textContent={textContent}
                                                        whatsAppText={processedForWA}
                                                        colorClass={card.colorClass}
                                                        borderColor={card.borderColor}
                                                        icon={card.icon}
                                                        lead={lead}
                                                    />
                                                );
                                            })}
                                        </section>

                                        {/* RLHF Console */}
                                        {strategyId && (
                                            <div className="mt-8 bg-[#18181b] border border-[#27272a] rounded-2xl p-5 shadow-2xl relative">
                                                <div className="flex items-center justify-between mb-5 border-b border-[#27272a] pb-3">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Star className="w-4 h-4 text-yellow-500" /> Feedback RLHF
                                                    </span>
                                                    <div className="flex gap-1.5">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                onClick={() => setRating(star)}
                                                                onMouseEnter={() => setHoverRating(star)}
                                                                onMouseLeave={() => setHoverRating(0)}
                                                                className="focus:outline-none transition-transform hover:scale-110"
                                                            >
                                                                <Star 
                                                                    className={`w-6 h-6 transition-colors ${
                                                                        (hoverRating || rating) >= star 
                                                                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' 
                                                                            : 'text-slate-600'
                                                                    }`} 
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {rating > 0 && rating <= 3 && (
                                                    <div className="animate-in fade-in slide-in-from-top-2 mb-4">
                                                        <textarea
                                                            value={feedback}
                                                            onChange={(e) => setFeedback(e.target.value)}
                                                            placeholder="¿Qué falló? (Ej: Sé más agresivo, enfócate en el dolor del staff, cambia el tono)..."
                                                            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-[#0d59f2]/50 focus:ring-1 focus:ring-[#0d59f2]/50 transition-all min-h-[80px] resize-none"
                                                        />
                                                    </div>
                                                )}
                                                
                                                {rating > 0 && (
                                                    <button
                                                        onClick={rating <= 3 ? handleRLHFSubmit : () => toast.success("¡Gracias por tu feedback positivo!")}
                                                        disabled={(rating <= 3 && !feedback.trim()) || isRegenerating}
                                                        className={`w-full ${rating <= 3 ? 'bg-[#0d59f2] hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95`}
                                                    >
                                                        {rating <= 3 ? (
                                                            <>
                                                                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                                                                {isRegenerating ? 'Regenerando...' : 'Regenerate Strategy'}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle2 className="w-5 h-5" />
                                                                Confirmar Estrategia Activa
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        <div className="h-6"></div> {/* Bottom padding element */}
                                    </>
                                );
                            })()}
                        </>
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center absolute inset-0 z-0">
                            <div className="w-32 h-32 bg-[#0d59f2]/5 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-[300px]">
                                <div className="w-16 h-16 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                    <Bot className="w-8 h-8 text-slate-500" />
                                </div>

                                <div>
                                    <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-2">War Room Inactivo</h3>
                                    <p className="text-[13px] text-slate-400 leading-relaxed">
                                        Genera una radiografía SEO, detecta fricción tecnológica y arma el embudo de ventas exacto para este prospecto.
                                    </p>
                                </div>

                                <button
                                    onClick={onFetchSpider}
                                    className="w-full py-4 bg-[#0d59f2]/10 hover:bg-[#0d59f2]/20 text-[#0d59f2] border border-[#0d59f2]/30 hover:border-[#0d59f2]/50 transition-all rounded-xl font-bold text-[12px] uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <Target className="w-4 h-4" />
                                    Analizar Web Inteligencia
                                </button>
                            </div>
                        </div>
                    )
                )}
            </main>
        </div>
    );
};

export default MarioPanel;
