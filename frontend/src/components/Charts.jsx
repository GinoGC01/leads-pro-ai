import React from 'react';

const Charts = ({ stats }) => {
    // Math to get percentages for bar chart heights
    const barData = stats?.charts?.monthlyAcquisition || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const exactDates = stats?.charts?.exactDates || Array(12).fill(null).map(() => []);
    const maxVal = Math.max(...barData, 1);
    const barHeights = barData.map(val => (val / maxVal) * 100);

    // Math for Donut Chart
    const pipelineData = stats?.charts?.pipelineStatus || { new: 0, contacted: 0, in_progress: 0, closed: 0 };
    const totalPipeline = (pipelineData.new + pipelineData.contacted + pipelineData.in_progress + pipelineData.closed);
    const safeTotal = totalPipeline || 1; // Avoid divide by zero

    const pctClosed = (pipelineData.closed / safeTotal) * 100;
    const pctInProgress = (pipelineData.in_progress / safeTotal) * 100;
    const pctContacted = (pipelineData.contacted / safeTotal) * 100;
    const pctNew = (pipelineData.new / safeTotal) * 100;

    // SVG properties for Donut Chart (Radius 40 -> Circumference = 2 * PI * 40 = 251.2)
    const circumference = 251.2;

    const closedDash = `${(pctClosed / 100) * circumference} ${circumference}`;
    const inProgressDash = `${(pctInProgress / 100) * circumference} ${circumference}`;
    const contactedDash = `${(pctContacted / 100) * circumference} ${circumference}`;
    const newDash = `${(pctNew / 100) * circumference} ${circumference}`;

    const closedRot = 0;
    const inProgressRot = (pctClosed / 100) * 360;
    const contactedRot = inProgressRot + (pctInProgress / 100) * 360;
    const newRot = contactedRot + (pctContacted / 100) * 360;

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
                                    {/* Segment 2: In Progress (Yellow) */}
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f6d365" strokeWidth="16" strokeDasharray={inProgressDash} strokeDashoffset="0" transform={`rotate(${inProgressRot} 50 50)`} className="transition-all duration-1000 ease-out delay-75" />
                                    {/* Segment 3: Contacted (Orange) */}
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ff7eb3" strokeWidth="16" strokeDasharray={contactedDash} strokeDashoffset="0" transform={`rotate(${contactedRot} 50 50)`} className="transition-all duration-1000 ease-out delay-150" />
                                    {/* Segment 4: New (Blue) */}
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#5b86e5" strokeWidth="16" strokeDasharray={newDash} strokeDashoffset="0" transform={`rotate(${newRot} 50 50)`} className="transition-all duration-1000 ease-out delay-200" />
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
                            <span className="text-sm font-black text-white">{pctNew.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-6 hover:bg-white/5 p-2 -mx-2 rounded-xl cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#ff7eb3] shadow-[0_0_10px_rgba(255,126,179,0.5)]"></div>
                                <span className="text-xs font-bold text-slate-300">Contacted</span>
                            </div>
                            <span className="text-sm font-black text-white">{pctContacted.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-6 hover:bg-white/5 p-2 -mx-2 rounded-xl cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#f6d365] shadow-[0_0_10px_rgba(246,211,101,0.5)]"></div>
                                <span className="text-xs font-bold text-slate-300">In Progress</span>
                            </div>
                            <span className="text-sm font-black text-white">{pctInProgress.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-6 hover:bg-white/5 p-2 -mx-2 rounded-xl cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#00e57c] shadow-[0_0_10px_rgba(0,229,124,0.5)]"></div>
                                <span className="text-xs font-bold text-slate-300">Closed</span>
                            </div>
                            <span className="text-sm font-black text-white">{pctClosed.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Charts;
