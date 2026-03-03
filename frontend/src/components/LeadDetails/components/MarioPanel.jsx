import React from 'react';
import { Loader2, RefreshCw, Target, Bot } from 'lucide-react';
import ActionCard from './ActionCard';

/**
 * MarioPanel
 * Renders the right-column MARIO copilot panel. Props-only.
 * Shows: bot header, regenerate button, parsed ActionCards, loading/empty states.
 */
const MarioPanel = ({ lead, aiResponse, isSpiderLoading, isAiLoading, onRegenerate, onFetchSpider }) => {
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
                        <span>MARIO</span>
                        <span className="text-[8px] text-emerald-500/80">Neuro-Symbolic Closer</span>
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {!isSpiderLoading && !isAiLoading && aiResponse && (
                        <button
                            onClick={onRegenerate}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 border border-white/5 hover:border-emerald-500/30 transition-all rounded-lg shrink-0"
                            title="Forzar LLM"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Regenerar</span>
                        </button>
                    )}
                    {(isSpiderLoading || isAiLoading) && <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse"></div>}
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {isSpiderLoading || isAiLoading ? (
                    <div className="h-full w-full flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono uppercase gap-4 absolute inset-0">
                        <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
                        <span>SPIDER Engine procesando...</span>
                    </div>
                ) : (
                    aiResponse ? (
                        <div className="h-full overflow-y-auto overflow-x-hidden p-6 gap-4 minimal-scrollbar flex flex-col">
                            {(() => {
                                let parsedStrategy;
                                try {
                                    let cleanJSON = aiResponse;
                                    if (cleanJSON.startsWith('```json')) {
                                        cleanJSON = cleanJSON.replace(/^```json\n/, '').replace(/\n```$/, '');
                                    }
                                    parsedStrategy = JSON.parse(cleanJSON);
                                } catch (e) {
                                    return (
                                        <div className="text-red-400 text-xs p-4 bg-red-900/10 border border-red-900/20 rounded-xl">
                                            Error parseando Battlecard. Respuesta cruda:<br />
                                            {aiResponse}
                                        </div>
                                    );
                                }

                                const cards = [
                                    { key: 'ataque_inicial', title: '🗡️ El Ataque Inicial (Ahora)', colorClass: 'text-emerald-400' },
                                    { key: 'reaccion_ignorado', title: '🔴 Si te ignoran (En 48hs)', colorClass: 'text-rose-400' },
                                    { key: 'reaccion_favorable', title: '🟢 Si responden favorable', colorClass: 'text-emerald-400' },
                                    { key: 'reaccion_objecion', title: '🟡 Si hay objeción', colorClass: 'text-amber-400' },
                                ];

                                return cards.map(card => {
                                    const textContent = parsedStrategy[card.key];
                                    if (!textContent) return null;

                                    const salesRep = localStorage.getItem('salesRepName') || 'nuestro equipo';
                                    const processedForWA = textContent.replace(/\[TÚ\]/g, salesRep).replace(/\[Nombre del Prospector\]/g, salesRep).replace(/\[Tu Nombre\]/g, salesRep);

                                    return (
                                        <ActionCard
                                            key={card.key}
                                            title={card.title}
                                            textContent={textContent}
                                            whatsAppText={processedForWA}
                                            colorClass={card.colorClass}
                                            icon={<Target className="w-3 h-3" />}
                                            lead={lead}
                                        />
                                    );
                                });
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
