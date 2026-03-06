import React, { useState } from 'react';
import { Loader2, RefreshCw, Target, Bot, AlertTriangle, Star, CheckCircle2 } from 'lucide-react';
import ActionCard from './ActionCard';
import { scoreStrategy, regenerateStrategy } from '../../../services/api'; 
import toast from 'react-hot-toast';

/**
 * MarioPanel
 * Renders the right-column MARIO copilot panel.
 * Shows: bot header, regenerate button, strategic block, parsed ActionCards, RLHF console.
 */
const MarioPanel = ({ lead, aiResponse, strategyId, isSpiderLoading, isAiLoading, onRegenerate, onFetchSpider }) => {
    
    // RLHF State
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);

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
            await onRegenerate(true); // Pass flag or call regenerate logic
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
        <div className="flex-1 flex flex-col bg-[#0B0B0C] border-l border-white/[0.05] relative shadow-xl h-full">
            {/* Decorative Background Blob */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="relative z-10 text-[9px] font-black text-white uppercase tracking-[0.2em] p-6 pb-4 border-b border-white/[0.05] flex items-center justify-between shadow-sm bg-[#0B0B0C]">
                <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                        <img src="/bot.png" alt="Bot Mario" className="w-8 h-8 rounded-full border border-emerald-500/30 object-cover shadow-[0_0_15px_rgba(52,211,153,0.2)]" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-[#0B0B0C]"></div>
                    </div>
                    <span className="text-slate-300 font-bold tracking-widest text-[10px] leading-tight flex flex-col">
                        <span>MARIO V2</span>
                        <span className="text-[8px] text-emerald-500/80">Neuro-Symbolic Closer</span>
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {!isSpiderLoading && !isAiLoading && !isRegenerating && aiResponse && (
                        <button
                            onClick={() => onRegenerate(false)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 border border-white/5 hover:border-emerald-500/30 transition-all rounded-lg shrink-0"
                            title="Regeneración Simple"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Refrescar</span>
                        </button>
                    )}
                    {(isSpiderLoading || isAiLoading || isRegenerating) && <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse"></div>}
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {isSpiderLoading || isAiLoading || isRegenerating ? (
                    <div className="h-full w-full flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono uppercase gap-4 absolute inset-0 z-50 bg-[#0B0B0C]/80 backdrop-blur-sm">
                        <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
                        <span>MARIO procesando war room...</span>
                    </div>
                ) : (
                    aiResponse ? (
                        <div className="h-full overflow-y-auto overflow-x-hidden p-6 gap-6 minimal-scrollbar flex flex-col pb-10">
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
                                    { key: parsedStrategy.sales_funnel_copy ? 'opening_message' : 'ataque_inicial', title: 'Primer Contacto', colorClass: 'text-emerald-400' },
                                    { key: parsedStrategy.sales_funnel_copy ? 'follow_up_pressure' : 'reaccion_ignorado', title: 'Seguimiento (48hs)', colorClass: 'text-rose-400' },
                                    { key: parsedStrategy.sales_funnel_copy ? 'closing_script' : 'reaccion_favorable', title: 'Script de Cierre', colorClass: 'text-emerald-400' },
                                    { key: parsedStrategy.sales_funnel_copy ? 'objection_handling' : 'reaccion_objecion', title: 'Resolución de Objeciones', colorClass: 'text-amber-400' },
                                ];

                                return (
                                    <>
                                        {/* FASE 2: UI - El Bloque Estratégico */}
                                        <div className="space-y-4">
                                            {isNoContext && (
                                                <div className="flex gap-3 text-amber-500 text-xs p-4 bg-amber-900/10 border border-amber-500/30 rounded-xl items-start">
                                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                                    <p>
                                                        <strong className="block font-semibold mb-1">Contexto RAG no encontrado</strong>
                                                        Carecemos de información de nicho específica en la base de datos para este rubro. MARIO ha aplicado lógica comercial genérica de alta conversión.
                                                    </p>
                                                </div>
                                            )}

                                            {approachOverview && (
                                                <div className="bg-slate-800/50 border border-white/5 rounded-xl p-5 shadow-inner">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Target className="w-4 h-4 text-emerald-400" />
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Resumen Estratégico</h4>
                                                    </div>
                                                    <p className="text-sm text-slate-300 leading-relaxed font-light mb-4">
                                                        {approachOverview}
                                                    </p>
                                                    
                                                    {(coreOffer || innovativeUpsell) && (
                                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                                                            {coreOffer && (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded-md">
                                                                    <CheckCircle2 className="w-3 h-3" /> Core Offer: {coreOffer}
                                                                </span>
                                                            )}
                                                            {innovativeUpsell && (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[10px] font-semibold rounded-md">
                                                                    <Target className="w-3 h-3" /> Upsell: {innovativeUpsell}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* FASE 3: UI - El Embudo de Acción */}
                                        <div className="space-y-4 relative mt-2">
                                            <div className="absolute top-0 left-6 bottom-0 w-[1px] bg-white/5 -z-10"></div>
                                            
                                            {cards.map(card => {
                                                const textContent = copyData[card.key];
                                                if (!textContent || typeof textContent !== 'string') return null;

                                                const salesRep = localStorage.getItem('salesRepName') || 'nuestro equipo';
                                                const processedForWA = textContent.replace(/\[TÚ\]/g, salesRep).replace(/\[Nombre del Prospector\]/g, salesRep).replace(/\[Tu Nombre\]/g, salesRep);

                                                return (
                                                    <ActionCard
                                                        key={card.key}
                                                        title={card.title}
                                                        textContent={textContent}
                                                        whatsAppText={processedForWA}
                                                        colorClass={card.colorClass}
                                                        icon={<Bot className="w-3 h-3" />}
                                                        lead={lead}
                                                    />
                                                );
                                            })}
                                        </div>

                                        {/* FASE 4: UI - La Consola RLHF */}
                                        {strategyId && (
                                            <div className="mt-8 bg-[#0B0B0C] ring-1 ring-white/10 rounded-xl p-5 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 rounded-full blur-2xl pointer-events-none"></div>
                                                
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 text-center">Califica la Estrategia (RLHF)</h4>
                                                
                                                <div className="flex items-center justify-center gap-2 mb-4">
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

                                                {rating > 0 && rating <= 3 && (
                                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                                        <textarea
                                                            value={feedback}
                                                            onChange={(e) => setFeedback(e.target.value)}
                                                            placeholder="¿Qué falló? (Ej: Sé más agresivo, enfócate en el dolor del staff, cambia el tono)..."
                                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/50 transition-all min-h-[80px] resize-none"
                                                        />
                                                        <button
                                                            onClick={handleRLHFSubmit}
                                                            disabled={!feedback.trim() || isRegenerating}
                                                            className="w-full mt-3 py-2.5 bg-accent-blue/10 hover:bg-accent-blue/20 disabled:bg-slate-800 disabled:text-slate-500 text-accent-blue border border-accent-blue/30 transition-all rounded-lg font-bold text-xs flex items-center justify-center gap-2 group"
                                                        >
                                                            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                                                            {isRegenerating ? 'Regenerando...' : 'Aplicar Corrección RLHF'}
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                {rating >= 4 && (
                                                    <div className="mt-4 animate-in fade-in zoom-in-95 flex flex-col items-center text-emerald-400 gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-xs font-semibold">¡Anotado! Estrategia Exitosa</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center p-8 absolute inset-0 z-0">
                            <div className="w-32 h-32 bg-accent-blue/5 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-[300px]">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#0B0B0C] to-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                    <Bot className="w-8 h-8 text-slate-500" />
                                </div>

                                <div>
                                    <h3 className="text-white font-black text-sm uppercase tracking-widest mb-2">Spider Inactivo</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Genera una radiografía SEO, detecta fricción tecnológica y arma el embudo de ventas exacto para este prospecto.
                                    </p>
                                </div>

                                <button
                                    onClick={onFetchSpider}
                                    className="w-full py-4 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/30 hover:border-accent-blue/50 transition-all rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.1)] hover:shadow-[0_0_30px_rgba(56,189,248,0.2)] group"
                                >
                                    <Target className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Analizar Web Inteligencia
                                </button>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default MarioPanel;
