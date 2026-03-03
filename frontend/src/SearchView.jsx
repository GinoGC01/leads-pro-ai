import SearchForm from './components/SearchForm/SearchForm';
import { History, Search, Trash2, MapPin, Database, X as CloseIcon } from 'lucide-react';
import useSearchView from './hooks/useSearchView';

const SearchView = () => {
    const {
        history,
        searchTerm,
        isLoading,
        logs,
        activeHistoryLogs,
        activeHistoryStats,
        totalCost,
        isDeleteModalOpen,
        logEndRef,
        filteredHistory,
        handleSearch,
        handleDeleteHistory,
        confirmDeleteCampaign,
        handleHistoryClick,
        openInDashboard,
        handlerFilter } = useSearchView();
    return (
        <div className="min-h-screen bg-app-bg text-slate-200 p-10">
            <header className="mb-12">
                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                    <Database className="w-8 h-8 text-indigo-500" />
                    Acquisition Hub
                </h1>
                <p className="text-slate-400 mt-2">Lanza agentes de recolección geolocalizada y coordina campañas pasadas.</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Search Engine Area */}
                <div className="xl:col-span-2 space-y-8">
                    <section>
                        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
                    </section>

                    {/* Progress Logs Console */}
                    {(isLoading || logs.length > 0) && (
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-[10px] flex flex-col h-[320px]">
                            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-500 opacity-60"></div>
                                        <div className="w-2 h-2 rounded-full bg-amber-500 opacity-60"></div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-60"></div>
                                    </div>
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Live Console</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {isLoading && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                            <span className="text-emerald-500 text-[9px] font-bold">LIVE</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 overflow-y-auto flex flex-col gap-1.5 minimal-scrollbar bg-slate-900/50 flex-1">
                                {logs.map((log, i) => (
                                    <div key={i} className={`flex gap-3 items-start ${log.type === 'error' ? 'text-red-400' :
                                        log.type === 'success' ? 'text-emerald-400' :
                                            'text-slate-300'
                                        }`}>
                                        <span className="text-slate-600 shrink-0 font-light text-[9px]">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                        <span className="break-all leading-tight">{log.message}</span>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-3 text-indigo-400 animate-pulse mt-1">
                                        <span className="text-slate-600 shrink-0 text-[9px]">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        <span className="font-bold">_</span>
                                    </div>
                                )}
                                <div ref={logEndRef} />
                            </div>
                            <div className="bg-slate-800/50 px-4 py-2 border-t border-white/5 shrink-0 flex justify-between items-center text-[9px] font-bold text-slate-500">
                                <span>SYSTEM STATUS: {isLoading ? 'PROCESSING' : 'IDLE'}</span>
                                <span className="text-amber-500 uppercase">Est. Cost: ${totalCost.toFixed(3)}</span>
                            </div>
                        </div>
                    )}

                    {/* Historical Logs Console */}
                    {activeHistoryLogs && !isLoading && (
                        <div className="bg-slate-900 rounded-2xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)] overflow-hidden font-mono text-[10px] flex flex-col h-[320px] mt-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-slate-800 px-4 py-3 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-500 opacity-60"></div>
                                        <div className="w-2 h-2 rounded-full bg-amber-500 opacity-60"></div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-60"></div>
                                    </div>
                                    <span className="text-indigo-400 font-bold uppercase tracking-widest text-[9px]">Historical Dump: {activeHistoryStats?.keyword}</span>
                                </div>
                                <button
                                    onClick={() => setActiveHistoryLogs(null)}
                                    className="text-slate-500 hover:text-white transition-colors"
                                >
                                    <CloseIcon className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="p-4 flex flex-col gap-1.5 minimal-scrollbar bg-slate-900/50 flex-1">
                                {activeHistoryLogs.map((log, i) => (
                                    <div key={i} className={`flex gap-3 items-start ${log.type === 'error' ? 'text-red-400' :
                                        log.type === 'success' ? 'text-emerald-400' :
                                            'text-slate-300'
                                        }`}>
                                        <span className="text-slate-600 shrink-0 font-light text-[9px]">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                        <span className="break-all leading-tight">{log.message}</span>
                                    </div>
                                ))}
                                {activeHistoryLogs.length === 0 && (
                                    <div className="text-slate-500 italic text-center mt-10">
                                        Esta campaña no conservó logs de ejecución en su bitácora.
                                    </div>
                                )}
                            </div>
                            <div className="bg-slate-800/50 px-4 py-2 border-t border-indigo-500/20 shrink-0 flex justify-between items-center text-[9px] font-bold text-slate-500">
                                <span>LEADS FILTRADOS: <span className="text-indigo-400">{activeHistoryStats?.results}</span></span>
                                <span className="text-amber-500 uppercase">Final Cost: ${activeHistoryStats?.cost.toFixed(3)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search History Area */}
                <div className="xl:col-span-1">
                    <div className="bg-app-card border border-white/5 rounded-2xl shadow-2xl flex flex-col h-[800px]">
                        <div className="p-6 border-b border-white/5 shrink-0">
                            <h2 className="text-sm font-black text-white mb-4 flex items-center gap-3 uppercase tracking-widest">
                                <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                                    <History className="w-4 h-4 text-slate-300" />
                                </div>
                                Historial de Campañas
                            </h2>
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Filtrar por nombre, lugar..."
                                    className="bg-app-bg text-white text-xs rounded-xl py-2 pl-9 pr-4 w-full focus:outline-none border border-white/5 focus:border-indigo-500 transition-colors"
                                    value={searchTerm}
                                    onChange={(e) => handlerFilter(e)}
                                />
                            </div>
                        </div>

                        <ul className="p-4 flex-1 overflow-y-auto minimal-scrollbar flex flex-col gap-4">
                            {filteredHistory.map((item) => (
                                console.log(item),
                                <li key={item._id}
                                    onClick={() => handleHistoryClick(item._id)}
                                    className="group p-5 rounded-2xl border bg-app-bg border-white/5 hover:border-indigo-500/50 hover:bg-white/5 transition-all duration-300 relative flex flex-col cursor-pointer ">

                                    {/* delete button */}
                                    <button
                                        onClick={(e) => handleDeleteHistory(e, item._id)}
                                        className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-500/10 z-10 bg-app-bg shadow-sm"
                                        title="Eliminar Campaña"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="pr-8 mb-4">
                                            <div className="text-sm font-bold text-white truncate mb-1 leading-tight" title={item.keyword}>{item.keyword}</div>
                                            <div className="text-[10px] text-slate-400 font-mono tracking-wide flex items-center gap-1.5 mb-2 truncate">
                                                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                                <span className="truncate">{item.location}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {item.campaignStatus && (
                                                    <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-wider ${item.campaignStatus === 'completada' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                        item.campaignStatus === 'en_seguimiento' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                            item.campaignStatus === 'en_proceso' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                                item.campaignStatus === 'archivada' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                                                                    'bg-white/5 text-slate-400 border border-white/10'
                                                        }`}>
                                                        {item.campaignStatus?.replace('_', ' ')}
                                                    </span>
                                                )}
                                                {item.searchMode === 'grid' && (
                                                    <span className="px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                        Grid {item.gridSize}×{item.gridSize}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between py-3 border-t border-b border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Fecha</span>
                                                    <span className="text-xs text-slate-300">{new Date(item.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] uppercase font-bold text-emerald-400 rounded">
                                                        ${(item.totalCost || 0).toFixed(3)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="bg-white/5 px-2 py-1 rounded-lg flex items-center">
                                                    <span className="text-xs font-black text-indigo-400">{item.resultsCount}</span>
                                                    <span className="text-[9px] font-bold text-slate-500 ml-1 uppercase">Leads</span>
                                                </div>
                                                <button
                                                    onClick={(e) => openInDashboard(e, item._id)}
                                                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap"
                                                >
                                                    Prospectar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {history.length === 0 && (
                                <div className="text-xs text-slate-500 italic text-center py-12 flex flex-col items-center">
                                    <Database className="w-8 h-8 opacity-20 mb-3" />
                                    No hay campañas estructuradas.
                                </div>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Modal de Confirmación de Borrado */}
                {
                    isDeleteModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm border border-slate-700 shadow-xl shadow-red-900/20">
                                <div className="flex flex-col items-center mb-6">
                                    <div className="bg-red-500/10 p-4 rounded-full mb-4">
                                        <Trash2 className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 text-center">
                                        ¿Purgar Campaña?
                                    </h3>
                                    <p className="text-sm text-slate-400 text-center font-medium px-4">
                                        Esta acción es irreversible. Todos los prospectos y datos de la campaña serán destruidos.
                                    </p>
                                </div>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => {
                                            setIsDeleteModalOpen(false);
                                            setCampaignToDelete(null);
                                        }}
                                        className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-sm transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDeleteCampaign}
                                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all flex justify-center items-center"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default SearchView;
