import React from 'react';
import { Users, Zap, Activity, Database } from 'lucide-react';

// Custom Hook (all math lives here)
import useMetricsCalculations from './hooks/useMetricsCalculations';

// Atomic Components
import MetricCard from './MetricCard';
import Sparkline from './graphics/Sparkline';
import ActiveScrapersGraphic from './graphics/ActiveScrapersGraphic';
import OppScoreGraphic from './graphics/OppScoreGraphic';

/**
 * MetricsGrid — Thin Orchestrator
 * Wires 1 hook → 4 MetricCards with injected graphics.
 * campaignTargetSize is configurable — no more magic 5000 in JSX.
 */
const MetricsGrid = ({ stats, campaignTargetSize = 5000 }) => {
    const metrics = useMetricsCalculations(stats?.summary, campaignTargetSize);

    if (!stats || !stats.summary || !metrics) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-8">
            <MetricCard
                icon={Users}
                title="Total Leads"
                value={metrics.totalLeads}
                pillText={metrics.leadGrowth}
                pillColor="green"
                isPrimary={true}
                tooltipText="Leads válidos extraídos exitosamente que superaron los filtros de control de VORTEX (Email/Web/Teléfono presentes)."
                tooltipPosition="bottom"
            >
                <Sparkline />
            </MetricCard>

            <MetricCard
                icon={Zap}
                title="Active Scrapers"
                value={metrics.activeSearches}
                pillText={null}
                tooltipText="Instancias concurrentes del motor de extracción procesando data en la nube."
            >
                <ActiveScrapersGraphic />
            </MetricCard>

            <MetricCard
                icon={Activity}
                title="Average Opp Score"
                value={metrics.avgScore}
                pillText="pts"
                tooltipText="Promedio global del Costo Hundido. Puntajes más de 60 pts implican alta predisposición a cambiar de proveedor."
            >
                <OppScoreGraphic />
            </MetricCard>

            <MetricCard
                icon={Database}
                title="Market Dominance"
                value={metrics.marketDominancePct}
                pillText={metrics.dominanceGrowth}
                pillColor="green"
                tooltipText={`Penetración sobre un mercado objetivo estimado de ${metrics.campaignTargetSize.toLocaleString()} prospectos.`}
            >
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-6">
                    <div className="bg-pastel-green h-1.5 rounded-full relative" style={{ width: `${metrics.marketDominance}%` }}>
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/50"></div>
                    </div>
                </div>
            </MetricCard>
        </div>
    );
};

export default MetricsGrid;
