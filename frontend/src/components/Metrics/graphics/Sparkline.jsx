import React from 'react';

/**
 * Sparkline — Decorative SVG mini-graph.
 * Static trend line with green gradient fill.
 * Pure visual — zero props, zero logic.
 */
const Sparkline = () => (
    <svg className="w-24 h-8" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 25C10 25 15 15 25 15C35 15 40 20 50 10C60 0 70 20 80 15C90 10 95 5 100 5" stroke="#00e57c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M0 25C10 25 15 15 25 15C35 15 40 20 50 10C60 0 70 20 80 15C90 10 95 5 100 5L100 30L0 30Z" fill="url(#sparkline_grad)" fillOpacity="0.15" />
        <defs>
            <linearGradient id="sparkline_grad" x1="50" y1="5" x2="50" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00e57c" />
                <stop offset="1" stopColor="#00e57c" stopOpacity="0" />
            </linearGradient>
        </defs>
    </svg>
);

export default Sparkline;
