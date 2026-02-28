import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Metrics from './components/Metrics';
import Charts from './components/Charts';
import LeadsTable from './components/LeadsTable';
import AIChat from './components/AIChat';
import LeadDetailsPanel from './components/LeadDetailsPanel';
import DataIntelligence from './components/DataIntelligence';
import { getHistoryItem, getLeadsBySearch, getGlobalStats, exportUrl } from './services/api';
import AlertService from './services/AlertService';
import { Download, Database, Star, Phone, Search, BarChart3, Sparkles, X as CloseIcon, Bell, Settings, MapPin, Globe, ChevronRight, FileJson, FileText, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const Dashboard = () => {
    const [searchParams] = useSearchParams();
    const campaignId = searchParams.get('campaignId');
    const navigate = useNavigate();

    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState(null);
    const [globalStats, setGlobalStats] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [totalCost, setTotalCost] = useState(0);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [campaignMetadata, setCampaignMetadata] = useState(null);

    useEffect(() => {
        fetchGlobalStats();
    }, []);

    useEffect(() => {
        if (campaignId) {
            fetchSearchDetails(campaignId);
        } else {
            // Reset state if campaign is removed
            setLeads([]);
            setStats(null);
            setCampaignMetadata(null);
        }
    }, [campaignId]);

    const fetchHistory = async () => {
        try {
            const { data } = await getHistory();
            setHistory(data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const fetchGlobalStats = async () => {
        try {
            const { data } = await getGlobalStats();
            setGlobalStats(data);
        } catch (error) {
            console.error('Error fetching global stats:', error);
        }
    };

    const fetchSearchDetails = async (searchId) => {
        setIsLoading(true);
        try {
            const [historyRes, leadsRes] = await Promise.all([
                getHistoryItem(searchId),
                getLeadsBySearch(searchId)
            ]);

            const historyItem = historyRes.data;
            const leadsData = leadsRes.data;
            const pipelineStatus = { new: 0, contacted: 0, in_progress: 0, closed: 0 };
            const monthlyAcquisition = Array(12).fill(0);
            const exactDates = Array(12).fill(null).map(() => []);

            leadsData.forEach(lead => {
                const rawStatus = String(lead.status || '').toLowerCase().trim();

                if (['nuevo', 'new'].includes(rawStatus)) pipelineStatus.new++;
                else if (['contactado', 'contacted'].includes(rawStatus)) pipelineStatus.contacted++;
                else if (['cita agendada', 'propuesta enviada', 'in_progress'].includes(rawStatus)) pipelineStatus.in_progress++;
                else if (['cerrado ganado', 'cerrado perdido', 'closed'].includes(rawStatus)) pipelineStatus.closed++;
                else pipelineStatus.new++;

                const dateObj = lead.createdAt ? new Date(lead.createdAt) : new Date(historyItem.createdAt);
                const month = dateObj.getMonth();
                monthlyAcquisition[month]++;

                // Collect unique formatted dates
                const formattedDate = dateObj.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
                if (!exactDates[month].includes(formattedDate)) {
                    exactDates[month].push(formattedDate);
                }
            });

            setCampaignMetadata(historyItem);
            setStats({
                summary: {
                    totalLeads: leadsData.length,
                    totalSearches: 1,
                    totalInvested: historyItem.totalCost,
                    totalHighTicket: leadsData.filter(l => l.isHighTicket).length,
                    avgScore: leadsData.reduce((acc, l) => acc + (l.leadOpportunityScore || 0), 0) / (leadsData.length || 1)
                },
                coverage: {
                    email: (historyItem.leadsWithEmail / (historyItem.resultsCount || 1)) * 100,
                    web: (historyItem.leadsWithWeb / (historyItem.resultsCount || 1)) * 100
                },
                billing: {
                    totalEstimated: historyItem.totalCost,
                    discoveryCost: 0.032,
                    detailsCost: historyItem.resultsCount * 0.008,
                    enrichmentCost: historyItem.leadsWithWeb * 0.007
                },
                efficiency: {
                    costPerLead: historyItem.totalCost / (historyItem.resultsCount || 1),
                    roiPotential: leadsData.filter(l => l.isHighTicket).length * 500
                },
                projection: {
                    monthlyEstimated: historyItem.totalCost * 30
                },
                charts: {
                    pipelineStatus,
                    monthlyAcquisition: globalStats?.charts?.monthlyAcquisition || monthlyAcquisition,
                    exactDates
                }
            });
            setTotalCost(historyItem.totalCost || 0);
            setLeads(leadsRes.data);
        } catch (error) {
            console.error('Error fetching search details:', error);
            AlertService.error('Error Crítico', 'No se pudieron cargar los detalles de la campaña.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocalStatusChange = (leadId, newStatus) => {
        setLeads(currentLeads => {
            const newLeads = currentLeads.map(l => l._id === leadId ? { ...l, status: newStatus } : l);

            setStats(prevStats => {
                if (!prevStats) return prevStats;
                const pipelineStatus = { new: 0, contacted: 0, in_progress: 0, closed: 0 };
                newLeads.forEach(lead => {
                    const rawStatus = String(lead.status || '').toLowerCase().trim();
                    if (['nuevo', 'new'].includes(rawStatus)) pipelineStatus.new++;
                    else if (['contactado', 'contacted'].includes(rawStatus)) pipelineStatus.contacted++;
                    else if (['cita agendada', 'propuesta enviada', 'in_progress'].includes(rawStatus)) pipelineStatus.in_progress++;
                    else if (['cerrado ganado', 'cerrado perdido', 'closed'].includes(rawStatus)) pipelineStatus.closed++;
                    else pipelineStatus.new++;
                });
                return { ...prevStats, charts: { ...prevStats.charts, pipelineStatus } };
            });

            return newLeads;
        });
    };

    const exportUrl = (id, format) => {
        // Build URL reliably
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        return `${baseUrl}/export/${id}/${format}`;
    };

    const handleExport = (format) => {
        if (!campaignId) return;
        window.open(exportUrl(campaignId, format), '_blank');
        setShowExportMenu(false);
    };

    return (
        <div className="min-h-screen bg-app-bg text-slate-200">
            {/* Refined Context Header */}
            <header className="px-10 py-8 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2">
                            Dashboard
                        </h1>
                        <p className="text-slate-400 text-sm">
                            {campaignId ? 'Este es tu panel de ejecución para la campaña activa.' : 'Bienvenido al Dashboard. Tu entorno de prospección.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">

                        {/* Export Menu Dropdown */}
                        {campaignId && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className="h-10 px-4 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 font-medium"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Exportar Data</span>
                                </button>

                                {showExportMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowExportMenu(false)}
                                        ></div>
                                        <div className="absolute right-0 top-12 mt-1 w-48 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-3 text-sm">
                                                <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Excel (.xlsx)
                                            </button>
                                            <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-3 text-sm">
                                                <FileText className="w-4 h-4 text-blue-400" /> CSV
                                            </button>
                                            <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-3 text-sm border-t border-white/5 mt-1 pt-3">
                                                <FileJson className="w-4 h-4 text-amber-400" /> JSON Raw
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="w-12 h-12 grid place-items-center">
                            <img src="/logo.png" alt="Marios Logo" className="w-8 h-8 object-contain drop-shadow-lg" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-10 pb-12 overflow-x-hidden">

                {/* Empty State Guard */}
                {!campaignId ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] bg-app-card rounded-3xl border border-dashed border-white/10 text-center">
                        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
                            <Search className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Ninguna campaña seleccionada</h2>
                        <p className="text-slate-400 max-w-md mx-auto mb-8">
                            El Dashboard es tu entorno de ejecución focalizado. Ve al módulo de adquisiciones para iniciar o seleccionar una campaña existente.
                        </p>
                        <button
                            onClick={() => navigate('/search')}
                            className="bg-white text-black font-bold uppercase tracking-widest text-xs px-8 py-4 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            Ir a Búsquedas
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Active Campaign Indicator Header */}
                        {campaignMetadata && (
                            <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-[0_0_30px_rgba(99,102,241,0.1)] backdrop-blur-sm">
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/50">
                                        <Database className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em] mb-1">Campaña de Prospección Activa</p>
                                        <h2 className="text-2xl font-black text-white">{campaignMetadata.keyword}</h2>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Volumen</p>
                                        <p className="text-xl font-black text-white">{campaignMetadata.resultsCount} <span className="text-xs text-slate-500">Leads</span></p>
                                    </div>
                                    <div className="w-px h-10 bg-white/10"></div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Localidad</p>
                                        <p className="text-sm font-bold text-white flex items-center gap-1 justify-end">
                                            <MapPin className="w-3 h-3 text-indigo-400" />
                                            {campaignMetadata.location}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dashboard Metrics */}
                        <div className="mb-8">
                            {stats && <Metrics stats={stats} />}
                        </div>

                        {/* Dashboard Charts */}
                        {stats && <Charts stats={stats} />}


                        {/* Full Width Table Wrap */}
                        <div className="w-full">
                            {/* Main Results */}
                            <div>
                                {/* Top Intelligence & Progress Area */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                                    {/* Data Intelligence Visual Insights */}
                                    {globalStats?.categories && (
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                                                        Market Category Leadership
                                                    </h3>
                                                    <p className="text-[11px] text-slate-400 font-medium">Distribución de leads por nicho detectado</p>
                                                </div>
                                                {!isLoading && (
                                                    <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                                                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                                        <span className="text-[10px] font-black text-indigo-700 uppercase">AI Active</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-4 flex-1">
                                                {globalStats.categories.map((cat, idx) => (
                                                    <div key={idx} className="group cursor-default">
                                                        <div className="flex justify-between items-end mb-1.5 px-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-slate-300 w-4">0{idx + 1}</span>
                                                                <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase">{cat.name}</span>
                                                            </div>
                                                            <span className="text-[11px] font-mono text-slate-500 font-bold">{cat.count}</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-[1px]">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000 group-hover:from-indigo-600 group-hover:to-indigo-500 shadow-sm"
                                                                style={{ width: `${(cat.count / globalStats.summary.totalLeads) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}


                                </div>

                                {leads.some(l => l.isHighTicket) && (
                                    <div className="mb-8 relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-indigo-500/5 rounded-3xl blur-xl"></div>
                                        <div className="relative p-8 bg-app-card rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                                            {/* Decorative Background */}
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>

                                            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative flex-shrink-0">
                                                        <div className="absolute inset-0 bg-amber-400 blur-md opacity-20 rounded-full"></div>
                                                        <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30 relative z-10 flex items-center justify-center">
                                                            <Star className="w-6 h-6 text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-white tracking-tight">Oportunidades High-Ticket</h3>
                                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Prioridad Diaria de Ejecución</p>
                                                    </div>
                                                </div>
                                                <div className="bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 shrink-0">
                                                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                                        {leads.filter(l => l.isHighTicket).length} Detectadas
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {leads.filter(l => l.isHighTicket).slice(0, 4).map(l => (
                                                    <div key={l.placeId} onClick={() => setSelectedLead(l)} className="group relative bg-[#1A1D24] p-5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all duration-300 cursor-pointer hover:shadow-[0_0_30px_rgba(251,191,36,0.05)] overflow-hidden flex flex-col h-full">
                                                        {/* Hover Gradient Line */}
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                        {/* Header: Name and Status */}
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="pr-4 flex-1">
                                                                <h4 className="font-bold text-white text-lg leading-tight mb-2 group-hover:text-amber-400 transition-colors">{l.name}</h4>
                                                                <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                                    <span className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-md border border-white/5">
                                                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                                        {l.rating || 'N/A'} ({l.userRatingsTotal || 0})
                                                                    </span>
                                                                    <span className="flex items-center gap-1 text-slate-500 truncate max-w-[150px]">
                                                                        <MapPin className="w-3 h-3" />
                                                                        {l.formattedAddress || 'Ubicación desconocida'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className={`shrink-0 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm ${l.status === 'Contactado' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                                                                l.status === 'Reunión Agendada' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                                                    l.status === 'Deal Cerrado' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                                                        l.status === 'Rechazado' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                                                            'bg-slate-800 text-slate-400 border border-slate-700'
                                                                }`}>
                                                                {l.status || 'Pendiente'}
                                                            </div>
                                                        </div>

                                                        {/* AI Insight Box */}
                                                        <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-900/10 p-4 rounded-xl border border-indigo-500/20 mb-5 relative flex-1">
                                                            <Sparkles className="absolute top-4 right-4 w-4 h-4 text-indigo-500/40" />
                                                            <div className="pr-6">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1 block">IA Sales Angle</span>
                                                                <p className="text-xs text-indigo-100/90 leading-relaxed italic group-hover:text-white transition-colors">
                                                                    "{l.sales_angle}"
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Footer Actions */}
                                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                                            <div className="flex items-center gap-3">
                                                                {l.phoneNumber ? (
                                                                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                                                                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                                                                        {l.phoneNumber}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-500 font-medium italic">Sin teléfono</span>
                                                                )}
                                                                {l.website && (
                                                                    <a href={l.website} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-slate-400 hover:text-indigo-400 transition-colors p-1.5 bg-white/5 rounded-lg border border-white/5 hover:border-indigo-500/30" title="Visitar Sitio Web">
                                                                        <Globe className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedLead(l);
                                                                }}
                                                                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-black bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition-colors shadow-[0_0_15px_rgba(251,191,36,0.3)] shrink-0">
                                                                Ficha <ChevronRight className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <h2 id="search-results-title" className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                    <span className="bg-indigo-500/10 p-2 rounded-lg">
                                        <Database className="w-5 h-5 text-indigo-400" />
                                    </span>
                                    Resultados de la Búsqueda
                                    {leads.length > 0 && <span className="text-sm font-medium text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">({leads.length} leads)</span>}
                                </h2>
                                {leads.length > 0 ? (
                                    <LeadsTable leads={leads} onRowClick={(lead) => setSelectedLead(lead)} onStatusChange={handleLocalStatusChange} />
                                ) : (
                                    <div className="bg-app-card rounded-2xl border border-dashed border-white/20 p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
                                        <Search className="w-10 h-10 text-slate-700 mb-4" />
                                        <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Sin Datos Activos</p>
                                        <p className="text-xs mt-2">Inicia una búsqueda global para compilar tu base de datos.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Floating AI Chat Button */}
            <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="fixed bottom-6 right-6 p-3 bg-[#0f0f11] text-white rounded-full shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all z-50 group hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-cyan-500/30 backdrop-blur-sm"
            >
                {isChatOpen ? <CloseIcon className="w-8 h-8 m-1" /> : (
                    <img src="/bot.png" alt="Mario" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] group-hover:drop-shadow-[0_0_15px_rgba(6,182,212,0.8)] transition-all" />
                )}
                {!isChatOpen && (
                    <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-2xl translate-x-4 group-hover:translate-x-0 border border-white/10 tracking-widest uppercase">
                        Preguntar a Mario
                    </span>
                )}
            </button>

            {/* AI Chat Window Container */}
            {
                isChatOpen && (
                    <div className="fixed bottom-24 right-6 z-50">
                        <AIChat onClose={() => setIsChatOpen(false)} />
                    </div>
                )
            }
            {/* Lead Details Drawer */}
            {
                selectedLead && (
                    <LeadDetailsPanel
                        key={selectedLead._id}
                        lead={selectedLead}
                        onClose={() => setSelectedLead(null)}
                        onLeadUpdate={(updatedLead) => {
                            setLeads(prev => prev.map(l => l._id === updatedLead._id ? updatedLead : l));
                            setSelectedLead(updatedLead);
                        }}
                    />
                )
            }
        </div >
    );
};

export default Dashboard;
