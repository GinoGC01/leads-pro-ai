import React, { useState, useEffect, useMemo } from 'react';
import SearchForm from './components/SearchForm';
import Metrics from './components/Metrics';
import LeadsTable from './components/LeadsTable';
import { searchLeads, getHistory, getHistoryItem, getLeadsBySearch, getGlobalStats, exportUrl, deleteHistory } from './services/api';
import { Download, History, Database, Star, Phone, Search, Trash2, DollarSign, BarChart3, MapPin, ExternalLink } from 'lucide-react';

const Dashboard = () => {
    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState(null);
    const [globalStats, setGlobalStats] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSearchId, setCurrentSearchId] = useState(null);
    const [totalCost, setTotalCost] = useState(0);

    useEffect(() => {
        fetchHistory();
        fetchGlobalStats();
    }, []);

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

    const [logs, setLogs] = useState([]);
    const logEndRef = React.useRef(null);

    const scrollToBottom = () => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    // Polling for progress logs & cost
    useEffect(() => {
        let interval;
        if (isLoading && currentSearchId) {
            interval = setInterval(async () => {
                try {
                    const { data: historyItem } = await getHistoryItem(currentSearchId);
                    if (historyItem.logs) setLogs(historyItem.logs);
                    if (historyItem.totalCost) setTotalCost(historyItem.totalCost);

                    if (historyItem.status === 'completed') {
                        clearInterval(interval);

                        // Fetch final leads and update UI
                        const { data: leadsData } = await getLeadsBySearch(currentSearchId);
                        setLeads(leadsData);
                        setStats({
                            total: historyItem.resultsCount,
                            withWeb: historyItem.leadsWithWeb,
                            withEmail: historyItem.leadsWithEmail,
                            avgRating: historyItem.averageRating,
                            totalCost: historyItem.totalCost
                        });

                        setIsLoading(false);
                        fetchHistory();
                        fetchGlobalStats();

                        // Scroll to results
                        setTimeout(() => {
                            document.getElementById('search-results-title')?.scrollIntoView({ behavior: 'smooth' });
                        }, 500);

                    } else if (historyItem.status === 'failed') {
                        clearInterval(interval);
                        setIsLoading(false);
                        fetchHistory();
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isLoading, currentSearchId]);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date(); // Use Date object for consistent formatting
        setLogs(prev => [...prev, { timestamp, message, type }].slice(-50));
    };

    // Filtered history using useMemo for performance
    const filteredHistory = useMemo(() => {
        if (!searchTerm.trim()) return history;

        const query = searchTerm.toLowerCase();
        return history.filter(item => {
            const keywordMatch = item.keyword?.toLowerCase().includes(query);
            const locationMatch = item.location?.toLowerCase().includes(query);
            const costMatch = (item.totalCost || 0).toString().includes(query);
            const dateMatch = new Date(item.createdAt).toLocaleDateString().includes(query);

            return keywordMatch || locationMatch || costMatch || dateMatch;
        });
    }, [history, searchTerm]);

    const handleSearch = async (formData) => {
        setIsLoading(true);
        setLogs([{ message: '🚀 Iniciando motor de búsqueda Leads Pro AI...', type: 'info', timestamp: new Date() }]);
        setTotalCost(0);
        setLeads([]);
        setStats(null);
        setCurrentSearchId(null);

        try {
            const { data } = await searchLeads(formData);
            if (data.success) {
                setCurrentSearchId(data.searchId);
                // The polling useEffect will now take over and show progress in real-time
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            alert('Error al realizar la búsqueda: ' + msg);
            setIsLoading(false);
        }
    };

    const fetchSearchDetails = async (searchId) => {
        setIsLoading(true);
        setCurrentSearchId(searchId);
        try {
            const [historyRes, leadsRes] = await Promise.all([
                getHistoryItem(searchId),
                getLeadsBySearch(searchId)
            ]);

            const historyItem = historyRes.data;
            setStats({
                total: historyItem.resultsCount,
                withWeb: historyItem.leadsWithWeb,
                withEmail: historyItem.leadsWithEmail,
                avgRating: historyItem.averageRating,
                totalCost: historyItem.totalCost
            });
            setTotalCost(historyItem.totalCost || 0);
            setLogs(historyItem.logs || []);
            setLeads(leadsRes.data);

            // Scroll to table
            document.getElementById('search-results-title')?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error fetching search details:', error);
            alert('Error al cargar los detalles de la búsqueda');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteHistory = async (e, searchId) => {
        e.stopPropagation();
        if (!window.confirm('¿Estás seguro de eliminar esta búsqueda y todos sus leads?')) return;

        try {
            await deleteHistory(searchId);
            fetchHistory();
            fetchGlobalStats();
            if (currentSearchId === searchId) {
                setLeads([]);
                setStats(null);
                setCurrentSearchId(null);
                setTotalCost(0);
                setLogs([]);
            }
        } catch (error) {
            alert('Error al eliminar el historial: ' + error.message);
        }
    };

    const handleExport = (format) => {
        if (!currentSearchId) return;
        window.open(exportUrl(currentSearchId, format), '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 mb-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg text-white">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Leads Pro AI <span className="text-indigo-600 text-xs uppercase ml-1 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">v2.0</span></h1>
                            <p className="text-xs text-slate-500">Google Places Intelligence</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
                        >
                            <Search className="w-4 h-4" />
                            Nueva Búsqueda
                        </button>
                        <button
                            onClick={() => handleExport('csv')}
                            disabled={!currentSearchId}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            CSV
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            disabled={!currentSearchId}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            Excel
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[90%] mx-auto px-6">
                {/* Search Section */}
                <section id="search-section" className="mb-8">
                    <SearchForm onSearch={handleSearch} isLoading={isLoading} />
                </section>

                {/* Dashboard Content */}
                {stats && <Metrics stats={stats} />}

                {/* Progress Logs Console */}
                {(isLoading || logs.length > 0) && (
                    <div className="max-w-5xl mx-auto mb-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
                        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-inner opacity-60"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-inner opacity-60"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-inner opacity-60"></div>
                                </div>
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Consola de Avance</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-bold text-amber-500">
                                    <DollarSign className="w-3 h-3" />
                                    <span>COSTO ESTIMADO: ${totalCost.toFixed(3)}</span>
                                </div>
                                {isLoading && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-emerald-500 text-[10px] font-bold">PROCESANDO...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 max-h-80 overflow-y-auto flex flex-col gap-1 scrollbar-hide bg-slate-900/50">
                            {logs.map((log, i) => (
                                <div key={i} className={`flex gap-3 items-start ${log.type === 'error' ? 'text-red-400' :
                                    log.type === 'success' ? 'text-emerald-400' :
                                        'text-slate-300'
                                    }`}>
                                    <span className="text-slate-600 shrink-0 font-light">
                                        [{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                    </span>
                                    <span className="break-all leading-relaxed">{log.message}</span>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 text-indigo-400 animate-pulse mt-1">
                                    <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                    <span className="font-bold">_</span>
                                </div>
                            )}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Results */}
                    <div className="lg:col-span-3">
                        {leads.some(l => l.isHighTicket) && (
                            <div className="mb-8 p-6 bg-indigo-900 rounded-2xl text-white shadow-xl shadow-indigo-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                    <h3 className="text-lg font-bold">Oportunidades High-Ticket (Prioridad Diaria)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {leads.filter(l => l.isHighTicket).slice(0, 4).map(l => (
                                        <div key={l.placeId} className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
                                            <div className="font-bold mb-1">{l.name}</div>
                                            <div className="text-xs text-indigo-200 mb-3 italic">"{l.sales_angle}"</div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {l.phoneNumber || 'Sin tel.'}
                                                </div>
                                                <a href={l.googleMapsUrl} target="_blank" rel="noreferrer" className="text-[10px] bg-white text-indigo-900 px-2 py-1 rounded font-bold uppercase hover:bg-indigo-50 transition-colors">
                                                    Contactar Ahora
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <h2 id="search-results-title" className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            Resultados de la Búsqueda
                            {leads.length > 0 && <span className="text-sm font-normal text-slate-500">({leads.length} encontrados)</span>}
                        </h2>
                        {leads.length > 0 ? (
                            <LeadsTable leads={leads} />
                        ) : (
                            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
                                Inicia una búsqueda para ver los resultados aquí.
                            </div>
                        )}
                    </div>

                    {/* Sidebar / History */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Global System Stats */}
                        {globalStats && (
                            <section className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-2xl p-6 text-white shadow-2xl border border-white/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-indigo-500/20 transition-all duration-700"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-300 flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4" />
                                            Data Intelligence
                                        </h3>
                                        <div className="flex gap-1.5 capitalize text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                                            Live Cloud
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        {/* Cost Section */}
                                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-sm">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <div className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest mb-1">Inversión Estimada</div>
                                                    <div className="text-3xl font-black tracking-tighter flex items-center gap-2">
                                                        <span className="text-white/40 text-xl font-light">≈</span>
                                                        ${globalStats.totalInvested.toFixed(2)}
                                                        <span className="text-xs font-medium text-indigo-400/80 ml-1">USD</span>
                                                    </div>
                                                </div>
                                                <a
                                                    href="https://console.cloud.google.com/billing"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 text-[10px] font-bold rounded-lg transition-all border border-indigo-500/30 mb-1"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Billing Real
                                                </a>
                                            </div>
                                        </div>

                                        {/* Main Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                <div className="text-[9px] font-black text-indigo-300/50 uppercase tracking-widest mb-1">Base Leads</div>
                                                <div className="text-lg font-black text-white">{globalStats.totalLeadsDatabase.toLocaleString()}</div>
                                            </div>
                                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                <div className="text-[9px] font-black text-indigo-300/50 uppercase tracking-widest mb-1">Avg Score</div>
                                                <div className="text-lg font-black text-indigo-400">{(globalStats.avgScore || 0).toFixed(1)}</div>
                                            </div>
                                        </div>

                                        {/* Coverage Stats */}
                                        <div className="space-y-3 px-1">
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-300/70">
                                                    <span>Cobertura Email</span>
                                                    <span>{(globalStats.emailCoverage || 0).toFixed(0)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${globalStats.emailCoverage || 0}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-300/70">
                                                    <span>Cobertura Web</span>
                                                    <span>{(globalStats.webCoverage || 0).toFixed(0)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${globalStats.webCoverage || 0}%` }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Extra Details */}
                                        <div className="flex flex-col gap-2 pt-2 text-[10px] font-bold text-indigo-300/60 uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3 h-3" />
                                                <span>{globalStats.uniqueLocations} sectores explorados</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Star className="w-3 h-3" />
                                                <span>{globalStats.totalHighTicket} High Ticket Detectados</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        <div>
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <History className="w-5 h-5" />
                                Historial
                            </h2>

                            {/* Search bar for history */}
                            <div className="relative mb-4 group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar por palabra, lugar, fecha o coste..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white/50 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-slate-300"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                    >
                                        <span className="text-lg">×</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                {filteredHistory.map((item) => (
                                    <div key={item._id}
                                        onClick={() => fetchSearchDetails(item._id)}
                                        className={`group p-3 rounded-xl border cursor-pointer transition-all shadow-sm hover:shadow-md relative ${currentSearchId === item._id ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-slate-200 hover:border-indigo-400'
                                            }`}>
                                        <button
                                            onClick={(e) => handleDeleteHistory(e, item._id)}
                                            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900 truncate pr-6">{item.keyword}</div>
                                            <div className="text-xs text-slate-500 mt-1">{item.location}</div>
                                            <div className="flex items-center justify-between mt-3 text-[10px] font-bold">
                                                <span className="text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-amber-600 font-mono">${(item.totalCost || 0).toFixed(3)}</span>
                                                    <span className="bg-indigo-100 px-2 py-0.5 rounded text-indigo-600">{item.resultsCount} leads</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {history.length === 0 && (
                                    <div className="text-xs text-slate-400 italic">No hay búsquedas recientes.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
