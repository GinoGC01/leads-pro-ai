import React from 'react';

// Custom Hook (all math lives here)
import useChartsMath from './hooks/useChartsMath';

// Presentational Components (zero calculations)
import AcquisitionBarChart from './components/AcquisitionBarChart';
import PipelineDonutChart from './components/PipelineDonutChart';
import ChartLegend from './components/ChartLegend';

/**
 * DashboardCharts — Thin Orchestrator
 * Wires 1 hook → 3 components.
 * Preserves exact same grid layout as original Charts.jsx.
 */
const DashboardCharts = ({ stats }) => {
    const { barChartData, donutSegments, legendData, totalPipeline, isGlobal } = useChartsMath(stats);

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
                    <AcquisitionBarChart data={barChartData} isGlobal={isGlobal} />
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
                    <PipelineDonutChart segments={donutSegments} totalPipeline={totalPipeline} />
                    <ChartLegend items={legendData} />
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
