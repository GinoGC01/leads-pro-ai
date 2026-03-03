import React from 'react';
import { History, Search, Database } from 'lucide-react';
import HistoryListItem from './HistoryListItem';

/**
 * HistoryList — Pure presentational component for the sidebar list.
 * Expects `filteredHistory`, `searchTerm`, and stable handler functions.
 */
const HistoryList = ({ 
    filteredHistory, 
    searchTerm, 
    onFilter, 
    onHistoryClick, 
    onDeleteClick, 
    onOpenDashboard 
}) => {
    return (
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
                        onChange={onFilter}
                    />
                </div>
            </div>

            <ul className="p-4 flex-1 overflow-y-auto minimal-scrollbar flex flex-col gap-4">
                {filteredHistory.map((item) => (
                    <HistoryListItem
                        key={item._id}
                        item={item}
                        onClick={onHistoryClick}
                        onDelete={onDeleteClick}
                        onProsper={onOpenDashboard}
                    />
                ))}
                
                {filteredHistory.length === 0 && (
                    <div className="text-xs text-slate-500 italic text-center py-12 flex flex-col items-center">
                        <Database className="w-8 h-8 opacity-20 mb-3" />
                        No hay campañas estructuradas.
                    </div>
                )}
            </ul>
        </div>
    );
};

export default HistoryList;
