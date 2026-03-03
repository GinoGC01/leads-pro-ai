import React from 'react';
import { ExternalLink, Phone, Star, Globe, ChevronDown, MapPin } from 'lucide-react';

const STATUS_OPTIONS = [
    { label: 'Nuevo', color: 'bg-[#5b86e5]/10 text-[#5b86e5] border border-[#5b86e5]/20' },
    { label: 'Contactado', color: 'bg-[#ff7eb3]/10 text-[#ff7eb3] border border-[#ff7eb3]/20' },
    { label: 'Cita Agendada', color: 'bg-[#f6d365]/10 text-[#f6d365] border border-[#f6d365]/20' },
    { label: 'Propuesta Enviada', color: 'bg-[#f6d365]/10 text-[#f6d365] border border-[#f6d365]/20' },
    { label: 'En Espera', color: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
    { label: 'Cerrado Ganado', color: 'bg-[#00e57c]/10 text-[#00e57c] border border-[#00e57c]/20' },
    { label: 'Sin WhatsApp', color: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' },
    { label: 'Descartados', color: 'bg-zinc-800 text-zinc-500 border border-zinc-700/50' },
    { label: 'Cerrado Perdido', color: 'bg-accent-red/10 text-accent-red border border-accent-red/20' }
];

/**
 * LeadRow — Single table row for one lead.
 * WRAPPED IN React.memo: only re-renders if its own props change.
 * This is the critical performance optimization:
 * - Checking a different row's checkbox won't re-render this one.
 * - Opening a modal won't re-render unaffected rows.
 */
const LeadRow = React.memo(({ lead, isSelected, onToggleSelect, onStatusChange, onClickRow }) => {
    return (
        <tr
            onClick={onClickRow}
            className={`group cursor-pointer hover:bg-white/5 transition-colors ${isSelected ? 'bg-accent-blue/10' : lead.is_zombie ? 'opacity-50 grayscale' : ''}`}
        >
            {/* Checkbox */}
            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggleSelect}
                    className="w-4 h-4 rounded border-slate-600 bg-white/5 text-accent-blue focus:ring-accent-blue cursor-pointer"
                />
            </td>

            {/* Business Name + Badges */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className="font-bold text-white tracking-tight">{lead.name}</div>
                    {lead.source === 'google_maps' && (
                        <span className="flex items-center justify-center p-1 bg-white/5 rounded border border-white/10" title="Google Maps" aria-label="Google Maps Source">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16"><g fill="none" fillRule="evenodd" clipRule="evenodd"><path fill="#f44336" d="M7.209 1.061c.725-.081 1.154-.081 1.933 0a6.57 6.57 0 0 1 3.65 1.82a100 100 0 0 0-1.986 1.93q-1.876-1.59-4.188-.734q-1.696.78-2.362 2.528a78 78 0 0 1-2.148-1.658a.26.26 0 0 0-.16-.027q1.683-3.245 5.26-3.86" opacity=".987" /><path fill="#ffc107" d="M1.946 4.92q.085-.013.161.027a78 78 0 0 0 2.148 1.658A7.6 7.6 0 0 0 4.04 7.99q.037.678.215 1.331L2 11.116Q.527 8.038 1.946 4.92" opacity=".997" /><path fill="#448aff" d="M12.685 13.29a26 26 0 0 0-2.202-1.74q1.15-.812 1.396-2.228H8.122V6.713q3.25-.027 6.497.055q.616 3.345-1.423 6.032a7 7 0 0 1-.51.49" opacity=".999" /><path fill="#43a047" d="M4.255 9.322q1.23 3.057 4.51 2.854a3.94 3.94 0 0 0 1.718-.626q1.148.812 2.202 1.74a6.62 6.62 0 0 1-4.027 1.684a6.4 6.4 0 0 1-1.02 0Q3.82 14.524 2 11.116z" opacity=".993" /></g></svg>
                        </span>
                    )}
                    {lead.source === 'manual' && (
                        <span className="flex items-center justify-center p-1 bg-white/5 rounded border border-white/10 text-slate-300" title={lead.sourceLabel || 'Manual'} aria-label="Manual Source">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 1664 1664"><path fill="currentColor" d="M832 0Q673 0 560.5 112.5T448 384t112.5 271.5T832 768t271.5-112.5T1216 384t-112.5-271.5T832 0m0 896q112 0 227 22t224 69.5t193.5 114t136 162.5t51.5 208q0 75-57 133.5t-135 58.5H192q-78 0-135-58.5T0 1472q0-112 51.5-208t136-162.5t193.5-114T605 918t227-22" /></svg>
                        </span>
                    )}
                    {lead.source && !['google_maps', 'manual'].includes(lead.source) && (
                        <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-black rounded border border-purple-500/20" title={lead.sourceLabel || lead.source}>EXT</span>
                    )}
                    {lead.is_advertising && (
                        <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded uppercase">Ads</span>
                    )}
                    {lead.is_zombie && (
                        <span className="px-2 py-0.5 bg-slate-400 text-white text-[9px] font-bold rounded uppercase">Zombie</span>
                    )}
                    {lead.enrichmentStatus === 'completed' && (
                        <span className="px-2 py-0.5 bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)] border border-indigo-400/30 text-white text-[9px] font-bold rounded uppercase flex items-center">Vortex</span>
                    )}
                    {lead.enrichmentStatus === 'skipped_rented_land' && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 text-[9px] font-bold rounded uppercase flex items-center">Skipped</span>
                    )}
                </div>
                <div className="text-sm text-slate-500 mt-0.5">{lead.address}</div>
                {lead.email && <div className="text-xs text-accent-blue font-medium mt-1 uppercase tracking-wider">{lead.email}</div>}
            </td>

            {/* Status CRM */}
            <td className="px-6 py-4">
                <div className="relative group" onClick={(e) => e.stopPropagation()}>
                    <select
                        value={lead.status || 'Nuevo'}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className={`appearance-none font-bold text-[10px] pl-3 pr-7 py-1.5 rounded-full outline-none cursor-pointer border-0 shadow-sm transition-all ${STATUS_OPTIONS.find(opt => opt.label === (lead.status || 'Nuevo'))?.color}`}
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt.label} value={opt.label} className="bg-slate-900 text-white">{opt.label.toUpperCase()}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>
            </td>

            {/* Tech / Performance */}
            <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1 mb-2">
                    {lead.tech_stack && lead.tech_stack.length > 0 ? (
                        lead.tech_stack.map(tech => (
                            <span key={tech} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 rounded">
                                {tech}
                            </span>
                        ))
                    ) : (
                        <span className="text-[10px] text-slate-400 italic">No detectada</span>
                    )}
                </div>
                {lead.performance_metrics?.ttfb && (
                    <div className={`text-[10px] font-mono ${lead.performance_metrics.performance_issue ? 'text-red-500 font-bold' : 'text-emerald-600'}`}>
                        TTFB: {lead.performance_metrics.ttfb}ms
                    </div>
                )}
            </td>

            {/* Sales Angle */}
            <td className="px-6 py-4">
                <div className="text-sm text-slate-400 max-w-[280px] leading-tight font-medium">
                    "{lead.sales_angle}"
                </div>
            </td>

            {/* Score */}
            <td className="px-6 py-4 text-center">
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-black border border-white/10 ${lead.opportunityLevel === 'Critical' ? 'bg-accent-blue text-white' : lead.opportunityLevel === 'High' ? 'bg-pastel-orange text-[#161616]' : lead.opportunityLevel === 'Medium' ? 'bg-pastel-blue text-[#161616]' : 'bg-white/10 text-slate-300'}`}>
                    {lead.leadOpportunityScore}
                </div>
            </td>

            {/* Actions */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {lead.website && (
                        <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-400 transition-colors p-2 bg-white/5 rounded-lg border border-white/5 hover:border-indigo-500/30">
                            <Globe className="w-4 h-4" />
                        </a>
                    )}
                    <a href={lead.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.address || ''}`)}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors p-2 bg-white/5 rounded-lg border border-white/5 hover:border-emerald-500/30">
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </td>
        </tr>
    );
});

LeadRow.displayName = 'LeadRow';

export default LeadRow;
