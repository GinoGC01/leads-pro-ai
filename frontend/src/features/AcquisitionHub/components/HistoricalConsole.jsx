import React, { useRef, useEffect } from 'react';
import { X as CloseIcon } from 'lucide-react';

/**
 * HistoricalConsole — Pure presentational component that displays past logs.
 * Unlike LiveConsole, it receives `activeHistoryStats` and `activeHistoryLogs`.
 * Encapsulates its own auto-scroll (although historically logs are static).
 */
const HistoricalConsole = ({ logs, stats, onClose }) => {
    // Encapsulated DOM Reference
    const logEndRef = useRef(null);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    if (!logs || !stats) return null;

    return (
        <div className="bg-slate-900 rounded-2xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)] overflow-hidden font-mono text-[10px] flex flex-col h-[320px] mt-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-800 px-4 py-3 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 opacity-60"></div>
                        <div className="w-2 h-2 rounded-full bg-amber-500 opacity-60"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-60"></div>
                    </div>
                    <span className="text-indigo-400 font-bold uppercase tracking-widest text-[9px]">
                        Historical Dump: {stats.keyword}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-500 hover:text-white transition-colors"
                >
                    <CloseIcon className="w-3 h-3" />
                </button>
            </div>

            <div className="p-4 flex flex-col gap-1.5 minimal-scrollbar bg-slate-900/50 flex-1 overflow-y-auto">
                {logs.map((log, i) => (
                    <div key={i} className={`flex gap-3 items-start ${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-emerald-400' :
                        'text-slate-300'
                    }`}>
                        <span className="text-slate-600 shrink-0 font-light text-[9px]">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="break-all leading-tight">{log.message}</span>
                    </div>
                ))}
                
                {logs.length === 0 && (
                    <div className="text-slate-500 italic text-center mt-10">
                        Esta campaña no conservó logs de ejecución en su bitácora.
                    </div>
                )}
                {/* Target for auto-scrolling to bottom of historical dump */}
                <div ref={logEndRef} />
            </div>

            <div className="bg-slate-800/50 px-4 py-2 border-t border-indigo-500/20 shrink-0 flex justify-between items-center text-[9px] font-bold text-slate-500">
                <span>LEADS FILTRADOS: <span className="text-indigo-400">{stats.results}</span></span>
                <span className="text-amber-500 uppercase">Final Cost: ${stats.cost?.toFixed(3)}</span>
            </div>
        </div>
    );
};

export default HistoricalConsole;
