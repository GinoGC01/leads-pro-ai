import React, { useState, useEffect } from 'react';
import { Sparkles, Globe, MapPin, Phone, MessageSquare, AlertCircle, Loader2, CheckCircle2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import Tooltip from './Tooltip';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const LeadDetailsPanel = ({ lead: initialLead, onClose, onLeadUpdate }) => {
    const [lead, setLead] = useState(initialLead);
    const [isActivating, setIsActivating] = useState(false);
    const [error, setError] = useState(null);
    const [aiResponse, setAiResponse] = useState(lead.tactical_response || '');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const handleTacticalAction = async (prompt, label) => {
        setIsAiLoading(true);
        setAiResponse('');
        setError(null);
        try {
            const { data } = await api.post('/ai/chat', {
                query: prompt,
                leadId: lead._id
            });
            setAiResponse(data.answer);
        } catch (err) {
            setError(`Error al generar ${label}`);
        } finally {
            setIsAiLoading(false);
        }
    };

    // Polling for status if it's pending
    useEffect(() => {
        let interval;
        if (lead.enrichmentStatus === 'pending') {
            interval = setInterval(async () => {
                try {
                    const { data } = await api.get(`/vortex/status/${lead._id}`);
                    if (data.status === 'completed') {
                        // Refresh full lead data
                        const { data: updatedLead } = await api.get(`/leads/${lead._id}`);
                        setLead(updatedLead);
                        if (onLeadUpdate) onLeadUpdate(updatedLead);
                        clearInterval(interval);
                    } else if (data.status === 'failed') {
                        setLead(prev => ({ ...prev, enrichmentStatus: 'failed' }));
                        clearInterval(interval);
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [lead.enrichmentStatus, lead._id]);

    const handleActivateVortex = async () => {
        setIsActivating(true);
        setError(null);
        try {
            const { data } = await api.post(`/vortex/enrich/${lead._id}`);
            setLead(prev => ({ ...prev, enrichmentStatus: 'pending' }));
            if (onLeadUpdate) onLeadUpdate({ ...lead, enrichmentStatus: 'pending' });
        } catch (err) {
            setError(err.response?.data?.message || 'Error al activar Vortex');
        } finally {
            setIsActivating(false);
        }
    };

    if (!lead) return null;

    const isUnprocessed = lead.enrichmentStatus === 'unprocessed';
    const isProcessing = lead.enrichmentStatus === 'pending';
    const isCompleted = lead.enrichmentStatus === 'completed';
    const isFailed = lead.enrichmentStatus === 'failed';

    return (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl z-[60] flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{lead.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.opportunityLevel} Priority Lead</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24">
                {/* Basic Info */}
                <section className="space-y-3">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                        <span className="text-sm text-slate-600">{lead.address}</span>
                    </div>
                    {lead.website && (
                        <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-slate-400" />
                            <a href={lead.website} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline font-medium">
                                {lead.website.replace('https://', '').replace('http://', '').split('/')[0]}
                            </a>
                        </div>
                    )}
                    {lead.phoneNumber && (
                        <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600 font-mono">{lead.phoneNumber}</span>
                        </div>
                    )}
                </section>

                <section className="relative">
                    {!isCompleted ? (
                        <div className={`rounded-2xl p-6 border-2 transition-all duration-500 ${isProcessing ? 'bg-indigo-50 border-indigo-200' : isFailed ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-xl ${isProcessing ? 'bg-indigo-600 animate-pulse shadow-lg' : isFailed ? 'bg-red-600' : 'bg-slate-200'} text-white`}>
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none mb-1">Vortex Intelligence</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                                        {isFailed ? 'Error en Escaneo' : 'Escaneo de Vulnerabilidades & Tech'}
                                    </p>
                                </div>
                            </div>

                            {(isUnprocessed || isFailed) && (
                                <div className="space-y-4">
                                    {isFailed && (
                                        <div className="p-3 bg-white/50 rounded-xl border border-red-200">
                                            <p className="text-[10px] font-black text-red-600 uppercase tracking-tighter mb-1">Motivo del fallo:</p>
                                            <p className="text-xs text-red-700 font-mono italic break-words leading-tight">
                                                {lead.enrichmentError || 'Error desconocido durante la extracción'}
                                            </p>
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-500 leading-relaxed italic">
                                        {isFailed ? 'Algo salió mal. Verifica que el sitio web sea accesible y vuelve a activar el motor.' : 'Vortex está actualmente inactivo para este prospecto. Actívalo para obtener auditoría SEO, stack tecnológico y sales angles.'}
                                    </p>
                                    <button
                                        onClick={handleActivateVortex}
                                        disabled={isActivating || !lead.website}
                                        className={`w-full py-3 ${isFailed ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:bg-slate-400 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2`}
                                    >
                                        {isActivating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-4 h-4" />
                                        )}
                                        {isFailed ? 'Reintentar Análisis' : 'Activar Vortex Intelligence'}
                                    </button>
                                    {!lead.website && (
                                        <p className="text-[9px] text-red-500 font-bold text-center uppercase">Requiere sitio web para análisis</p>
                                    )}
                                </div>
                            )}

                            {isProcessing && (
                                <div className="space-y-4 py-4 text-center">
                                    <div className="flex justify-center">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-indigo-400 blur-xl opacity-20 animate-pulse"></div>
                                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-black text-indigo-700 uppercase tracking-tighter">Engaging Deep Scraper...</p>
                                        <div className="w-full bg-indigo-100 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-indigo-600 h-full w-1/3 animate-progress-indeterminate"></div>
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-bold italic uppercase">Bypassing WAF & Collecting Metadata...</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-[10px] text-red-600 font-bold uppercase">{error}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Dashboard de Métricas Empíricas */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Opportunity Score */}
                                <Tooltip text="Potencial de cierre. >70 indica alta probabilidad de venta." position="bottom">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between h-[110px] w-full">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opportunity</p>
                                            <div className={`w-2 h-2 rounded-full ${lead.leadOpportunityScore > 70 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-500'}`}></div>
                                        </div>
                                        <p className={`text-2xl font-black ${lead.leadOpportunityScore > 70 ? 'text-emerald-600' : 'text-slate-800'}`}>
                                            {lead.leadOpportunityScore}<span className="text-xs ml-0.5 opacity-40">/100</span>
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">{lead.opportunityLevel}</p>
                                    </div>
                                </Tooltip>

                                {/* Performance Score */}
                                <Tooltip text="Puntuación Google Lighthouse. < 50 es crítico (Fuerte ángulo de venta)." position="bottom">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between h-[110px] w-full">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Performance</p>
                                            <Tooltip text="TTFB > 600ms indica servidor lento o falta de caché.">
                                                <Loader2 className={`w-3 h-3 ${lead.performance_metrics?.performance_issue ? 'text-red-500' : 'text-emerald-500'}`} />
                                            </Tooltip>
                                        </div>
                                        <p className={`text-2xl font-black ${lead.performance_metrics?.performance_issue ? 'text-red-500' : 'text-slate-800'}`}>
                                            {lead.performance_metrics?.performanceScore || 'N/A'}<span className="text-xs ml-0.5 opacity-40">%</span>
                                        </p>
                                        <p className="text-[9px] font-mono text-slate-400 uppercase">TTFB: {lead.performance_metrics?.ttfb || '---'}ms</p>
                                    </div>
                                </Tooltip>

                                {/* SEO Health */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2">
                                    <Tooltip text="Meta descripciones y títulos faltantes detectados por Vortex." position="bottom">
                                        <div className="flex-1 w-full">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado SEO</p>
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${lead.seo_audit?.missing_meta_desc ? 'bg-amber-500 w-2/3' : 'bg-emerald-500 w-full'}`}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black text-slate-700">
                                                    {lead.seo_audit?.missing_meta_desc ? 'MEJORABLE' : 'OPTIMIZADO'}
                                                </span>
                                            </div>
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* Tech Stack */}
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tech Stack Detectado</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {lead.tech_stack?.map(tech => (
                                        <span key={tech} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg border border-indigo-100 uppercase">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            {/* Acciones Tácticas (Vortex AI) */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> Acciones Tácticas (Vortex AI)
                                </h4>

                                <div className="grid grid-cols-1 gap-2">
                                    {lead.website ? (
                                        <>
                                            <button
                                                onClick={() => handleTacticalAction("Analiza las métricas de rendimiento, SEO y stack tecnológico de este lead. Dame una estrategia de 3 viñetas sobre cuál es su mayor debilidad técnica y cómo usarla como ángulo de venta.", "Estrategia")}
                                                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-slate-50 transition-all group"
                                            >
                                                <span className="text-xs font-bold text-slate-700">Estrategia de Abordaje Técnico</span>
                                                <MessageSquare className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500" />
                                            </button>

                                            <div className="grid grid-cols-2 gap-2">
                                                <Tooltip text="Email asimétrico y profesional con asunto intrigante." position="bottom">
                                                    <button
                                                        onClick={() => handleTacticalAction("Actúas como un closer B2B de élite. Redacta un correo en frío de máximo 3 párrafos cortos para este lead. INCLUYE una línea de 'Asunto:' intrigante. Usa el fallo más crítico de su web (Lighthouse, SEO o lentitud) en la primera línea para demostrar investigación. Tono directo, asimétrico y profesional.", "Email")}
                                                        className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-slate-50 transition-all group"
                                                    >
                                                        <span className="text-[10px] font-bold text-slate-700">Vía Email</span>
                                                        <Globe className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500" />
                                                    </button>
                                                </Tooltip>

                                                <Tooltip text="Mensaje corto (50 palabras) con tono ágil y emojis." position="bottom">
                                                    <button
                                                        onClick={() => handleTacticalAction("Actúas como un closer B2B de élite. Redacta un mensaje de WhatsApp en frío para este lead. REGLAS ESTRICTAS: NO incluyes 'Asunto'. Longitud MÁXIMA de 40 a 50 palabras. Tono ágil y profesional. Haz referencia a una métrica técnica de su web.", "WhatsApp")}
                                                        className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-slate-50 transition-all group"
                                                    >
                                                        <span className="text-[10px] font-bold text-slate-700">Vía WhatsApp</span>
                                                        <Phone className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500" />
                                                    </button>
                                                </Tooltip>
                                            </div>

                                            <button
                                                onClick={() => handleTacticalAction("Lee el contenido Markdown extraído de su web. Dime qué tipo de clientes están buscando atraer y cómo podemos posicionar nuestro servicio como el vehículo para llegar a ese cliente ideal.", "Análisis de Copy")}
                                                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-slate-50 transition-all group"
                                            >
                                                <span className="text-xs font-bold text-slate-700">Analizar Copy (Markdown)</span>
                                                <Sparkles className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Tooltip text="Guion de 60s enfocado en reputación offline y pérdida de demanda." position="bottom">
                                                <button
                                                    onClick={() => handleTacticalAction(`Eres un Closer B2B de Mariosweb. Este prospecto NO tiene sitio web. Tiene un rating de ${lead.rating} con ${lead.userRatingsTotal} reseñas. Escribe un guion de llamada en frío (Cold Call) de menos de 60 segundos. EL ÁNGULO: Felicítalos por su excelente reputación offline (sus reseñas), pero hazles notar que están perdiendo clientes de alto valor frente a competidores peores porque no aparecen en las búsquedas de Google. El objetivo de la llamada es agendar una reunión de 10 minutos, no vender la web por teléfono. Usa tono de socio estratégico.`, "Script de Llamada")}
                                                    className="flex items-center justify-between p-3 bg-indigo-600 border border-indigo-700 rounded-xl hover:bg-indigo-700 transition-all group shadow-sm text-white"
                                                >
                                                    <span className="text-xs font-bold">Generar Script de Llamada</span>
                                                    <Phone className="w-3.5 h-3.5 text-indigo-200 group-hover:text-white" />
                                                </button>
                                            </Tooltip>

                                            <div className="grid grid-cols-2 gap-2">
                                                <Tooltip text="Mensaje corto de alta fricción sobre el costo de oportunidad." position="bottom">
                                                    <button
                                                        onClick={() => handleTacticalAction(`Eres un Closer B2B. El prospecto NO tiene web. Redacta un mensaje de WhatsApp corto (máximo 40 palabras). Tono informal pero respetuoso. Usa la técnica del 'Costo de Oportunidad': diles que viste sus excelentes reseñas en Google Maps, pero que están ocultos para los clientes que buscan en internet. Termina con una pregunta abierta de baja fricción. Cero jerga técnica.`, "WhatsApp FOMO")}
                                                        className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-slate-50 transition-all group"
                                                    >
                                                        <span className="text-[10px] font-bold text-slate-700">WhatsApp FOMO</span>
                                                        <Phone className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500" />
                                                    </button>
                                                </Tooltip>

                                                <Tooltip text="Análisis de dolores operativos para negocios offline." position="bottom">
                                                    <button
                                                        onClick={() => handleTacticalAction(`Analiza el sector de este lead (${lead.category || 'Servicio'}). Como no tienen web, dime 3 dolores operativos que este tipo de negocio sufre (ej. agendamiento manual, clientes preguntando siempre lo mismo por teléfono) y cómo una web construida por Mariosweb solucionaría esos dolores específicos.`, "Estrategia Local")}
                                                        className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-slate-50 transition-all group"
                                                    >
                                                        <span className="text-[10px] font-bold text-slate-700">Estrategia Local</span>
                                                        <MessageSquare className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500" />
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Ventana de Respuesta AI */}
                            {(isAiLoading || aiResponse) && (
                                <div className="mt-6 bg-slate-900 rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in duration-300 border border-slate-800">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Consola Táctica</span>
                                        </div>
                                        {aiResponse && (
                                            <button
                                                onClick={() => navigator.clipboard.writeText(aiResponse)}
                                                className="text-[9px] font-bold text-slate-500 hover:text-white uppercase transition-colors"
                                            >
                                                Copiar
                                            </button>
                                        )}
                                    </div>

                                    {isAiLoading ? (
                                        <div className="space-y-3 py-4">
                                            <div className="h-2 w-3/4 bg-slate-800 rounded animate-pulse"></div>
                                            <div className="h-2 w-full bg-slate-800 rounded animate-pulse"></div>
                                            <div className="h-2 w-5/6 bg-slate-800 rounded animate-pulse"></div>
                                            <p className="text-[10px] text-slate-600 font-bold uppercase mt-4 text-center">Generando táctica personalizada...</p>
                                        </div>
                                    ) : (
                                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-medium overflow-y-auto max-h-[400px] pr-2 
                                            [&::-webkit-scrollbar]:w-1.5 
                                            [&::-webkit-scrollbar-thumb]:bg-slate-700 
                                            [&::-webkit-scrollbar-thumb]:rounded-full 
                                            [&::-webkit-scrollbar-track]:bg-transparent">
                                            <ReactMarkdown>{aiResponse}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {/* Actions footer */}
            <div className="p-6 border-t border-slate-100 bg-white">
                <a
                    href={lead.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl"
                >
                    Ver en Google Maps
                </a>
            </div>
        </div>
    );
};

export default LeadDetailsPanel;
