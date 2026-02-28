import React, { useState, useMemo } from 'react';
import { ExternalLink, Mail, Phone, MapPin, Star, Globe, MessageSquare, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown, Trash2, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { updateLeadStatus, bulkDeleteLeads } from '../services/api';
import AlertService from '../services/AlertService';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const STATUS_OPTIONS = [
    { label: 'Nuevo', color: 'bg-white/5 text-slate-300 border border-white/10' },
    { label: 'Contactado', color: 'bg-pastel-blue/10 text-pastel-blue border border-pastel-blue/20' },
    { label: 'Cita Agendada', color: 'bg-pastel-yellow/10 text-pastel-yellow border border-pastel-yellow/20' },
    { label: 'Propuesta Enviada', color: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
    { label: 'Cerrado Ganado', color: 'bg-pastel-green/10 text-pastel-green border border-pastel-green/20' },
    { label: 'Cerrado Perdido', color: 'bg-accent-red/10 text-accent-red border border-accent-red/20' }
];

const LeadsTable = ({ leads, onRowClick }) => {
    const [localLeads, setLocalLeads] = useState(leads || []);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [sortConfig, setSortConfig] = useState({ key: 'leadOpportunityScore', direction: 'desc' });
    const [filters, setFilters] = useState({
        onlyWordPress: false,
        onlyWithEmail: false,
        onlyHighTicket: false,
        onlyAds: false,
        excludeZombies: false,
        performance: 'all',
    });

    React.useEffect(() => {
        setLocalLeads(leads);
        setSelectedLeads([]); // Reset selection when leads change
    }, [leads]);

    const filteredAndSortedLeads = useMemo(() => {
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

    const handleSelectLead = (id, e) => {
        e.stopPropagation();
        setSelectedLeads(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedLeads.length === filteredAndSortedLeads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(filteredAndSortedLeads.map(l => l._id));
        }
    };

    const handleDeleteBulk = async () => {
        setIsDeleting(true);

        const deleteReq = bulkDeleteLeads(selectedLeads);

        AlertService.promise(
            deleteReq,
            {
                loading: `Eliminando ${selectedLeads.length} leads...`,
                success: 'Leads eliminados permanentemente',
                error: 'Error al purgar los leads seleccionados'
            }
        ).then(() => {
            // Update local state by removing deleted leads
            setLocalLeads(prev => prev.filter(l => !selectedLeads.includes(l._id)));
            setSelectedLeads([]);
            setIsDeleteModalOpen(false);
        }).finally(() => {
            setIsDeleting(false);
        });
    };

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
        if (note === null) return;

        const updateReq = updateLeadStatus(leadId, newStatus, note);

        AlertService.promise(
            updateReq,
            {
                loading: 'Actualizando estado en CRM...',
                success: 'Estado del lead actualizado',
                error: 'Error de sincronización con CRM'
            }
        ).then(({ data }) => {
            setLocalLeads(prev => prev.map(l => l._id === leadId ? { ...l, status: data.status, interactionLogs: data.interactionLogs } : l));
        });
    };

    if (!localLeads || localLeads.length === 0) return null;

    return (
        <>
            <div className="bg-app-card rounded-3xl border border-white/5 overflow-hidden relative">
                {/* Bulk Actions Bar */}
                {selectedLeads.length > 0 && (
                    <div className="absolute top-0 inset-x-0 z-20 bg-indigo-600 text-white p-4 flex items-center justify-between animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSelectedLeads([])} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-bold">
                                {selectedLeads.length} leads seleccionados
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Eliminar Permanentemente
                            </button>
                        </div>
                    </div>
                )}

                {/* Filter Bar */}
                <div className="bg-[#1e1e20] border-b border-white/5 p-4 flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Filtros:</span>
                        <button
                            onClick={() => toggleFilter('onlyWordPress')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.onlyWordPress ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                        >
                            WordPress ({counts.wordpress})
                        </button>
                        <button
                            onClick={() => toggleFilter('onlyWithEmail')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.onlyWithEmail ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                        >
                            Con Email ({counts.withEmail})
                        </button>
                        <button
                            onClick={() => toggleFilter('onlyHighTicket')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.onlyHighTicket ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                        >
                            High Ticket ({counts.highTicket})
                        </button>
                        <button
                            onClick={() => toggleFilter('onlyAds')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.onlyAds ? 'bg-red-600 text-white border-red-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                        >
                            Anunciando ({counts.ads})
                        </button>
                        <button
                            onClick={() => toggleFilter('excludeZombies')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.excludeZombies ? 'bg-slate-800 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                        >
                            Ocultar Zombies ({counts.zombies})
                        </button>

                        <div className="h-6 w-px bg-slate-300 mx-1"></div>

                        <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setPerfFilter('all')}
                                className={`px-3 py-1.5 text-xs font-bold transition-all ${filters.performance === 'all' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                Velocidad: Todo
                            </button>
                            <button
                                onClick={() => setPerfFilter('fast')}
                                className={`px-3 py-1.5 text-xs font-bold transition-all border-l border-slate-200 ${filters.performance === 'fast' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                Rápido ({counts.fast})
                            </button>
                            <button
                                onClick={() => setPerfFilter('slow')}
                                className={`px-3 py-1.5 text-xs font-bold transition-all border-l border-slate-200 ${filters.performance === 'slow' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                Lento ({counts.slow})
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-widest border-t border-white/5 pt-3">
                        <div>
                            Mostrando <span className="text-white">{filteredAndSortedLeads.length}</span> de <span className="text-white">{localLeads.length}</span> leads encontrados
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-4 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedLeads.length === filteredAndSortedLeads.length && filteredAndSortedLeads.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-slate-600 bg-white/5 text-accent-blue focus:ring-accent-blue cursor-pointer"
                                    />
                                </th>
                                <th
                                    className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-white/5 transition-colors"
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
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredAndSortedLeads.map((lead) => (
                                <tr
                                    key={lead._id}
                                    onClick={() => onRowClick && onRowClick(lead)}
                                    className={`group cursor-pointer hover:bg-white/5 transition-colors ${selectedLeads.includes(lead._id) ? 'bg-accent-blue/10' : lead.is_zombie ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedLeads.includes(lead._id)}
                                            onChange={(e) => handleSelectLead(lead._id, e)}
                                            className="w-4 h-4 rounded border-slate-600 bg-white/5 text-accent-blue focus:ring-accent-blue cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-white tracking-tight">{lead.name}</div>
                                            {lead.is_advertising && (
                                                <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded uppercase">Ads</span>
                                            )}
                                            {lead.is_zombie && (
                                                <span className="px-2 py-0.5 bg-slate-400 text-white text-[9px] font-bold rounded uppercase">Zombie</span>
                                            )}
                                            {lead.enrichmentStatus === 'completed' && (
                                                <span className="px-2 py-0.5 bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)] border border-indigo-400/30 text-white text-[9px] font-bold rounded uppercase flex items-center">
                                                    Vortex
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-slate-500 mt-0.5">{lead.address}</div>
                                        {lead.email && <div className="text-xs text-accent-blue font-medium mt-1 uppercase tracking-wider">{lead.email}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative group" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                value={lead.status || 'Nuevo'}
                                                onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                                                className={`appearance-none font-bold text-[10px] px-3 py-1.5 rounded-full outline-none pr-8 cursor-pointer border-0 shadow-sm transition-all ${STATUS_OPTIONS.find(opt => opt.label === (lead.status || 'Nuevo'))?.color}`}
                                            >
                                                {STATUS_OPTIONS.map(opt => (
                                                    <option key={opt.label} value={opt.label}>{opt.label.toUpperCase()}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                        </div>
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
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-400 max-w-[280px] leading-tight font-medium">
                                            "{lead.sales_angle}"
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-black border border-white/10 ${lead.opportunityLevel === 'Critical' ? 'bg-accent-blue text-white' : lead.opportunityLevel === 'High' ? 'bg-pastel-orange text-[#161616]' : lead.opportunityLevel === 'Medium' ? 'bg-pastel-blue text-[#161616]' : 'bg-white/10 text-slate-300'}`}>
                                            {lead.leadOpportunityScore}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteBulk}
                count={selectedLeads.length}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default LeadsTable;
