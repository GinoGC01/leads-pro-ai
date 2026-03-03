import React, { useState, useEffect, useRef } from 'react';
import { Globe, MapPin, Phone, MessageSquare, AlertCircle, Loader2, CheckCircle2, X, Star, ExternalLink, Zap, Copy, Mail, RefreshCw, Server, Activity, AlertTriangle, Target, Clock, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import Tooltip from './Tooltip';
import AlertService from '../services/AlertService';
import StatusUpdateModal from './StatusUpdateModal';
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

const RotatingLoader = () => {
    const steps = [
        "Inicializando Araña...",
        "Resolviendo DNS y escaneando red...",
        "Bypass de Firewalls (WAF)...",
        "Descargando código fuente HTML...",
        "Buscando píxeles y analíticas...",
        "Extrayendo emails y teléfonos ocultos...",
        "Perforando estructura SEO...",
        "Generando Radiografía SPIDER..."
    ];
    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1 < steps.length ? prev + 1 : prev));
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-4 py-8 text-center relative z-10 animate-in fade-in duration-300">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
            <div className="h-6 relative overflow-hidden flex items-center justify-center mt-2">
                <p key={index} className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] animate-in slide-in-from-bottom-2 fade-in duration-300 absolute">
                    {steps[index]}
                </p>
            </div>
            <div className="w-48 h-1 bg-indigo-500/10 mx-auto rounded-full overflow-hidden mt-6">
                <div
                    className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-500 ease-out"
                    style={{ width: `${((index + 1) / steps.length) * 100}%` }}
                />
            </div>
        </div>
    );
};

const LeadDetailsPanel = ({ lead: initialLead, onClose, onLeadUpdate }) => {
    const [lead, setLead] = useState(initialLead);
    const [activeTab, setActiveTab] = useState('inteligencia');
    const [isSpiderHelpActive, setIsSpiderHelpActive] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [error, setError] = useState(null);
    const [aiResponse, setAiResponse] = useState(lead.tactical_response || '');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, newStatus: null });
    const vortexToastIdRef = useRef(null);

    const [spiderData, setSpiderData] = useState(null);
    const [isSpiderLoading, setIsSpiderLoading] = useState(false);

    // Resizable Mario Panel State
    const [marioWidth, setMarioWidth] = useState(550);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDraggingRef.current) return;
            // Calculate new width: window width - mouse X position
            // giving the right panel the remaining width
            const newWidth = window.innerWidth - e.clientX;
            // Constrain between 350px and 900px
            if (newWidth >= 350 && newWidth <= 900) {
                setMarioWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

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

    const handleStatusUpdate = (newStatus) => {
        setStatusModal({ isOpen: true, newStatus });
    };

    const confirmStatusUpdate = async (note) => {
        const newStatus = statusModal.newStatus;
        setStatusModal({ isOpen: false, newStatus: null });

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
        const sharedHeader = (
            <div className="grid grid-cols-2 gap-4 mb-6">
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
        );

        if (!lead.website) {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {sharedHeader}

                    <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sin Presencia Web Detectada</span>
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
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {sharedHeader}
                    <div className={`rounded-2xl p-6 border transition-all duration-500 relative overflow-hidden ${isProcessing ? 'bg-indigo-900/10 border-indigo-500/20' : isFailed ? 'bg-red-900/10 border-red-500/20' : 'bg-[#151720] border-white/5'}`}>

                        {/* Background glow effects */}
                        {isProcessing && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none"></div>}
                        {isFailed && <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[40px] pointer-events-none"></div>}
                        {!isProcessing && !isFailed && <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px] pointer-events-none"></div>}

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className={`p-2 rounded-xl border ${isProcessing ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400 animate-pulse' : isFailed ? 'bg-red-500/20 border-red-500/30 text-red-500' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                                <Activity className="w-5 h-5" />
                            </div>
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Vortex Audit</h3>
                        </div>

                        {(isFailed || lead.enrichmentStatus === 'unprocessed') && (
                            <div className="space-y-4 mb-2 relative z-10">
                                {isFailed && (
                                    <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-400 text-xs flex gap-3 items-start shadow-sm backdrop-blur-sm">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                                        <div>
                                            <p className="font-bold text-red-500 mb-1 text-[11px] uppercase tracking-widest">Fallo de Análisis Web</p>
                                            <p className="text-red-400/80 leading-relaxed font-medium text-[11px]">{getFriendlyErrorMessage(lead.enrichmentError)}</p>
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={handleActivateVortex}
                                    disabled={isActivating}
                                    className="w-full py-4 bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex justify-center items-center shadow-lg active:scale-[0.98] group"
                                >
                                    {isActivating ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-accent-blue" /> :
                                        <span className="flex items-center gap-2">Run Technical Audit <Activity className="w-3 h-3 text-slate-400 group-hover:text-accent-blue transition-colors" /></span>}
                                </button>
                            </div>
                        )}
                        {isProcessing && (
                            <RotatingLoader />
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                {sharedHeader}

                <div className="flex items-center justify-between mt-4 mb-2">
                    <h3 className="text-[12px] font-black tracking-widest text-white uppercase flex items-center gap-2">
                        <Activity className="w-4 h-4 text-accent-blue" />
                        Radiografía SPIDER
                    </h3>
                    <button
                        onClick={() => setIsSpiderHelpActive(!isSpiderHelpActive)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all ${isSpiderHelpActive
                            ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/50 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                            : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20 hover:text-slate-400'
                            }`}
                    >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {isSpiderHelpActive ? 'Ayuda Activada' : 'Activar Ayuda'}
                    </button>
                </div>

                {/* ---------- Tarjeta 1: Core Web Vitals (Rendimiento) ---------- */}
                <Tooltip
                    className="block w-full"
                    position="top"
                    disabled={!isSpiderHelpActive}
                    text="Mide la velocidad real. Un sitio lento (LCP > 2.5s) o con mala respuesta (TTFB) frustra a los clientes y penaliza en Google. Ángulo: 'Tu página tarda tanto en abrir que los clientes se van a la competencia'."
                >
                    <div className="bg-app-card rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Rendimiento (Lighthouse)</h4>
                            </div>
                            {/* Indicador General (Mini Dona Lógica) */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Score:</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black
                                ${(!lead.performance_metrics?.performanceScore) ? 'bg-slate-800 text-slate-500' :
                                        lead.performance_metrics.performanceScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                                            lead.performance_metrics.performanceScore >= 50 ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-red-500/20 text-red-500'
                                    }
                            `}>
                                    {typeof lead.performance_metrics?.performanceScore === 'number' ? lead.performance_metrics.performanceScore.toFixed(2) : (lead.performance_metrics?.performanceScore ?? 'N/A')}
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
                </Tooltip>

                {/* ---------- Tarjeta 2: Salud SEO (Estructura) ---------- */}
                <Tooltip
                    className="block w-full"
                    position="top"
                    disabled={!isSpiderHelpActive}
                    text="Verifica la estructura orgánica. Si omiten la Etiqueta Title o Meta Description, Google no los mostrará correctamente en búsquedas. Ángulo: 'La gente busca tu servicio, pero Google está escondiendo tu página porque internamente está incompleta'."
                >
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
                </Tooltip>

                {/* ---------- Tarjeta 3: Tech Stack (Wappalyzer Clásico) ---------- */}
                <Tooltip
                    className="block w-full"
                    position="top"
                    disabled={!isSpiderHelpActive}
                    text="Detecta la tecnología subyacente. Usar CMS anticuados revela abandono digital, y no poseer píxeles de Analytics significa que giran a ciegas sin medir conversiones. Ángulo: 'Tu infraestructura luce vieja y no estás midiendo si la inversión en anuncios te da retorno'."
                >
                    <div className="bg-app-card rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Server className="w-4 h-4 text-indigo-400" />
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
                </Tooltip>

                {/* ---------- Contactos Extraídos ---------- */}
                {lead.extracted_contacts && (lead.extracted_contacts.emails?.length > 0 || lead.extracted_contacts.phones?.length > 0 || lead.extracted_contacts.social_links?.length > 0) && (
                    <Tooltip
                        className="block w-full"
                        position="top"
                        disabled={!isSpiderHelpActive}
                        text="Contactos capturados automáticamente del código fuente. Útil para evitar el filtro de recepción y apuntar a los tomadores de decisión mediante canales directos."
                    >
                        <div className="border border-white/5 rounded-2xl overflow-hidden">
                            <div className="px-5 py-3 bg-emerald-500/5 border-b border-white/5">
                                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Contactos Extraídos del Sitio Web</h4>
                            </div>
                            <div className="p-5 bg-[#0B0B0C] space-y-3">
                                {lead.extracted_contacts.emails?.length > 0 && (
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Emails</span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {lead.extracted_contacts.emails.map((email, i) => (
                                                <a key={i} href={`mailto:${email}`} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                                                    {email}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {lead.extracted_contacts.phones?.length > 0 && (
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Teléfonos</span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {lead.extracted_contacts.phones.map((phone, i) => (
                                                <a key={i} href={`tel:${phone}`} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                                                    {phone}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {lead.extracted_contacts.social_links?.length > 0 && (
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Redes Sociales</span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {lead.extracted_contacts.social_links.map((social, i) => (
                                                <a key={i} href={social.url} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-lg border border-purple-500/20 hover:bg-purple-500/20 transition-colors capitalize">
                                                    {social.platform}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Tooltip>
                )}

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

    const renderEstrategia = () => {
        if (isSpiderLoading && !spiderData && !aiResponse) {
            return (
                <div className="h-full w-full flex flex-col items-center justify-center space-y-4 p-12">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-accent-blue animate-spin" />
                        <div className="absolute inset-0 bg-accent-blue/20 blur-xl rounded-full"></div>
                    </div>
                    <div className="text-center space-y-2">
                        Analizando Infraestructura Core
                        <p className="text-[10px] text-slate-400 font-mono">Calculando Costos Hundidos y Densidad de Fricción UX/UI...</p>
                    </div>

                    {/* Fake Matrix Progress */}
                    <div className="w-64 mt-6">
                        <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase mb-1">
                            <span>Extrayendo DOM Vectorial</span>
                            <span className="text-accent-blue animate-pulse">Running</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-accent-blue w-1/2 animate-pulse rounded-full"></div>
                        </div>
                    </div>
                </div>
            );
        }

        if (!spiderData) return null;

        return (
            <div className="space-y-6 animate-in fade-in duration-300 flex flex-col h-full">
                {/* Tech Stack Matrix */}
                <div className="flex flex-col lg:flex-row gap-3 mb-2">
                    <div className="flex-1 bg-[#0A0B10] p-5 rounded-2xl border border-white/[0.05] relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        <div className="relative z-10 flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Server className="w-3.5 h-3.5" /> Matrix Tecnológica
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full capitalize">
                                {spiderData.infrastructure_type || 'Desconocido'}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {lead.tech_stack?.length > 0 ? lead.tech_stack.map((t, i) => (
                                <span key={i} className="px-2 py-1 bg-white/[0.02] border border-white/10 rounded-md text-[10px] font-mono text-slate-300">{t}</span>
                            )) : <span className="text-xs text-slate-600 italic">No frameworks detectados</span>}
                        </div>
                    </div>
                </div>

                {/* Vitals Gauges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {/* Confianza Gauge */}
                    <div className="bg-[#0A0B10] border border-white/[0.05] p-4 rounded-2xl flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Activity className="w-3 h-3" /> Confianza (IA)</span>
                            <span className="text-xs font-black text-white">{spiderData.historical_confidence || 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)] ${(spiderData.historical_confidence || 0) > 70 ? 'bg-emerald-400' : (spiderData.historical_confidence || 0) > 30 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${spiderData.historical_confidence || 0}%` }}></div>
                        </div>
                    </div>

                    {/* Velocidad Gauge */}
                    <div className="bg-[#0A0B10] border border-white/[0.05] p-4 rounded-2xl flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Zap className="w-3 h-3" /> Velocidad LCP</span>
                            <span className="text-xs font-black text-white">{spiderData.load_speed_score || 50}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${(spiderData.load_speed_score || 50) > 70 ? 'bg-emerald-400' : (spiderData.load_speed_score || 50) > 30 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${spiderData.load_speed_score || 50}%` }}></div>
                        </div>
                    </div>

                    {/* SEO Gauge */}
                    <div className="bg-[#0A0B10] border border-white/[0.05] p-4 rounded-2xl flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Globe className="w-3 h-3" /> Estructura SEO</span>
                            <span className="text-xs font-black text-white">{spiderData.seo_integrity_score || 60}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]" style={{ width: `${spiderData.seo_integrity_score || 60}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Friction Banner */}
                {spiderData.friction_score === 'HIGH' && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-400 leading-relaxed">
                            <span className="font-bold">Alta Fricción Detectada:</span> El Stack tecnológico del prospecto presenta dependencias severas (ej. Linktree, Wix, sin dominio propio). Fuga de prospectos premium altamente probable.
                        </p>
                    </div>
                )}

                {/* Tactical Blueprint */}
                <div className="p-6 bg-slate-900/80 border-l-4 border-l-accent-blue rounded-r-2xl shadow-inner relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-48 h-full bg-gradient-to-l from-accent-blue/10 to-transparent pointer-events-none"></div>

                    <div className="flex items-start gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex flex-shrink-0 items-center justify-center">
                            <Target className="w-5 h-5 text-accent-blue" />
                        </div>
                        <div>
                            <h5 className="text-[10px] font-black text-accent-blue uppercase tracking-widest mb-1">
                                Blueprint de Venta
                            </h5>
                            <h3 className="text-white font-bold text-base mb-2">
                                Objetivo: <span className="text-accent-blue">{spiderData.service || 'Ingeniería SEO'}</span>
                            </h3>
                            <p className="text-[12px] text-slate-300 leading-relaxed font-medium mb-3 relative">
                                Táctica a ejecutar: <strong className="text-white">{spiderData.tactic_name || 'Desconocida'}</strong><br />
                                <span className="text-slate-400 block mt-1">El bot MARIO ha sido parametrizado con este contexto. Sus mensajes de la derecha aplican ingeniería sociológica diseñada para detonar la Hemorragia de Negocios atada a este dolor técnico especifico. Cópialos o modifícalos ligeramente manteniendo el estatus.</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Raw Vector Info */}
                {spiderData.pain && (
                    <div className="p-4 bg-[#0B0B0C] border border-white/5 rounded-xl text-xs text-slate-400 font-mono whitespace-pre-wrap mt-auto">
                        <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">// Vector Base de Dolor (Raw)</div>
                        {spiderData.pain}
                    </div>
                )}
            </div>
        );
    };

    const renderMarioPanel = () => (
        <div className="flex-1 flex flex-col bg-[#0B0B0C] border-l border-white/[0.05] relative shadow-xl h-full">
            {/* Decorative Background Blob for the Bot */}
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
                            onClick={() => fetchSpiderStrategy(true)}
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
                                    onClick={() => fetchSpiderStrategy(false)}
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

    const renderGestion = () => (
        <div className="space-y-6 animate-in fade-in duration-300 flex flex-col h-full">
            <div className="p-5 bg-[#0B0B0C] rounded-2xl border border-white/5 shadow-inner">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Estado del Lead (CRM)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                        { label: 'Nuevo', color: 'slate' },
                        { label: 'Contactado', color: 'indigo' },
                        { label: 'En Espera', color: 'sky' },
                        { label: 'Cita Agendada', color: 'emerald' },
                        { label: 'Propuesta Enviada', color: 'teal' },
                        { label: 'Cerrado Ganado', color: 'amber' },
                        { label: 'Cerrado Perdido', color: 'rose' },
                        { label: 'Descartados', color: 'zinc' },
                        { label: 'Sin WhatsApp', color: 'red' }
                    ].map(statusObj => {
                        const isActive = lead.status === statusObj.label;
                        let activeStyles = '';
                        if (isActive) {
                            switch (statusObj.color) {
                                case 'indigo': activeStyles = 'bg-indigo-500/20 text-indigo-400 border-indigo-500 shadow-md'; break;
                                case 'sky': activeStyles = 'bg-sky-500/20 text-sky-400 border-sky-500 shadow-md'; break;
                                case 'emerald': activeStyles = 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-md'; break;
                                case 'teal': activeStyles = 'bg-teal-500/20 text-teal-400 border-teal-500 shadow-md'; break;
                                case 'amber': activeStyles = 'bg-amber-500/20 text-amber-400 border-amber-500 shadow-md'; break;
                                case 'rose': activeStyles = 'bg-rose-500/20 text-rose-400 border-rose-500 shadow-md'; break;
                                case 'red': activeStyles = 'bg-red-500/20 text-red-500 border-red-500 shadow-md'; break;
                                case 'zinc': activeStyles = 'bg-zinc-500/20 text-zinc-400 border-zinc-500 shadow-md'; break;
                                default: activeStyles = 'bg-slate-500/20 text-slate-300 border-slate-500 shadow-md';
                            }
                        } else {
                            activeStyles = 'bg-transparent text-slate-400 border-white/10 hover:border-white/20 hover:bg-white/5';
                        }

                        return (
                            <button
                                key={statusObj.label}
                                onClick={() => setStatusModal({ isOpen: true, newStatus: statusObj.label })}
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

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            ></div>

            {/* Slide-over panel container (1400px dual-column) */}
            <div className="relative w-[1400px] max-w-[95vw] bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] flex border-l border-white/10 animate-in slide-in-from-right duration-300 h-full">

                {/* Left Column (Data Tabs) */}
                <div className="flex-1 flex flex-col bg-gradient-to-b from-[#11131A] to-[#0A0B10] h-full overflow-hidden">
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-black text-white tracking-tight truncate max-w-[500px] drop-shadow-md">{lead.name}</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0 group">
                                <X className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${lead.opportunityLevel === 'Critical' ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>{lead.opportunityLevel}</span>
                            {lead.is_advertising && <span className="px-2.5 py-1 bg-accent-red/20 text-accent-red border border-accent-red/30 text-[10px] font-bold rounded uppercase">Ads Active</span>}
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-white/5 bg-black/20 backdrop-blur-sm shrink-0">
                        {['inteligencia', 'estrategia', 'gestion'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-[1] py-4 text-[10px] font-black uppercase tracking-[0.1em] transition-all relative overflow-hidden group ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                <span className="relative z-10">{tab === 'gestion' ? 'Gestión' : tab === 'estrategia' ? 'Radiografía Spider' : tab}</span>

                                {activeTab === tab && (
                                    <div className="absolute bottom-0 inset-x-0 h-[2px] bg-accent-blue shadow-[0_0_10px_rgba(56,189,248,0.5)] animate-in fade-in duration-300" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6 scroll-smooth minimal-scrollbar">
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
                    <div className="p-6 border-t border-white/5 bg-[#0B0B0C] relative overflow-hidden shrink-0">
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        <a
                            href={lead.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.address || ''}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all shadow-[0_0_15px_rgba(255,255,255,0.02)] group"
                        >
                            Ver en Google Maps <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                        </a>
                    </div>
                </div>

                {/* Resizer Handle */}
                <div
                    className="w-1.5 bg-transparent hover:bg-accent-blue/50 active:bg-accent-blue cursor-col-resize shrink-0 transition-colors z-50 group relative"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        isDraggingRef.current = true;
                        document.body.style.cursor = 'col-resize';
                        document.body.style.userSelect = 'none';
                    }}
                >
                    {/* Visual affordance indicator on hover */}
                    <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-0.5 h-12 bg-accent-blue/50 rounded-full"></div>
                    </div>
                </div>

                {/* Right Column (MARIO Copilot AI) */}
                <div
                    className="shrink-0 h-full border-l border-white/5 bg-[#0B0B0C] transition-none"
                    style={{ width: `${marioWidth}px` }}
                >
                    {renderMarioPanel()}
                </div>
            </div>

            <StatusUpdateModal
                isOpen={statusModal.isOpen}
                newStatus={statusModal.newStatus}
                onClose={() => setStatusModal({ isOpen: false, newStatus: null })}
                onConfirm={confirmStatusUpdate}
            />
        </div>
    );
};

export default LeadDetailsPanel;
