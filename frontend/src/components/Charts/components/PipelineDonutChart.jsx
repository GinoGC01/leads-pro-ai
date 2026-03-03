import React from 'react';

/**
 * PipelineDonutChart — Pure SVG renderer.
 * Receives pre-computed donutSegments with strokeDasharray, transform, etc.
 * and totalPipeline for the center label.
 * ZERO trigonometry — just iterates and injects SVG attributes.
 */
const PipelineDonutChart = ({ segments, totalPipeline }) => {
    return (
        <div className="relative w-48 h-48 drop-shadow-2xl">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#252528" strokeWidth="16" />

                {totalPipeline > 0 && segments.map((seg, i) => (
                    <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="16"
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        transform={seg.transform}
                        className="drop-shadow-lg transition-all duration-1000 ease-out"
                        style={{ transitionDelay: seg.delay }}
                    />
                ))}
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-white">{totalPipeline}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
            </div>
        </div>
    );
};

export default PipelineDonutChart;
