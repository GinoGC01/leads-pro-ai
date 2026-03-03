import React from 'react';
import { Trash2, MapPin } from 'lucide-react';

/**
 * HistoryListItem — Single campaign row in the history sidebar.
 * Performance Shield: Wrapped in React.memo to prevent re-rendering when other items are interacting.
 * Expects stable function props (useCallback in the parent).
 */
const HistoryListItem = React.memo(({ item, onClick, onDelete, onProsper }) => {
    return (
        <li
            onClick={() => onClick(item._id)}
            className="group p-5 rounded-2xl border bg-app-bg border-white/5 hover:border-indigo-500/50 hover:bg-white/5 transition-all duration-300 relative flex flex-col cursor-pointer"
        >
            {/* Delete button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item._id);
                }}
                className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-500/10 z-10 bg-app-bg shadow-sm"
                title="Eliminar Campaña"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <div className="flex-1 flex flex-col justify-between">
                <div className="pr-8 mb-4">
                    <div className="text-sm font-bold text-white truncate mb-1 leading-tight" title={item.keyword}>
                        {item.keyword}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono tracking-wide flex items-center gap-1.5 mb-2 truncate">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{item.location}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        {item.campaignStatus && (
                            <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-wider ${
                                item.campaignStatus === 'completada' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                item.campaignStatus === 'en_seguimiento' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                item.campaignStatus === 'en_proceso' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                item.campaignStatus === 'archivada' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                                'bg-white/5 text-slate-400 border border-white/10'
                            }`}>
                                {item.campaignStatus.replace('_', ' ')}
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
                            <span className="text-xs text-slate-300">
                                {new Date(item.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                            </span>
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
                            onClick={(e) => {
                                e.stopPropagation();
                                onProsper(item._id);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap"
                        >
                            Prospectar
                        </button>
                    </div>
                </div>
            </div>
        </li>
    );
});

export default HistoryListItem;
