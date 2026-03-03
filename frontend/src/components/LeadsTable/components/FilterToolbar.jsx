import React from 'react';

/**
 * FilterToolbar — Dumb component for filter toggle buttons.
 * Receives active filter state, counts, and toggle handlers.
 * Zero logic / zero API calls.
 */
const FilterToolbar = ({ filters, counts, onToggle, onPerfFilter, totalShowing, totalLeads }) => {
    return (
        <div className="bg-[#1e1e20] border-b border-white/5 p-4 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Filtros:</span>
                <button
                    onClick={() => onToggle('onlyWordPress')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.onlyWordPress ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                >
                    WordPress ({counts.wordpress})
                </button>
                <button
                    onClick={() => onToggle('onlyWithEmail')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.onlyWithEmail ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                >
                    Con Email ({counts.withEmail})
                </button>
                <button
                    onClick={() => onToggle('onlyHighTicket')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.onlyHighTicket ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                >
                    High Ticket ({counts.highTicket})
                </button>
                <button
                    onClick={() => onToggle('onlyAds')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.onlyAds ? 'bg-red-600 text-white border-red-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                >
                    Anunciando ({counts.ads})
                </button>
                <button
                    onClick={() => onToggle('excludeZombies')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.excludeZombies ? 'bg-slate-800 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                >
                    Ocultar Zombies ({counts.zombies})
                </button>

                <div className="h-6 w-px bg-slate-300 mx-1"></div>

                <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => onPerfFilter('all')}
                        className={`px-3 py-1.5 text-xs font-bold transition-all ${filters.performance === 'all' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Velocidad: Todo
                    </button>
                    <button
                        onClick={() => onPerfFilter('fast')}
                        className={`px-3 py-1.5 text-xs font-bold transition-all border-l border-slate-200 ${filters.performance === 'fast' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Rápido ({counts.fast})
                    </button>
                    <button
                        onClick={() => onPerfFilter('slow')}
                        className={`px-3 py-1.5 text-xs font-bold transition-all border-l border-slate-200 ${filters.performance === 'slow' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Lento ({counts.slow})
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-widest border-t border-white/5 pt-3">
                <div>
                    Mostrando <span className="text-white">{totalShowing}</span> de <span className="text-white">{totalLeads}</span> leads encontrados
                </div>
            </div>
        </div>
    );
};

export default FilterToolbar;
