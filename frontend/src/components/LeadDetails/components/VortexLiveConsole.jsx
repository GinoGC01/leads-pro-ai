import React, { useState, useEffect, useRef } from 'react';

/**
 * VortexLiveConsole — Mac-style SSE console for VORTEX telemetry.
 */
const VortexLiveConsole = ({ jobId, isVision = false, onComplete }) => {
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const logEndRef = useRef(null);

    useEffect(() => {
        if (!jobId) return;

        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const eventSource = new EventSource(`${baseUrl}/vortex/stream/${jobId}`);

        eventSource.addEventListener('connected', (e) => {
            const data = JSON.parse(e.data);
            setLogs(prev => [...prev, { message: data.message, timestamp: Date.now(), type: 'success' }]);
        });

        eventSource.addEventListener('log', (event) => {
            const data = JSON.parse(event.data);
            // CORRECTO: Acumular usando functional update directo
            setLogs(prevLogs => [...prevLogs, data]);
        });

        eventSource.addEventListener('progress', (e) => {
            const data = JSON.parse(e.data);
            setProgress(data.progress || 0);
        });

        eventSource.addEventListener('completed', () => {
            setIsFinished(true);
            setProgress(100);
            eventSource.close();
            if (onComplete) onComplete();
        });

        eventSource.addEventListener('failed', () => {
            setIsFinished(true);
            eventSource.close();
            if (onComplete) onComplete();
        });

        eventSource.addEventListener('error_log', (e) => {
            const data = JSON.parse(e.data);
            setLogs(prev => [...prev, { message: data.message, timestamp: data.timestamp, type: 'error' }]);
        });

        return () => {
            eventSource.close();
        };
    }, [jobId]);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    const isLoading = !isFinished;

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-[10px] flex flex-col h-[280px] w-full mt-6 relative z-10">
            {/* ProgressBar Overlay at the top edge */}
            <div className="h-1 w-full bg-slate-800 absolute top-0 left-0 z-20">
                <div 
                    className={`h-full transition-all duration-300 ${isVision ? 'bg-fuchsia-500' : 'bg-accent-blue shadow-[0_0_10px_rgba(56,189,248,0.5)]'}`} 
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between shrink-0 pt-4">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 mt-0.5"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 mt-0.5"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 mt-0.5"></div>
                    </div>
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] ml-2">
                        {isVision ? 'VORTEX DEEP VISION CONSOLE' : 'VORTEX LIVE TELEMETRY'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isVision ? 'bg-fuchsia-400' : 'bg-emerald-500'}`}></div>
                            <span className={`${isVision ? 'text-fuchsia-400' : 'text-emerald-500'} text-[9px] font-bold`}>{progress}% LIVE</span>
                        </div>
                    ) : (
                        <span className="text-slate-500 text-[9px] font-bold">TERMINATED</span>
                    )}
                </div>
            </div>
            
            <div className="p-4 overflow-y-auto flex flex-col gap-1.5 minimal-scrollbar bg-[#0B0C10] flex-1">
                {logs.map((log, i) => (
                    <div key={i} className={`flex gap-3 items-start ${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-emerald-400' :
                        'text-slate-300'
                    }`}>
                        <span className="text-slate-600 shrink-0 font-light text-[9px]">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="break-all leading-tight">
                            <span className={`${log.type === 'info' ? 'text-accent-blue mr-1' : ''}`}>{'>'}</span> {log.message}
                        </span>
                    </div>
                ))}
                {isLoading && (
                    <div className={`flex gap-3 animate-pulse mt-1 ${isVision ? 'text-fuchsia-400' : 'text-accent-blue'}`}>
                        <span className="text-slate-600 shrink-0 text-[9px]">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="font-bold">_</span>
                    </div>
                )}
                {/* Auto-scroll target */}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};

export default VortexLiveConsole;
