import React from 'react';
import { Globe, MapPin, Phone, AlertCircle, Loader2, CheckCircle2, X, Star, Zap, Server, Activity, AlertTriangle, Camera } from 'lucide-react';
import Tooltip from '../../Tooltip';
import RotatingLoader from './RotatingLoader';
import VisionAnalysisCard from './VisionAnalysisCard';

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

/**
 * VortexRadiography
 * Renders the "Inteligencia" tab. Purely presentational, zero API calls.
 * Handles all visual states: no website, skipped (rented land), unprocessed, processing, failed, completed.
 */
const VortexRadiography = ({
    lead,
    isProcessing,
    isCompleted,
    isFailed,
    isSkippedRentedLand,
    isActivating,
    onActivateVortex,
    isSpiderHelpActive,
    onToggleSpiderHelp,
    isVisionPending,
    isVisionProcessing,
    isVisionCompleted,
    onActivateDeepVision
}) => {
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

    // No website
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

    // Skipped (Rented Land)
    if (isSkippedRentedLand) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {sharedHeader}
                <div className="rounded-2xl p-6 border bg-[#151720] border-yellow-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-[40px] pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2 rounded-xl border bg-yellow-500/20 border-yellow-500/30 text-yellow-500">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Tierra Alquilada (Skipped)</h3>
                    </div>
                    <div className="space-y-4 mb-2 relative z-10">
                        <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-yellow-400 text-xs flex gap-3 items-start shadow-sm backdrop-blur-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-500" />
                            <div>
                                <p className="font-bold text-yellow-500 mb-1 text-[11px] uppercase tracking-widest">Auditoría Omitida</p>
                                <p className="text-yellow-400/80 leading-relaxed font-medium text-[11px]">
                                    El prospecto depende de plataformas de "tierra alquilada" (Instagram, Linktree) y carece de infraestructura propia evaluable.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Not completed yet (unprocessed, pending, or failed)
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

                    {(isFailed || !lead.enrichmentStatus || lead.enrichmentStatus === 'unprocessed') && (
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
                                onClick={onActivateVortex}
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

    // Completed — Full Radiography
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {sharedHeader}

            <div className="flex items-center justify-between mt-4 mb-2">
                <h3 className="text-[12px] font-black tracking-widest text-white uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent-blue" />
                    Radiografía SPIDER
                </h3>
                <button
                    onClick={onToggleSpiderHelp}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all ${isSpiderHelpActive
                        ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/50 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                        : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20 hover:text-slate-400'
                        }`}
                >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {isSpiderHelpActive ? 'Ayuda Activada' : 'Activar Ayuda'}
                </button>
            </div>

            {/* Tarjeta 1: Core Web Vitals */}
            <Tooltip className="block w-full" position="top" disabled={!isSpiderHelpActive}
                text="Mide la velocidad real. Un sitio lento (LCP > 2.5s) o con mala respuesta (TTFB) frustra a los clientes y penaliza en Google. Ángulo: 'Tu página tarda tanto en abrir que los clientes se van a la competencia'.">
                <div className="bg-app-card rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Rendimiento (Lighthouse)</h4>
                        </div>
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
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-500 uppercase">Largest Contentful Paint</p>
                            <div className="flex items-end gap-2">
                                <p className="text-xl font-mono font-bold text-slate-200">{lead.performance_metrics?.lcp || '---'}</p>
                                {lead.performance_metrics?.lcp && parseFloat(lead.performance_metrics.lcp) > 2.5 && (
                                    <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded uppercase mb-1">Lento</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1 p-4 bg-slate-900/40 rounded-xl border border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase">Time To First Byte</p>
                            <p className="text-xl font-mono font-bold text-slate-200">
                                {lead.performance_metrics?.ttfb !== undefined ? `${lead.performance_metrics.ttfb} ms` : '---'}
                            </p>
                        </div>
                    </div>
                </div>
            </Tooltip>

            {/* Tarjeta 2: Salud SEO */}
            <Tooltip className="block w-full" position="top" disabled={!isSpiderHelpActive}
                text="Verifica la estructura orgánica. Si omiten la Etiqueta Title o Meta Description, Google no los mostrará correctamente en búsquedas. Ángulo: 'La gente busca tu servicio, pero Google está escondiendo tu página porque internamente está incompleta'.">
                <div className="bg-app-card rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Estructura SEO</h4>
                        </div>
                    </div>
                    <div className="p-4 space-y-3 bg-[#0B0B0C]">
                        <div className="flex items-start justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-300">Etiquetas H1</p>
                                <p className={`text-[9px] italic ${!lead.seo_audit?.h1Count ? 'text-red-400' : 'text-slate-500'}`}>
                                    {!lead.seo_audit?.h1Count ? 'Falta H1 (Penalización severa en Google)' : `${lead.seo_audit.h1Count} Encontrados`}
                                </p>
                            </div>
                            {lead.seo_audit?.h1Count ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />}
                        </div>
                        <div className="flex items-start justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-300">Meta Descripción</p>
                                <p className={`text-[9px] italic ${!lead.seo_audit?.hasMetaDescription ? 'text-amber-400' : 'text-slate-500'}`}>
                                    {!lead.seo_audit?.hasMetaDescription ? 'Sin descripción configurada para resultados de búsqueda.' : 'Configurada correctamente'}
                                </p>
                            </div>
                            {lead.seo_audit?.hasMetaDescription ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                        </div>
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

            {/* Tarjeta 3: Tech Stack */}
            <Tooltip className="block w-full" position="top" disabled={!isSpiderHelpActive}
                text="Detecta la tecnología subyacente. Usar CMS anticuados revela abandono digital, y no poseer píxeles de Analytics significa que giran a ciegas sin medir conversiones. Ángulo: 'Tu infraestructura luce vieja y no estás midiendo si la inversión en anuncios te da retorno'.">
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

            {/* DEEP VISION BLOCK */}
            {isVisionCompleted ? (
                <VisionAnalysisCard analysis={lead.vision_analysis} />
            ) : isVisionProcessing ? (
                <div className="bg-app-card rounded-2xl border border-indigo-500/20 p-6 flex flex-col items-center justify-center mt-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none"></div>
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-3 relative z-10" />
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest relative z-10">Analizando UX/UI con IA Multimodal...</p>
                    <p className="text-[10px] text-indigo-400/60 mt-2 relative z-10 text-center">OpenAI GPT-4o Vision está procesando la captura móvil del prospecto.</p>
                </div>
            ) : isVisionPending && !isSkippedRentedLand ? (
                <div className="bg-[#151720] rounded-2xl border border-fuchsia-500/20 p-6 mt-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                        <div>
                            <h4 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-4 h-4 text-fuchsia-400" /> Deep Vision UX Analysis
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-md">Realiza una auditoría visual completa como si fueras un comprador intentando navegar la plataforma desde el móvil. Descubre fricciones de conversión críticas.</p>
                        </div>
                        <button
                            onClick={onActivateDeepVision}
                            className="shrink-0 px-6 py-3 bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 hover:bg-fuchsia-500/20 hover:border-fuchsia-500/30 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(217,70,239,0.1)] active:scale-95"
                        >
                            <Camera className="w-4 h-4" /> Ejecutar Deep Vision <span className="text-fuchsia-500/50">($0.05)</span>
                        </button>
                    </div>
                </div>
            ) : null}

            {/* Contactos Extraídos */}
            {lead.extracted_contacts && (lead.extracted_contacts.emails?.length > 0 || lead.extracted_contacts.phones?.length > 0 || lead.extracted_contacts.social_links?.length > 0) && (
                <Tooltip className="block w-full" position="top" disabled={!isSpiderHelpActive}
                    text="Contactos capturados automáticamente del código fuente. Útil para evitar el filtro de recepción y apuntar a los tomadores de decisión mediante canales directos.">
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

            {/* Raw JSON Accordion */}
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

export default VortexRadiography;
