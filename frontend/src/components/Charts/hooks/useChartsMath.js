import { useMemo } from 'react';

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PIPELINE_SEGMENTS = [
    { key: 'closed',      label: 'Closed',      color: '#00e57c', glowColor: 'rgba(0,229,124,0.5)' },
    { key: 'descartados', label: 'Descartados',  color: '#52525b', glowColor: 'rgba(82,82,91,0.5)' },
    { key: 'in_progress', label: 'In Progress',  color: '#f6d365', glowColor: 'rgba(246,211,101,0.5)' },
    { key: 'contacted',   label: 'Contacted',    color: '#ff7eb3', glowColor: 'rgba(255,126,179,0.5)' },
    { key: 'en_espera',   label: 'En Espera',    color: '#a855f7', glowColor: 'rgba(168,85,247,0.5)' },
    { key: 'new',         label: 'New Leads',    color: '#5b86e5', glowColor: 'rgba(91,134,229,0.5)' },
];

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 251.327

/**
 * Hook: useChartsMath
 * Isolates ALL mathematical computation for both chart types.
 * Everything is useMemo-guarded — recalculates only when stats change.
 */
const useChartsMath = (stats) => {
    const isGlobal = stats?.charts?.isGlobalView;

    // ─── Bar Chart Data (Acquisition Velocity) ───
    const barChartData = useMemo(() => {
        const barCampaign = stats?.charts?.monthlyAcquisitionCampaign || Array(12).fill(0);
        const barGlobal = stats?.charts?.monthlyAcquisitionGlobal || Array(12).fill(0);
        const exactDates = stats?.charts?.exactDates || Array(12).fill(null).map(() => []);

        return MONTH_NAMES.map((month, i) => {
            const campaignLeads = barCampaign[i] || 0;
            let otherLeads = barGlobal[i] || 0;

            if (!isGlobal) {
                otherLeads = Math.max(0, otherLeads - campaignLeads);
            }

            return {
                month,
                "Campaña Actual": isGlobal ? 0 : campaignLeads,
                "Otras Campañas": isGlobal ? (barGlobal[i] || 0) : otherLeads,
                exactDates: exactDates[i] || [],
            };
        });
    }, [stats, isGlobal]);

    // ─── Donut Chart Segments (Pipeline SVG Geometry) ───
    const { donutSegments, legendData, totalPipeline } = useMemo(() => {
        const pipelineData = stats?.charts?.pipelineStatus || {};
        const total = PIPELINE_SEGMENTS.reduce((sum, seg) => sum + (pipelineData[seg.key] || 0), 0);
        const safeTotal = total || 1;

        let cumulativeRotation = 0;
        const segments = [];
        const legend = [];

        PIPELINE_SEGMENTS.forEach((seg, i) => {
            const count = pipelineData[seg.key] || 0;
            const pct = (count / safeTotal) * 100;
            const dashLength = (pct / 100) * CIRCUMFERENCE;

            segments.push({
                color: seg.color,
                strokeDasharray: `${dashLength} ${CIRCUMFERENCE}`,
                strokeDashoffset: 0,
                transform: `rotate(${cumulativeRotation} 50 50)`,
                delay: `${i * 50}ms`,
            });

            legend.push({
                label: seg.label,
                color: seg.color,
                glowColor: seg.glowColor,
                count,
                pct: pct.toFixed(0),
            });

            cumulativeRotation += (pct / 100) * 360;
        });

        return { donutSegments: segments, legendData: legend, totalPipeline: total };
    }, [stats]);

    return { barChartData, donutSegments, legendData, totalPipeline, isGlobal };
};

export default useChartsMath;
