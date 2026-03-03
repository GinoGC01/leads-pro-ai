import React, { useRef, useEffect } from 'react';

/**
 * LiveConsole — Pure presentational component that auto-scrolls.
 * Used exclusively when a scraping process is ACTIVE.
 */
const LiveConsole = ({ logs, isLoading, totalCost }) => {
    // Encapsulated DOM Reference (Auto-Scroll) per CTO directive
    const logEndRef = useRef(null);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    if (!isLoading && logs.length === 0) return null;

    return (
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
                {isLoading && (
                    <div className="flex gap-3 text-indigo-400 animate-pulse mt-1">
                        <span className="text-slate-600 shrink-0 text-[9px]">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="font-bold">_</span>
                    </div>
                )}
                {/* Auto-scroll target */}
                <div ref={logEndRef} />
            </div>

            <div className="bg-slate-800/50 px-4 py-2 border-t border-white/5 shrink-0 flex justify-between items-center text-[9px] font-bold text-slate-500">
                <span>SYSTEM STATUS: {isLoading ? 'PROCESSING' : 'IDLE'}</span>
                <span className="text-amber-500 uppercase">Est. Cost: ${totalCost.toFixed(3)}</span>
            </div>
        </div>
    );
};

export default LiveConsole;
