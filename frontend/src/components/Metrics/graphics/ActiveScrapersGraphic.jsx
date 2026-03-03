import React from 'react';

/**
 * ActiveScrapersGraphic — System health indicator bar.
 * Pure visual with pulsing dot + progress bar.
 */
const ActiveScrapersGraphic = () => (
    <div className="flex flex-col gap-2 mt-4 w-full">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-blue"></span>
                </span>
                System Healthy
            </span>
            <span>Load 24%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div className="bg-accent-blue h-1.5 rounded-full" style={{ width: '24%' }}></div>
        </div>
    </div>
);

export default ActiveScrapersGraphic;
