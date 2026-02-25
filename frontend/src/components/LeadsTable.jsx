import React, { useState, useMemo } from 'react';
import { ExternalLink, Mail, Phone, MapPin, Star, Globe, MessageSquare, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { updateLeadStatus } from '../services/api';

const STATUS_OPTIONS = [
    { label: 'Nuevo', color: 'bg-slate-100 text-slate-600' },
    { label: 'Contactado', color: 'bg-blue-100 text-blue-600' },
    { label: 'Cita Agendada', color: 'bg-amber-100 text-amber-600' },
    { label: 'Propuesta Enviada', color: 'bg-purple-100 text-purple-600' },
    { label: 'Cerrado Ganado', color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Cerrado Perdido', color: 'bg-red-100 text-red-600' }
];

const LeadsTable = ({ leads, onRowClick }) => {
    const [localLeads, setLocalLeads] = useState(leads || []);
    const [sortConfig, setSortConfig] = useState({ key: 'leadOpportunityScore', direction: 'desc' });
    const [filters, setFilters] = useState({
        onlyWordPress: false,
        onlyWithEmail: false,
        onlyHighTicket: false,
        onlyAds: false,
        excludeZombies: false,
        performance: 'all', // 'all', 'fast', 'slow'
    });

    React.useEffect(() => {
        setLocalLeads(leads);
    }, [leads]);

    const filteredAndSortedLeads = useMemo(() => {
        // 1. Filter
        let result = [...localLeads].filter(lead => {
            if (filters.onlyWordPress) {
                const hasWP = lead.tech_stack?.some(t => t.toLowerCase().includes('wordpress'));
                if (!hasWP) return false;
            }
            if (filters.onlyWithEmail && !lead.email) return false;
            if (filters.onlyHighTicket && !lead.isHighTicket) return false;
            if (filters.onlyAds && !lead.is_advertising) return false;
            if (filters.excludeZombies && lead.is_zombie) return false;

            if (filters.performance === 'fast') {
                if (!lead.performance_metrics?.ttfb || lead.performance_metrics.ttfb > 500) return false;
            }
            if (filters.performance === 'slow') {
                if (!lead.performance_metrics?.ttfb || lead.performance_metrics.ttfb < 1500) return false;
            }
            return true;
        });

        // 2. Sort
        if (sortConfig !== null) {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'ttfb') {
                    aValue = a.performance_metrics?.ttfb || Infinity;
                    bValue = b.performance_metrics?.ttfb || Infinity;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [localLeads, sortConfig, filters]);

    const toggleFilter = (key) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const setPerfFilter = (val) => {
        setFilters(prev => ({ ...prev, performance: val }));
    };

    const counts = useMemo(() => ({
        wordpress: localLeads.filter(l => l.tech_stack?.some(t => t.toLowerCase().includes('wordpress'))).length,
        withEmail: localLeads.filter(l => l.email).length,
        highTicket: localLeads.filter(l => l.isHighTicket).length,
        ads: localLeads.filter(l => l.is_advertising).length,
        zombies: localLeads.filter(l => l.is_zombie).length,
        fast: localLeads.filter(l => l.performance_metrics?.ttfb > 0 && l.performance_metrics.ttfb <= 500).length,
        slow: localLeads.filter(l => l.performance_metrics?.ttfb >= 1500).length,
    }), [localLeads]);

    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-primary-600" /> : <ArrowDown className="w-3 h-3 text-primary-600" />;
    };

    const handleStatusChange = async (leadId, newStatus) => {
        const note = window.prompt(`Actualizando a '${newStatus}'. ¿Alguna nota sobre el contacto?`);
        try {
            const { data } = await updateLeadStatus(leadId, newStatus, note);
            // Update local state to reflect change immediately
            setLocalLeads(prev => prev.map(l => l._id === leadId ? { ...l, status: data.status, interactionLogs: data.interactionLogs } : l));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('No se pudo actualizar el estado del lead.');
        }
    };

    if (!localLeads || localLeads.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Filter Bar */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col gap-4">
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Filtros:</span>
                    <button
                        onClick={() => toggleFilter('onlyWordPress')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.onlyWordPress
                            ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        WordPress ({counts.wordpress})
                    </button>
                    <button
                        onClick={() => toggleFilter('onlyWithEmail')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.onlyWithEmail
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        Con Email ({counts.withEmail})
                    </button>
                    <button
                        onClick={() => toggleFilter('onlyHighTicket')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.onlyHighTicket
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        High Ticket ({counts.highTicket})
                    </button>
                    <button
                        onClick={() => toggleFilter('onlyAds')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.onlyAds
                            ? 'bg-red-600 text-white border-red-700 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        Anunciando ({counts.ads})
                    </button>
                    <button
                        onClick={() => toggleFilter('excludeZombies')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.excludeZombies
                            ? 'bg-slate-800 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        Ocultar Zombies ({counts.zombies})
                    </button>

                    <div className="h-6 w-px bg-slate-300 mx-1"></div>

                    <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setPerfFilter('all')}
                            className={`px-3 py-1.5 text-xs font-bold transition-all ${filters.performance === 'all' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            Velocidad: Todo
                        </button>
                        <button
                            onClick={() => setPerfFilter('fast')}
                            className={`px-3 py-1.5 text-xs font-bold transition-all border-l border-slate-200 ${filters.performance === 'fast' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            Rápido ({counts.fast})
                        </button>
                        <button
                            onClick={() => setPerfFilter('slow')}
                            className={`px-3 py-1.5 text-xs font-bold transition-all border-l border-slate-200 ${filters.performance === 'slow' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            Lento ({counts.slow})
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-3">
                    <div>
                        Mostrando <span className="text-slate-900">{filteredAndSortedLeads.length}</span> de <span className="text-slate-900">{localLeads.length}</span> leads encontrados
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th
                                className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => requestSort('name')}
                            >
                                <div className="flex items-center gap-2">
                                    Negocio {getSortIcon('name')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => requestSort('status')}
                            >
                                <div className="flex items-center gap-2">
                                    Estado CRM {getSortIcon('status')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => requestSort('ttfb')}
                            >
                                <div className="flex items-center gap-2">
                                    Tech / Performance {getSortIcon('ttfb')}
                                </div>
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Oportunidad / Ángulo</th>
                            <th
                                className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-center"
                                onClick={() => requestSort('leadOpportunityScore')}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    Score {getSortIcon('leadOpportunityScore')}
                                </div>
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredAndSortedLeads.map((lead) => (
                            <tr
                                key={lead.placeId}
                                onClick={() => onRowClick && onRowClick(lead)}
                                className={`group cursor-pointer hover:bg-slate-50 transition-colors ${lead.opportunityLevel === 'Critical' ? 'bg-indigo-50/50' : lead.is_zombie ? 'opacity-50 grayscale' : ''}`}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="font-semibold text-slate-900">{lead.name}</div>
                                        {lead.is_advertising && (
                                            <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded uppercase">Ads</span>
                                        )}
                                        {lead.is_zombie && (
                                            <span className="px-2 py-0.5 bg-slate-400 text-white text-[9px] font-bold rounded uppercase">Zombie</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-500 mt-0.5">{lead.address}</div>
                                    {lead.email && <div className="text-xs text-primary-600 font-medium mt-1 uppercase tracking-tight">{lead.email}</div>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="relative group">
                                        <select
                                            value={lead.status || 'Nuevo'}
                                            onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                                            className={`appearance-none font-bold text-[10px] px-3 py-1.5 rounded-full outline-none pr-8 cursor-pointer border-0 shadow-sm transition-all ${STATUS_OPTIONS.find(opt => opt.label === (lead.status || 'Nuevo'))?.color
                                                }`}
                                        >
                                            {STATUS_OPTIONS.map(opt => (
                                                <option key={opt.label} value={opt.label}>{opt.label.toUpperCase()}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                    </div>
                                    {lead.interactionLogs?.length > 0 && (
                                        <div
                                            title={lead.interactionLogs.map(l => `[${new Date(l.timestamp).toLocaleDateString()}] ${l.note}`).join('\n')}
                                            className="mt-2 flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter cursor-help"
                                        >
                                            <MessageSquare className="w-3 h-3" />
                                            {lead.interactionLogs.length} notas
                                        </div>
                                    )}
                                </td>
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
                                            {lead.performance_metrics.performance_issue && " (Lento)"}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-700 max-w-[280px] leading-tight italic font-medium">
                                        "{lead.sales_angle}"
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-black shadow-sm ${lead.opportunityLevel === 'Critical' ? 'bg-indigo-600 text-white' :
                                        lead.opportunityLevel === 'High' ? 'bg-orange-500 text-white' :
                                            lead.opportunityLevel === 'Medium' ? 'bg-blue-500 text-white' :
                                                'bg-slate-200 text-slate-600'
                                        }`}>
                                        {lead.leadOpportunityScore}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{lead.opportunityLevel}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {lead.website && (
                                            <a href={lead.website} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600">
                                                <Globe className="w-4 h-4" />
                                            </a>
                                        )}
                                        <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeadsTable;
