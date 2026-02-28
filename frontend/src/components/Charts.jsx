import React from 'react';

const Charts = ({ stats }) => {
    // Math to get percentages for bar chart heights
    const barData = stats?.charts?.monthlyAcquisition || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const exactDates = stats?.charts?.exactDates || Array(12).fill(null).map(() => []);
    const maxVal = Math.max(...barData, 1);
    const barHeights = barData.map(val => (val / maxVal) * 100);

    // Math for Donut Chart
    const pipelineData = stats?.charts?.pipelineStatus || { new: 0, contacted: 0, in_progress: 0, closed: 0, en_espera: 0, descartados: 0 };
    const totalPipeline = ((pipelineData.new || 0) + (pipelineData.contacted || 0) + (pipelineData.in_progress || 0) + (pipelineData.closed || 0) + (pipelineData.en_espera || 0) + (pipelineData.descartados || 0));
    const safeTotal = totalPipeline || 1; // Avoid divide by zero

    const pctClosed = ((pipelineData.closed || 0) / safeTotal) * 100;
    const pctDescartados = ((pipelineData.descartados || 0) / safeTotal) * 100;
    const pctInProgress = ((pipelineData.in_progress || 0) / safeTotal) * 100;
    const pctContacted = ((pipelineData.contacted || 0) / safeTotal) * 100;
    const pctEnEspera = ((pipelineData.en_espera || 0) / safeTotal) * 100;
    const pctNew = ((pipelineData.new || 0) / safeTotal) * 100;

    // SVG properties for Donut Chart (Radius 40 -> Circumference = 2 * PI * 40 = 251.2)
    const circumference = 251.2;

    const closedDash = `${(pctClosed / 100) * circumference} ${circumference}`;
    const descartadosDash = `${(pctDescartados / 100) * circumference} ${circumference}`;
    const inProgressDash = `${(pctInProgress / 100) * circumference} ${circumference}`;
    const contactedDash = `${(pctContacted / 100) * circumference} ${circumference}`;
    const enEsperaDash = `${(pctEnEspera / 100) * circumference} ${circumference}`;
    const newDash = `${(pctNew / 100) * circumference} ${circumference}`;

    // Calculate rotation offsets for each segment so they start where the previous one ended
    const closedRot = 0;
    const descartadosRot = closedRot + (pctClosed / 100) * 360;
    const inProgressRot = descartadosRot + (pctDescartados / 100) * 360;
    const contactedRot = inProgressRot + (pctInProgress / 100) * 360;
    const enEsperaRot = contactedRot + (pctContacted / 100) * 360;
    const newRot = enEsperaRot + (pctEnEspera / 100) * 360;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-8">
            {/* Acquisition Velocity Chart */}
            <div className="bg-app-card rounded-3xl p-8 min-h-[340px] flex flex-col border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 pointer-events-none p-8 pt-24 pb-12 flex flex-col justify-between opacity-10">
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                </div>

                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <h3 className="text-white font-black text-xl flex items-center gap-2 tracking-tight">
                            Acquisition Velocity
                        </h3>
                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">Leads captured over time</p>
                    </div>
                    <div className="bg-white/5 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/10">
                        This Year
                    </div>
                </div>

                {/* Animated Bars */}
                <div className="flex-1 flex items-end justify-between gap-3 relative z-10 mt-auto h-[180px]">
                    {barHeights.map((height, i) => (
                        <div key={i} className="w-full flex flex-col justify-end h-full group/bar cursor-pointer relative">
                            {/* Hover Tooltip */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 text-white text-[10px] font-bold px-3 py-2 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-20 shadow-2xl flex flex-col items-center gap-1 whitespace-nowrap">
                                <span className="text-accent-blue text-xs">{barData[i]} Leads</span>
                                {exactDates[i]?.length > 0 && (
                                    <span className="text-[9px] text-slate-400 font-mono font-medium">
                                        {exactDates[i][0]} {exactDates[i].length > 1 ? `y +${exactDates[i].length - 1}` : ''}
                                    </span>
                                )}
                            </div>
                            <div className="w-full bg-white/5 rounded-t-lg relative overflow-hidden transition-all duration-300 group-hover/bar:bg-white/10" style={{ height: '100%' }}>
                                <div
                                    className="absolute bottom-0 w-full rounded-t-md transition-all duration-700 ease-out bg-accent-blue group-hover/bar:bg-blue-400 group-hover/bar:shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                                    style={{ height: `${height}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* X Axis Labels */}
                <div className="flex justify-between mt-3 text-[9px] font-bold text-slate-500 uppercase px-1">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                    <span>Nov</span>
                    <span>Dec</span>
                </div>
            </div>

            {/* Leads by CRM Status / Donut Chart */}
            <div className="bg-app-card rounded-3xl p-8 min-h-[340px] flex flex-col border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-white font-black text-xl tracking-tight">Leads by Status</h3>
                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">CRM Pipeline Distribution</p>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-between relative px-4 mt-4">
                    {/* SVG Donut Chart */}
                    <div className="relative w-48 h-48 drop-shadow-2xl">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            {/* Background Circle */}
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#252528" strokeWidth="16" />

                            {totalPipeline > 0 && (
                                <>
                                    {/* Segment 1: Closed (Green) */}
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#00e57c" strokeWidth="16" strokeDasharray={closedDash} strokeDashoffset="0" transform={`rotate(${closedRot} 50 50)`} className="drop-shadow-lg transition-all duration-1000 ease-out" />
                                    {/* Segment 2: Descartados (Zinc) */}
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#52525b" strokeWidth="16" strokeDasharray={descartadosDash} strokeDashoffset="0" transform={`rotate(${descartadosRot} 50 50)`} className="transition-all duration-1000 ease-out delay-75" />
                                    {/* Segment 3: In Progress (Yellow) */}
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f6d365" strokeWidth="16" strokeDasharray={inProgressDash} strokeDashoffset="0" transform={`rotate(${inProgressRot} 50 50)`} className="transition-all duration-1000 ease-out delay-100" />
                                    {/* Segment 4: Contacted (Pink) */}
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ff7eb3" strokeWidth="16" strokeDasharray={contactedDash} strokeDashoffset="0" transform={`rotate(${contactedRot} 50 50)`} className="transition-all duration-1000 ease-out delay-150" />
                                    {/* Segment 5: En Espera (Purple) */}
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#a855f7" strokeWidth="16" strokeDasharray={enEsperaDash} strokeDashoffset="0" transform={`rotate(${enEsperaRot} 50 50)`} className="transition-all duration-1000 ease-out delay-200" />
                                    {/* Segment 6: New (Blue) */}
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#5b86e5" strokeWidth="16" strokeDasharray={newDash} strokeDashoffset="0" transform={`rotate(${newRot} 50 50)`} className="transition-all duration-1000 ease-out delay-300" />
                                </>
                            )}
                        </svg>
                        {/* Center Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-white">{totalPipeline}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between gap-6 hover:bg-white/5 p-2 -mx-2 rounded-xl cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#5b86e5] shadow-[0_0_10px_rgba(91,134,229,0.5)]"></div>
                                <span className="text-xs font-bold text-slate-300">New Leads</span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] font-bold text-slate-500">({pipelineData.new || 0})</span>
                                <span className="text-sm font-black text-white min-w-[32px] text-right">{pctNew.toFixed(0)}%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-6 hover:bg-white/5 p-2 -mx-2 rounded-xl cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#ff7eb3] shadow-[0_0_10px_rgba(255,126,179,0.5)]"></div>
                                <span className="text-xs font-bold text-slate-300">Contacted</span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] font-bold text-slate-500">({pipelineData.contacted || 0})</span>
                                <span className="text-sm font-black text-white min-w-[32px] text-right">{pctContacted.toFixed(0)}%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-6 hover:bg-white/5 p-2 -mx-2 rounded-xl cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#f6d365] shadow-[0_0_10px_rgba(246,211,101,0.5)]"></div>
                                <span className="text-xs font-bold text-slate-300">In Progress</span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] font-bold text-slate-500">({pipelineData.in_progress || 0})</span>
                                <span className="text-sm font-black text-white min-w-[32px] text-right">{pctInProgress.toFixed(0)}%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-6 hover:bg-white/5 p-2 -mx-2 rounded-xl cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                                <span className="text-xs font-bold text-slate-300">En Espera</span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] font-bold text-slate-500">({pipelineData.en_espera || 0})</span>
                                <span className="text-sm font-black text-white min-w-[32px] text-right">{pctEnEspera.toFixed(0)}%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-6 hover:bg-white/5 p-2 -mx-2 rounded-xl cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-zinc-600 shadow-[0_0_10px_rgba(82,82,91,0.5)]"></div>
                                <span className="text-xs font-bold text-slate-300">Descartados</span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] font-bold text-slate-500">({pipelineData.descartados || 0})</span>
                                <span className="text-sm font-black text-white min-w-[32px] text-right">{pctDescartados.toFixed(0)}%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-6 hover:bg-white/5 p-2 -mx-2 rounded-xl cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#00e57c] shadow-[0_0_10px_rgba(0,229,124,0.5)]"></div>
                                <span className="text-xs font-bold text-slate-300">Closed</span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] font-bold text-slate-500">({pipelineData.closed || 0})</span>
                                <span className="text-sm font-black text-white min-w-[32px] text-right">{pctClosed.toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Charts;
