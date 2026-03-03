import React from 'react';

/**
 * OppScoreGraphic — Tricolor progress bar for opportunity score distribution.
 * Pure visual — receives no dynamic data (segments are decorative).
 */
const OppScoreGraphic = () => (
    <div className="flex flex-col gap-2 mt-4 w-full">
        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden flex">
            <div className="bg-accent-red h-full" style={{ width: '30%' }}></div>
            <div className="bg-pastel-orange h-full" style={{ width: '40%' }}></div>
            <div className="bg-pastel-green h-full" style={{ width: '30%' }}></div>
        </div>
        <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
            <span>Critical</span>
            <span>High</span>
            <span>Med/Low</span>
        </div>
    </div>
);

export default OppScoreGraphic;
