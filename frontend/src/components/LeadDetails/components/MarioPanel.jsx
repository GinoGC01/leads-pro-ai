import React, { useState } from 'react';
import { Loader2, RefreshCw, Target, Bot, AlertTriangle, Star, CheckCircle2, MessageSquareText, ShieldAlert, Zap } from 'lucide-react';
import ActionCard from './ActionCard';
import { scoreStrategy, regenerateStrategy, getAgencySettings } from '../../../services/api'; 
import toast from 'react-hot-toast';
import { useEffect } from 'react';

/**
 * MarioPanel
 * Renders the right-column MARIO copilot panel.
 * Shows: bot header, regenerate button, strategic block, parsed ActionCards, RLHF console.
 * Styled with Stitch 'War Room' Aesthetic
 */
const MarioPanel = ({ lead, aiResponse, strategyId, isSpiderLoading, isAiLoading, pipelineMetadata, pipelineProgress, onRegenerate, onFetchSpider }) => {
    
    // V10.4 State
    const [messageType, setMessageType] = useState('base'); // 'base' or 'upsell'
    const [objectionMode, setObjectionMode] = useState('STANDARD'); // 'STANDARD' or 'CUSTOM'
    const [activeObjection, setActiveObjection] = useState(null);

    // RLHF State
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [agencySettings, setAgencySettings] = useState({ sales_rep_name: 'Mario', agency_name: 'Leads Pro AI' });
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await getAgencySettings();
                if (response.data && response.data.success) {
                    setAgencySettings(response.data);
                    if (response.data.mario_objection_mode) {
                        setObjectionMode(response.data.mario_objection_mode);
                    }
                }
            } catch (error) {
                console.warn("[MarioPanel] Error fetching settings, using defaults:", error);
            }
        };
        fetchSettings();
    }, []);

    // Elapsed time counter during loading
    useEffect(() => {
        let timer;
        if (isSpiderLoading || isAiLoading || isRegenerating) {
            setElapsedSeconds(0);
            timer = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
        } else {
            setElapsedSeconds(0);
        }
        return () => clearInterval(timer);
    }, [isSpiderLoading, isAiLoading, isRegenerating]);

    const handleObjectionModeChange = async (mode) => {
        setObjectionMode(mode);
        try {
            // Partial update supported by backend
            await updateAgencySettings({ mario_objection_mode: mode });
            toast.success(`Cerebro Mario: ${mode === 'CUSTOM' ? 'Tecnico' : 'Estandar'}`, { id: 'mario-mode' });
        } catch (error) {
            console.error("[MarioPanel] Error persisting mode:", error);
        }
    };

    const personalizedGreeting = `Hola! soy ${agencySettings.sales_rep_name} de ${agencySettings.agency_name}.`;

    const handleRLHFSubmit = async () => {
        if (!strategyId) {
            toast.error("No hay ID de estrategia para enviar feedback.");
            return;
        }
        
        try {
            setIsRegenerating(true);
            await scoreStrategy(strategyId, rating, feedback);
            toast.loading("Reforzando aprendizaje y regenerando estrategia...", { id: 'rlhf' });
            await onRegenerate(true, { objection_mode: objectionMode });
            toast.success("Estrategia regenerada via RLHF", { id: 'rlhf' });
            setRating(0);
            setFeedback('');
        } catch (error) {
            console.error("Error with RLHF/Regeneration:", error);
            toast.error("Error al procesar el feedback o regenerar.", { id: 'rlhf' });
        } finally {
            setIsRegenerating(false);
        }
    };

    // Pipeline agent labels/descriptions
    const AGENT_META = {
        RESEARCHER: { label: 'Researcher', desc: 'Analizando datos del prospecto' },
        STRATEGIST: { label: 'Strategist', desc: 'Disenando plan de batalla' },
        COPYWRITER: { label: 'Copywriter', desc: 'Escribiendo copy de cierre' },
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
                        <div className="flex items-center gap-2">
                            <h1 className="text-xs font-bold tracking-widest uppercase text-slate-400">MARIO {pipelineMetadata?.version === 'V11_MULTI_AGENT' ? 'V11' : 'V10.4'}</h1>
                            {pipelineMetadata?.version === 'V11_MULTI_AGENT' && (
                                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">Multi-Agent</span>
                            )}
                            {pipelineMetadata?.version === 'V10.4_FALLBACK' && (
                                <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">Fallback</span>
                            )}
                        </div>
                        <p className="text-[14px] font-bold leading-none text-slate-100 mt-1">Sales Orchestration Engine</p>
                        {pipelineMetadata && pipelineMetadata.total_tokens > 0 && (
                            <p className="text-[9px] text-slate-500 mt-1 font-mono">
                                {pipelineMetadata.total_tokens} tokens · ${pipelineMetadata.total_cost_usd?.toFixed(4)} USD
                                {pipelineMetadata.agent_timings && ` · ${Object.values(pipelineMetadata.agent_timings).reduce((a, b) => a + b, 0)}ms`}
                            </p>
                        )}
                    </div>
                </div>
                {(!isSpiderLoading && !isAiLoading && !isRegenerating && aiResponse && ['Nuevo', 'Descartados', 'Sin WhatsApp'].includes(lead?.status)) && (
                    <button
                        onClick={() => onRegenerate(false, { objection_mode: objectionMode })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#27272a] bg-[#18181b] hover:bg-slate-800 transition-colors text-xs font-bold text-slate-300"
                        title="Regeneracion Simple"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refrescar
                    </button>
                )}
                {(isSpiderLoading || isAiLoading || isRegenerating) && <div className="w-2 h-2 rounded-full bg-[#0d59f2] animate-pulse"></div>}
            </header>

            <main className="flex-1 overflow-y-auto px-5 py-6 space-y-8 minimal-scrollbar relative">
                {isSpiderLoading || isAiLoading || isRegenerating ? (
                    <div className="h-full w-full flex flex-col items-center justify-center absolute inset-0 z-50 bg-[#09090b]/90 backdrop-blur-sm">
                        {/* Pipeline Timeline Loader */}
                        <div className="w-full max-w-[320px] space-y-0">
                            <div className="text-center mb-8">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Pipeline Multi-Agent</p>
                                <p className="text-[11px] text-slate-600 font-mono">{elapsedSeconds}s transcurridos</p>
                            </div>

                            {['RESEARCHER', 'STRATEGIST', 'COPYWRITER'].map((agentKey, idx) => {
                                const progressAgent = pipelineProgress?.agents?.find(a => a.name === agentKey);
                                const status = progressAgent?.status || 'pending';
                                const duration = progressAgent?.duration_ms;
                                const meta = AGENT_META[agentKey];
                                const isLast = idx === 2;

                                return (
                                    <div key={agentKey} className="flex gap-4">
                                        {/* Timeline Connector */}
                                        <div className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-500 ${
                                                status === 'done' 
                                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                                                    : status === 'running'
                                                    ? 'bg-[#0d59f2]/20 border-[#0d59f2] text-[#0d59f2] animate-pulse'
                                                    : 'bg-[#18181b] border-[#27272a] text-slate-600'
                                            }`}>
                                                {status === 'done' ? (
                                                    <CheckCircle2 className="w-4 h-4" />
                                                ) : status === 'running' ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <span>{idx + 1}</span>
                                                )}
                                            </div>
                                            {!isLast && (
                                                <div className={`w-px h-10 my-1 transition-all duration-500 ${
                                                    status === 'done' ? 'bg-emerald-500/40' : 'bg-[#27272a]'
                                                }`}></div>
                                            )}
                                        </div>

                                        {/* Agent Info */}
                                        <div className="pb-3 pt-1">
                                            <div className="flex items-center gap-2">
                                                <p className={`text-[12px] font-bold uppercase tracking-wide transition-colors duration-500 ${
                                                    status === 'done' 
                                                        ? 'text-emerald-400' 
                                                        : status === 'running'
                                                        ? 'text-[#0d59f2]'
                                                        : 'text-slate-600'
                                                }`}>
                                                    {meta.label}
                                                </p>
                                                {status === 'done' && duration && (
                                                    <span className="text-[9px] text-slate-500 font-mono">
                                                        {(duration / 1000).toFixed(1)}s
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-[11px] transition-colors duration-500 ${
                                                status === 'running' ? 'text-slate-400' : 'text-slate-600'
                                            }`}>
                                                {status === 'done' ? 'Completado' : status === 'running' ? meta.desc : 'En espera'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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

                                const isV10_4 = !!parsedStrategy.timeline;
                                const resume = parsedStrategy.resumen_orquestacion || parsedStrategy.strategic_planning?.approach_overview;
                                const timeline = parsedStrategy.timeline || [];
                                const coreTarget = parsedStrategy.core_target;
                                const objectionTree = parsedStrategy.objection_tree || {};

                                return (
                                    <>
                                        {/* V10.4 Strategic Timeline */}
                                        {isV10_4 && (
                                            <section>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                                                        <Target className="w-5 h-5 text-emerald-500" />
                                                        Pipeline Orchestration
                                                    </h2>
                                                    {coreTarget && (
                                                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                                                            Target: {coreTarget}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 mb-6">
                                                    <p className="text-[13px] text-slate-400 italic mb-6">"{resume}"</p>
                                                    <div className="space-y-4">
                                                        {timeline.map((step, idx) => (
                                                            <div key={idx} className="flex gap-4 group">
                                                                <div className="flex flex-col items-center">
                                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-emerald-500 text-slate-900' : 'bg-[#27272a] text-slate-500'}`}>
                                                                        {step.step || idx + 1}
                                                                    </div>
                                                                    {idx < timeline.length - 1 && <div className="w-px h-full bg-[#27272a] my-1"></div>}
                                                                </div>
                                                                <div className="pb-4">
                                                                    <p className="text-[13px] text-slate-200 group-hover:text-emerald-400 transition-colors uppercase font-bold tracking-tight mb-1">Paso {step.step || idx + 1}</p>
                                                                    <p className="text-[12px] text-slate-500 leading-relaxed font-mono">{step.action}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </section>
                                        )}

                                        {/* Dual-Copy Selector & Main Message */}
                                        <section className="space-y-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Primary Weapon</h2>
                                                {isV10_4 && (
                                                    <div className="flex gap-2">
                                                        <div className="flex bg-[#18181b] border border-[#27272a] rounded-lg p-1" title="Modo de Objeciones">
                                                            <button 
                                                                onClick={() => handleObjectionModeChange('STANDARD')}
                                                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${objectionMode === 'STANDARD' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                                            >
                                                                Std
                                                            </button>
                                                            <button 
                                                                onClick={() => handleObjectionModeChange('CUSTOM')}
                                                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${objectionMode === 'CUSTOM' ? 'bg-[#0d59f2] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                                            >
                                                                Cust
                                                            </button>
                                                        </div>
                                                        <div className="flex bg-[#18181b] border border-[#27272a] rounded-lg p-1">
                                                            <button 
                                                                onClick={() => setMessageType('base')}
                                                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${messageType === 'base' ? 'bg-[#0d59f2] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                                            >
                                                                Base
                                                            </button>
                                                            <button 
                                                                onClick={() => setMessageType('upsell')}
                                                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${messageType === 'upsell' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                                            >
                                                                Upsell
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {(() => {
                                                const textContent = isV10_4 
                                                    ? (messageType === 'base' ? parsedStrategy.mensaje_base : parsedStrategy.mensaje_con_upsell)
                                                    : (parsedStrategy.sales_funnel_copy?.opening_message || parsedStrategy.ataque_inicial);
                                                
                                                if (!textContent) return null;

                                                const salesRep = localStorage.getItem('salesRepName') || agencySettings.sales_rep_name || 'nuestro equipo';
                                                
                                                // Robust Injection: Prepend if token is missing
                                                let finalContent = textContent;
                                                if (!finalContent.includes('[PERSONALIZED_GREETING]')) {
                                                    finalContent = `[PERSONALIZED_GREETING] ${finalContent}`;
                                                }

                                                const processedForWA = finalContent
                                                    .replace(/\[PERSONALIZED_GREETING\]/g, personalizedGreeting)
                                                    .replace(/\[TÚ\]/g, salesRep).replace(/\[Nombre del Prospector\]/g, salesRep).replace(/\[Tu Nombre\]/g, salesRep);
                                                
                                                const displayContent = finalContent.replace(/\[PERSONALIZED_GREETING\]/g, personalizedGreeting);

                                                return (
                                                    <ActionCard
                                                        title={messageType === 'base' ? 'Mensaje Base' : 'Mensaje c/ Upsell'}
                                                        subtitle="Ataque Directo"
                                                        textContent={displayContent}
                                                        whatsAppText={processedForWA}
                                                        colorClass={messageType === 'base' ? 'text-[#0d59f2]' : 'text-emerald-500'}
                                                        borderColor={messageType === 'base' ? 'border-l-[#0d59f2]' : 'border-l-emerald-500'}
                                                        icon={messageType === 'base' ? <MessageSquareText className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                                                        lead={lead}
                                                    />
                                                );
                                            })()}
                                        </section>

                                        {/* Dynamic Objection Tree */}
                                        {isV10_4 && (
                                            <section>
                                                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Objection Defense</h2>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {Object.entries(objectionTree).map(([key, value]) => {
                                                        // Objections must NOT have greeting — they start directly with the response
                                                        const finalObjection = value;

                                                        const processedWaObjection = finalObjection
                                                            .replace(/\[PERSONALIZED_GREETING\]/g, '')
                                                            .replace(/\[Empresa\]/g, lead.name)
                                                            .replace(/\[TÚ\]/g, agencySettings.sales_rep_name)
                                                            .trim();
                                                        
                                                        const displayObjection = finalObjection.replace(/\[PERSONALIZED_GREETING\]/g, '').trim();

                                                        return (
                                                            <ActionCard 
                                                                key={key}
                                                                title={`Defensa: ${key}`}
                                                                subtitle="Contragolpe Psicológico"
                                                                textContent={displayObjection}
                                                                whatsAppText={processedWaObjection}
                                                                colorClass="text-slate-200"
                                                                borderColor="border-l-slate-600"
                                                                icon={<ShieldAlert className="w-5 h-5 text-[#0d59f2]" />}
                                                                lead={lead}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </section>
                                        )}

                                        {/* Legacy Actions (if not V10.4) */}
                                        {!isV10_4 && (
                                            <section className="space-y-4">
                                                {/* (Keep existing card mapping for backward compatibility if needed, or omit if V10.4 is full migration) */}
                                                {['reaccion_ignorado', 'reaccion_favorable', 'reaccion_objecion'].map((key) => {
                                                    const textContent = parsedStrategy[key];
                                                    if (!textContent) return null;
                                                    return (
                                                        <ActionCard
                                                            key={key}
                                                            title={key.replace(/_/g, ' ')}
                                                            textContent={textContent}
                                                            lead={lead}
                                                            // ... other props
                                                        />
                                                    );
                                                })}
                                            </section>
                                        )}

                                        {/* RLHF Console */}
                                        {strategyId && (
                                            <div className="mt-8 bg-[#18181b] border border-[#27272a] rounded-2xl p-5 shadow-2xl relative">
                                                <div className="flex items-center justify-between mb-5 border-b border-[#27272a] pb-3">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2" title="Califica la redacción. El sistema se auto-optimiza al agendar cita o si el lead ignora el mensaje.">
                                                        <Star className="w-4 h-4 text-yellow-500" /> Calibración IA (Engagement)
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
                                    onClick={() => onFetchSpider({ objection_mode: objectionMode })}
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
