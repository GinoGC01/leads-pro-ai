import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const Charts = ({ stats }) => {
    const isGlobal = stats?.charts?.isGlobalView;
    const barCampaign = stats?.charts?.monthlyAcquisitionCampaign || Array(12).fill(0);
    const barGlobal = stats?.charts?.monthlyAcquisitionGlobal || Array(12).fill(0);
    const exactDates = stats?.charts?.exactDates || Array(12).fill(null).map(() => []);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const chartData = monthNames.map((month, i) => {
        const campaignLeads = barCampaign[i] || 0;
        let otherLeads = barGlobal[i] || 0;

        if (!isGlobal) {
            otherLeads = Math.max(0, otherLeads - campaignLeads);
        }

        return {
            month,
            "Campaña Actual": isGlobal ? 0 : campaignLeads,
            "Otras Campañas": isGlobal ? (barGlobal[i] || 0) : otherLeads,
            exactDates: exactDates[i] || []
        };
    });

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
            {/* Acquisition Velocity Chart (Recharts Stacked Bar) */}
            <div className="bg-app-card rounded-3xl p-8 min-h-[340px] flex flex-col border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4 relative z-10 w-full">
                    <div>
                        <h3 className="text-white font-black text-xl flex items-center gap-2 tracking-tight">
                            Acquisition Velocity
                        </h3>
                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">Leads captured over time</p>
                    </div>
                </div>

                <div className="flex-1 w-full relative z-10 h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                            <XAxis dataKey="month" stroke="#666" fontSize={10} tickLine={false} axisLine={false} dy={5} />
                            <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                            <RechartsTooltip
                                cursor={{ fill: '#ffffff0a' }}
                                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                            {!isGlobal && (
                                <Bar dataKey="Campaña Actual" stackId="a" fill="#00e57c" radius={[0, 0, 4, 4]} />
                            )}
                            <Bar dataKey="Otras Campañas" stackId="a" fill={isGlobal ? "#3b82f6" : "#334155"} radius={isGlobal ? [4, 4, 4, 4] : [4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
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
