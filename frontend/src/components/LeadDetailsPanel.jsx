import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Globe, MapPin, Phone, MessageSquare, AlertCircle, Loader2, CheckCircle2, X, Star, ExternalLink, Zap, Copy, Mail, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import Tooltip from './Tooltip';
import AlertService from '../services/AlertService';
import { getWhatsAppLink } from '../utils/phoneUtils';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const getFriendlyErrorMessage = (errorString) => {
    if (!errorString) return 'Ocurrió un error técnico inesperado al analizar la infraestructura de este prospecto.';
    const lowerError = errorString.toLowerCase();

    if (lowerError.includes('enotfound') || lowerError.includes('err_name_not_resolved')) {
        return 'Dominio inaccesible. El sitio web oficial del prospecto ya no existe, caducó o el enlace está roto.';
    }
    if (lowerError.includes('waf') || lowerError.includes('cloudflare') || lowerError.includes('403') || lowerError.includes('520')) {
        return 'Acceso denegado (Firewall Activo). El sitio web bloqueó la conexión entrante de nuestro analizador para proteger su código fuente.';
    }
    if (lowerError.includes('timeout') || lowerError.includes('err_connection_timed_out') || lowerError.includes('navigation timeout')) {
        return 'Tiempo de espera agotado. El servidor del prospecto es extremadamente lento y no logró responder la petición a tiempo.';
    }
    if (lowerError.includes('err_connection_refused')) {
        return 'Conexión rechazada. El servidor web del prospecto se encuentra inactivo actualmente o rechazó la solicitud TCP.';
    }

    return 'Fallo de extracción: El proveedor de hosting o la tecnología del sitio impidieron la recolección asíncrona de datos.';
};

const ActionCard = ({ title, textContent, icon, colorClass, lead }) => {
    const validWaNumber = getWhatsAppLink(lead?.phoneNumber, lead?.countryCode || 'AR');

    const handleCopy = () => {
        navigator.clipboard.writeText(textContent);
        AlertService.success("Copiado al portapapeles");
    };

    const handleWhatsApp = () => {
        if (!validWaNumber) return;
        window.open(`https://wa.me/${validWaNumber}?text=${encodeURIComponent(textContent)}`, '_blank');
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

const LeadDetailsPanel = ({ lead: initialLead, onClose, onLeadUpdate }) => {
    const [lead, setLead] = useState(initialLead);
    const [activeTab, setActiveTab] = useState('inteligencia');
    const [isActivating, setIsActivating] = useState(false);
    const [error, setError] = useState(null);
    const [aiResponse, setAiResponse] = useState(lead.tactical_response || '');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const vortexToastIdRef = useRef(null);

    // Spider State
    const [spiderData, setSpiderData] = useState(null);
    const [isSpiderLoading, setIsSpiderLoading] = useState(false);

    const fetchSpiderStrategy = async (forceRefresh = false) => {
        setIsSpiderLoading(true);
        if (forceRefresh) {
            setAiResponse('');
        }
        try {
            const url = `/ai/spider-analysis/${lead._id}${forceRefresh ? '?forceRefresh=true' : ''}`;
            const aiRequest = api.get(url);

            if (forceRefresh) {
                AlertService.promise(
                    aiRequest,
                    {
                        loading: 'MARIO re-calculando estrategia...',
                        success: 'Playbook regenerado en base de datos',
                        error: 'Fallo crítico en neuro-procesamiento'
                    }
                ).then(({ data }) => {
                    setSpiderData(data.spider_verdict);
                    setAiResponse(data.mario_strategy);
                }).finally(() => {
                    setIsSpiderLoading(false);
                });
            } else {
                const { data } = await aiRequest;
                setSpiderData(data.spider_verdict);
                setAiResponse(data.mario_strategy);
                setIsSpiderLoading(false);
            }
        } catch (err) {
            console.error("Spider fetch error:", err);
            AlertService.error("Fallo al calcular Estrategia Neuro-Simbólica.");
            setIsSpiderLoading(false);
        }
    };

    // Effect to Trigger Spider Auto-Analysis when 'estrategia' tab is opened
    useEffect(() => {
        if (activeTab === 'estrategia' && !spiderData && !isSpiderLoading && !aiResponse) {
            fetchSpiderStrategy(false);
        }
    }, [activeTab, lead._id, spiderData, aiResponse, isSpiderLoading]);

    const handleTacticalAction = async (prompt, label) => {
        setIsAiLoading(true);
        setAiResponse('');
        // Usando AlertService.promise para UX asimétrica

        const aiRequest = api.post('/ai/chat', {
            query: prompt,
            leadId: lead._id
        });

        AlertService.promise(
            aiRequest,
            {
                loading: `Generando ${label}...`,
                success: `¡${label} estratégico generado!`,
                error: `Error al generar ${label}`
            }
        ).then(({ data }) => {
            setAiResponse(data.answer);
        }).finally(() => {
            setIsAiLoading(false);
        });
    };

    const handleStatusUpdate = async (newStatus) => {
        const note = window.prompt(`Actualizando a '${newStatus}'. ¿Alguna nota?`);
        if (note === null) return; // User cancelled the prompt

        const updateRequest = api.patch(`/leads/${lead._id}/status`, { status: newStatus, note });

        AlertService.promise(
            updateRequest,
            {
                loading: 'Actualizando CRM...',
                success: 'Estado del prospecto actualizado',
                error: 'Error al actualizar el CRM'
            }
        ).then(({ data }) => {
            setLead(data);
            if (onLeadUpdate) onLeadUpdate(data);
        });
    };

    // Polling for status if it's pending
    useEffect(() => {
        let interval;
        if (lead.enrichmentStatus === 'pending') {
            interval = setInterval(async () => {
                try {
                    const { data } = await api.get(`/vortex/status/${lead._id}`);
                    if (data.status === 'completed') {
                        const { data: updatedLead } = await api.get(`/leads/${lead._id}`);
                        setLead(updatedLead);
                        if (onLeadUpdate) onLeadUpdate(updatedLead);
                        clearInterval(interval);

                        // Terminar el Toast explícitamente si existe
                        if (vortexToastIdRef.current) {
                            AlertService.successUpdate(vortexToastIdRef.current, '¡Auditoría Técnica Completada!');
                            vortexToastIdRef.current = null;
                        } else {
                            AlertService.success('Vortex Audit completado en 2do plano');
                        }
                    } else if (data.status === 'failed') {
                        setLead(prev => ({ ...prev, enrichmentStatus: 'failed', enrichmentError: data.error }));
                        clearInterval(interval);

                        if (vortexToastIdRef.current) {
                            AlertService.errorUpdate(vortexToastIdRef.current, 'Vortex Audit falló o fue bloqueado.');
                            vortexToastIdRef.current = null;
                        }
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

        // Creamos el loader persistente y capturamos su ID
        const tid = AlertService.loading('Infiltrando Vortex Engine. Analizando Infraestructura...');
        vortexToastIdRef.current = tid;

        try {
            await api.post(`/vortex/enrich/${lead._id}`);
            // El API responde OK. El backend está procesando en 2do plano.
            // No cambiamos el toast todavía, dejamos que el useEffect (Polling) lo cierre.
            setLead(prev => ({ ...prev, enrichmentStatus: 'pending' }));
            if (onLeadUpdate) onLeadUpdate({ ...lead, enrichmentStatus: 'pending' });
        } catch (err) {
            AlertService.errorUpdate(tid, 'Fallo al iniciar protocolo Vortex.');
            vortexToastIdRef.current = null;
            setError(err.response?.data?.message || 'Error al activar Vortex');
        } finally {
            setIsActivating(false);
        }
    };

    // --- Action Card Handlers ---
    const handleCopy = async (text) => {
        await navigator.clipboard.writeText(text);
        AlertService.success("Mensaje copiado al portapapeles");
    };

    const handleWhatsApp = (text) => {
        if (!lead.phoneNumber) return AlertService.error("El lead no tiene teléfono");
        const phone = lead.phoneNumber.replace(/(?!^\+)[^\d]/g, '');
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleEmailAction = (bodyText, subject = "Estrategia Digital B2B") => {
        if (!lead.email) return AlertService.error("El lead no tiene email registrado");
        const url = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
        window.open(url, '_blank');
    };

    if (!lead) return null;

    const isProcessing = lead.enrichmentStatus === 'pending';
    const isCompleted = lead.enrichmentStatus === 'completed';
    const isFailed = lead.enrichmentStatus === 'failed';

    const renderInteligencia = () => {
        if (!lead.website) {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sin Presencia Web Detectada</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-app-card p-4 rounded-xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 inset-x-0 h-[40%] bg-pastel-orange/20 transition-colors group-hover:bg-pastel-orange/30"></div>
                            <div className="relative z-10 pt-4">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Rating Maps</p>
                                <div className="flex items-center gap-1">
                                    <span className="text-2xl font-bold text-white tracking-tight">{lead.rating || 'N/A'}</span>
                                    <Star className="w-4 h-4 text-pastel-orange fill-pastel-orange" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-app-card p-4 rounded-xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 inset-x-0 h-[40%] bg-pastel-blue/20 transition-colors group-hover:bg-pastel-blue/30"></div>
                            <div className="relative z-10 pt-4">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Reseñas Totales</p>
                                <p className="text-2xl font-bold text-white tracking-tight">{lead.userRatingsTotal || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 bg-app-card p-5 rounded-2xl border border-white/5 mt-6">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-2">Información de Google Places</h4>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                            <span className="text-xs text-slate-300 leading-relaxed">{lead.address}</span>
                        </div>
                        {lead.phoneNumber && (
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-slate-500" />
                                <span className="text-xs text-slate-300 font-mono">{lead.phoneNumber}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-slate-500" />
                            <span className="text-xs text-accent-red font-bold italic">No posee URL pública</span>
                        </div>
                    </div>
                </div>
            );
        }

        if (!isCompleted) {
            return (
                <div className={`rounded-2xl p-6 border-2 transition-all duration-500 ${isProcessing ? 'bg-indigo-50 border-indigo-200' : isFailed ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-xl ${isProcessing ? 'bg-indigo-600 animate-pulse' : isFailed ? 'bg-red-600' : 'bg-slate-200'} text-white`}>
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Vortex Audit</h3>
                    </div>
                    {(isFailed || lead.enrichmentStatus === 'unprocessed') && (
                        <div className="space-y-4 mb-4">
                            {isFailed && (
                                <div className="p-3 bg-red-100 border border-red-200 rounded-lg text-red-800 text-xs flex gap-2 items-start shadow-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                                    <div>
                                        <p className="font-bold text-red-900 mb-0.5 text-[11px] uppercase tracking-wide">Fallo de Análisis Web</p>
                                        <p className="text-red-800 leading-relaxed font-medium">{getFriendlyErrorMessage(lead.enrichmentError)}</p>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={handleActivateVortex}
                                disabled={isActivating}
                                className="w-full py-3 bg-white text-black hover:bg-slate-200 rounded-xl font-black text-[10px] uppercase tracking-[0.1em] transition-all flex justify-center items-center shadow-md active:scale-95"
                            >
                                {isActivating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Run Technical Audit'}
                            </button>
                        </div>
                    )}
                    {isProcessing && (
                        <div className="space-y-3 py-4 text-center">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                            <p className="text-[10px] font-black text-indigo-700 uppercase">Escaneando Infraestructura...</p>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* ---------- Tarjeta 1: Core Web Vitals (Rendimiento) ---------- */}
                <div className="bg-app-card rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Rendimiento (Lighthouse)</h4>
                        </div>
                        {/* Indicador General (Mini Dona Lógica) */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Score:</span>
                            <span className={`px-2 py-0.5 rounded textxs font-black
                                ${(!lead.performance_metrics?.performanceScore) ? 'bg-slate-800 text-slate-500' :
                                    lead.performance_metrics.performanceScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                                        lead.performance_metrics.performanceScore >= 50 ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-red-500/20 text-red-500'
                                }
                            `}>
                                {lead.performance_metrics?.performanceScore ?? 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 grid grid-cols-2 gap-4 bg-[#0B0B0C]">
                        {/* LCP Metric */}
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-500 uppercase">Largest Contentful Paint</p>
                            <div className="flex items-end gap-2">
                                <p className="text-xl font-mono font-bold text-slate-200">
                                    {lead.performance_metrics?.lcp || '---'}
                                </p>
                                {lead.performance_metrics?.lcp && parseFloat(lead.performance_metrics.lcp) > 2.5 && (
                                    <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded uppercase mb-1">Lento</span>
                                )}
                            </div>
                        </div>
                        {/* TTFB Metric */}
                        <div className="space-y-1 p-4 bg-slate-900/40 rounded-xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase">Time To First Byte</p>
                            <p className="text-xl font-mono font-bold text-slate-200">
                                {lead.performance_metrics?.ttfb !== undefined ? `${lead.performance_metrics.ttfb} ms` : '---'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ---------- Tarjeta 2: Salud SEO (Estructura) ---------- */}
                <div className="bg-app-card rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Estructura SEO</h4>
                        </div>
                    </div>

                    <div className="p-4 space-y-3 bg-[#0B0B0C]">
                        {/* H1 Check */}
                        <div className="flex items-start justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-300">Etiquetas H1</p>
                                <p className={`text-[9px] italic ${!lead.seo_audit?.h1Count ? 'text-red-400' : 'text-slate-500'}`}>
                                    {!lead.seo_audit?.h1Count ? 'Falta H1 (Penalización severa en Google)' : `${lead.seo_audit.h1Count} Encontrados`}
                                </p>
                            </div>
                            {lead.seo_audit?.h1Count ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />}
                        </div>

                        {/* Meta Description Check */}
                        <div className="flex items-start justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-300">Meta Descripción</p>
                                <p className={`text-[9px] italic ${!lead.seo_audit?.hasMetaDescription ? 'text-amber-400' : 'text-slate-500'}`}>
                                    {!lead.seo_audit?.hasMetaDescription ? 'Sin descripción configurada para resultados de búsqueda.' : 'Configurada correctamente'}
                                </p>
                            </div>
                            {lead.seo_audit?.hasMetaDescription ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                        </div>

                        {/* Title Check */}
                        <div className="flex items-start justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-300">Etiqueta Title</p>
                                <p className="text-[9px] text-slate-500 max-w-[200px] truncate" title={lead.seo_audit?.titleText}>
                                    {lead.seo_audit?.hasTitle ? lead.seo_audit.titleText : 'No posee título estructurado'}
                                </p>
                            </div>
                            {lead.seo_audit?.hasTitle ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />}
                        </div>
                    </div>
                </div>

                {/* ---------- Tarjeta 3: Tech Stack (Wappalyzer Clásico) ---------- */}
                <div className="bg-app-card rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Tecnologías Base</h4>
                        </div>
                    </div>

                    <div className="p-5 bg-[#0B0B0C]">
                        {lead.tech_stack && lead.tech_stack.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {lead.tech_stack.map(tech => (
                                    <span key={tech} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-lg border border-indigo-500/20 uppercase shadow-sm">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                                <div className="p-2 bg-slate-800 rounded-full">
                                    <AlertCircle className="w-4 h-4 text-slate-500" />
                                </div>
                                <p className="text-xs font-bold text-slate-400">Tecnología Oculta / No Detectada</p>
                                <p className="text-[10px] text-slate-500">El sitio no expone librerías conocidas públicamente.</p>
                            </div>
                        )}

                        {/* Advertencias Heurísticas (Ej: Ads / Pixeles) */}
                        {lead.tech_stack && !lead.tech_stack.some(t => t.toLowerCase().includes('analytics') || t.toLowerCase().includes('tag')) && (
                            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-amber-400/90 leading-relaxed font-medium">
                                    <span className="font-bold text-amber-500">Oportunidad Ads:</span> No se detectaron píxeles analíticos (Google/Meta). Pobre medición de tráfico evidenciada.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ---------- Acordeón JSON Raw (Para Debugeo o Data Cruda) ---------- */}
                <details className="group cursor-pointer">
                    <summary className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors list-none flex items-center gap-2">
                        <span className="group-open:rotate-90 transition-transform">▶</span> Ver Extracción JSON Raw
                    </summary>
                    <div className="mt-3 p-4 bg-black rounded-xl border border-white/10 overflow-x-auto">
                        <pre className="text-[10px] font-mono text-emerald-400 leading-relaxed">
                            {JSON.stringify({
                                performance: lead.performance_metrics,
                                seo: lead.seo_audit,
                                tech: lead.tech_stack
                            }, null, 2)}
                        </pre>
                    </div>
                </details>
            </div>
        );
    };

    const renderEstrategia = () => (
        <div className="space-y-6 animate-in fade-in duration-300 flex flex-col h-full">
            {spiderData && (
                <div className="flex flex-col lg:flex-row gap-3 mb-4">
                    {/* Rentabilidad Card */}
                    <div className="flex-1 bg-gradient-to-b from-[#151720] to-[#0A0B10] p-4 rounded-2xl border border-white/[0.05] relative overflow-hidden group flex flex-col justify-between min-h-[100px]">
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] pointer-events-none transition-colors ${spiderData.isRentable ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}></div>

                        <div className="relative z-10 flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${spiderData.isRentable ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.8)]'}`}></div>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Rentabilidad</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">TIER {spiderData.tier}</span>
                        </div>

                        <div className="relative z-10 flex flex-col">
                            <span className={`text-lg font-black tracking-tight ${spiderData.isRentable ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {spiderData.isRentable ? 'GO' : 'NO-GO'}
                            </span>
                            <span className="text-xs text-slate-400 font-medium truncate mt-0.5" title={spiderData.service}>
                                {spiderData.service}
                            </span>
                        </div>
                    </div>

                    {/* Dolor Card */}
                    <div className="flex-[1.5] bg-gradient-to-b from-[#151720] to-[#0A0B10] p-4 rounded-2xl border border-white/[0.05] relative overflow-hidden group flex flex-col min-h-[100px]">
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-[50px] pointer-events-none"></div>

                        <div className="relative z-10 mb-2">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50"></div>
                                Pain Point (Dolor)
                            </span>
                        </div>
                        <div className="relative z-10 flex-1 flex items-center">
                            <p className="text-[13px] font-medium text-slate-300 leading-relaxed line-clamp-3" title={spiderData.pain}>
                                {spiderData.pain}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* TABLERO DE MANDOS (SPIDER METRICS) */}
            {spiderData && spiderData.isRentable && (
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    {/* Confianza */}
                    <div className="flex items-center gap-2 bg-[#12141A] border border-white/10 px-3 py-1.5 rounded-full shadow-sm">
                        <span>🔥</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Confianza:</span>
                        <span className={`text-xs font-black ${spiderData.historical_confidence > 50 ? 'text-emerald-400' :
                            spiderData.historical_confidence <= 20 ? 'text-rose-400' : 'text-amber-400'
                            }`}>
                            {spiderData.historical_confidence || 0}%
                        </span>
                    </div>

                    {/* Friccion */}
                    <div className="flex items-center gap-2 bg-[#12141A] border border-white/10 px-3 py-1.5 rounded-full shadow-sm relative group cursor-help">
                        <span>⚙️</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Fricción Tech:</span>
                        <span className={`text-xs font-black ${spiderData.has_website_flag === false ? 'text-blue-400' :
                            spiderData.friction_score === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                            {spiderData.has_website_flag === false ? 'NULA (Sin Web)' : (spiderData.friction_score === 'HIGH' ? 'ALTA' : 'BAJA')}
                        </span>

                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-black border border-white/10 text-slate-300 text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl text-center">
                            {spiderData.has_website_flag === false
                                ? "No tienen sitio web. Fricción cero, es un lienzo en blanco para vender Identidad Digital."
                                : spiderData.friction_score === 'HIGH'
                                    ? "Costo hundido tech detectado. No insultar su web actual, la defenderán. Ángulo: Repair/Upgrade."
                                    : "Tecnología básica o nula. Costo hundido bajo. Ángulo: Reemplazo Total justificable."}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-[#0B0B0C] rounded-2xl p-5 border border-white/[0.05] overflow-hidden flex-1 flex flex-col relative shadow-xl">
                {/* Decorative Background Blob for the Bot */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="relative z-10 text-[9px] font-black text-white uppercase tracking-[0.2em] mb-4 pb-4 border-b border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img src="/bot.png" alt="Bot Mario" className="w-8 h-8 rounded-full border border-emerald-500/30 object-cover shadow-[0_0_15px_rgba(52,211,153,0.2)]" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-[#0B0B0C]"></div>
                        </div>
                        <span className="text-slate-300 font-bold tracking-widest text-[10px]">MARIO <span className="text-slate-600 font-medium ml-1">|</span> <span className="text-emerald-500/80 ml-1">Neuro-Symbolic Closer</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isSpiderLoading && !isAiLoading && aiResponse && (
                            <button
                                onClick={() => fetchSpiderStrategy(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 border border-white/5 hover:border-emerald-500/30 transition-all rounded-lg"
                                title="Forzar LLM"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Regenerar Estrategia</span>
                            </button>
                        )}
                        {(isSpiderLoading || isAiLoading) && <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse"></div>}
                    </div>
                </div>

                {isSpiderLoading || isAiLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono uppercase gap-4 min-h-[200px]">
                        <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
                        <span>SPIDER Engine procesando...</span>
                    </div>
                ) : (
                    aiResponse ? (
                        <div className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden pr-2 minimal-scrollbar h-[60vh]">
                            {(() => {
                                let parsedStrategy;
                                try {
                                    // Defensiva contra un posible wrapper de sub-bloque Markdown que retorne OpenAI
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

                                    return (
                                        <ActionCard
                                            key={card.key}
                                            title={card.title}
                                            textContent={textContent}
                                            colorClass={card.colorClass}
                                            icon={<Sparkles className="w-3 h-3" />}
                                            lead={lead}
                                        />
                                    );
                                });
                            })()}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 min-h-[200px] gap-2">
                            <AlertCircle className="w-6 h-6 opacity-50" />
                            <span className="text-xs">No hay respuesta táctica aún.</span>
                        </div>
                    )
                )}
            </div>
        </div>
    );

    const renderGestion = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-5 bg-app-card rounded-2xl border border-white/5">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Estado del Lead (CRM)</h4>
                <div className="grid grid-cols-1 gap-2">
                    {['Nuevo', 'Contactado', 'Cita Agendada', 'Propuesta Enviada', 'Cerrado Ganado', 'Cerrado Perdido'].map(status => (
                        <button
                            key={status}
                            onClick={() => handleStatusUpdate(status)}
                            className={`px-4 py-3 rounded-xl text-xs font-bold text-left transition-all border ${lead.status === status ? 'bg-white text-black border-white shadow-md' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20 hover:bg-white/5'}`}
                        >
                            {status.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Historial de Notas</h4>
                {lead.interactionLogs?.length > 0 ? (
                    <div className="space-y-3">
                        {lead.interactionLogs.reverse().map((log, i) => (
                            <div key={i} className="bg-white p-3 rounded-xl border border-slate-200">
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{new Date(log.timestamp).toLocaleDateString()} - {log.status}</p>
                                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{log.note || 'Sin nota.'}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-slate-400 italic text-center py-4">Sin interacciones registradas.</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            ></div>

            {/* Slide-over panel */}
            <div className="relative w-[896px] max-w-[90vw] bg-app-bg shadow-2xl shadow-black/80 flex flex-col border-l border-white/10 animate-in slide-in-from-right duration-300 h-full">
                {/* Header */}
                <div className="p-8 border-b border-white/5 bg-[#121212]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-white tracking-tight truncate max-w-[350px]">{lead.name}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors flex-shrink-0">
                            <X className="w-5 h-5 text-slate-500 hover:text-white" />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${lead.opportunityLevel === 'Critical' ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>{lead.opportunityLevel}</span>
                        {lead.is_advertising && <span className="px-2.5 py-1 bg-accent-red/20 text-accent-red border border-accent-red/30 text-[10px] font-bold rounded uppercase">Ads Active</span>}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-white/5 bg-app-card">
                    {['inteligencia', 'estrategia', 'gestion'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.1em] transition-all relative ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab === 'gestion' ? 'Gestión' : tab === 'estrategia' ? 'Estrategia AI' : tab}
                            {activeTab === tab && <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white animate-in fade-in duration-300" />}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    {activeTab === 'inteligencia' && renderInteligencia()}
                    {activeTab === 'estrategia' && renderEstrategia()}
                    {activeTab === 'gestion' && renderGestion()}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <a
                        href={lead.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-200"
                    >
                        Ver en Google Maps <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default LeadDetailsPanel;
