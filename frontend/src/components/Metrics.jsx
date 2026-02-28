import React from 'react';
import { Users, Activity, BarChart3, Database, TrendingUp, Zap } from 'lucide-react';
import classNames from 'classnames';
import Tooltip from './Tooltip';

const Sparkline = () => (
    <svg className="w-24 h-8" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 25C10 25 15 15 25 15C35 15 40 20 50 10C60 0 70 20 80 15C90 10 95 5 100 5" stroke="#00e57c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M0 25C10 25 15 15 25 15C35 15 40 20 50 10C60 0 70 20 80 15C90 10 95 5 100 5L100 30L0 30Z" fill="url(#paint0_linear)" fillOpacity="0.15" />
        <defs>
            <linearGradient id="paint0_linear" x1="50" y1="5" x2="50" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00e57c" />
                <stop offset="1" stopColor="#00e57c" stopOpacity="0" />
            </linearGradient>
        </defs>
    </svg>
);

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

const OppScoreGraphic = ({ score }) => (
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

const MetricCard = ({ icon: Icon, title, value, pillText, pillColor, isPrimary, tooltipText, tooltipPosition, children }) => {
    const cardContent = (
        <div className={classNames(
            "p-6 rounded-3xl flex flex-col justify-between h-[180px] relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl w-full",
            isPrimary ? "bg-white text-black shadow-lg shadow-white/5" : "bg-app-card text-white border border-white/5 hover:border-white/10"
        )}>
            {/* Decorative background glow for primary */}
            {isPrimary && <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent-blue/10 blur-3xl rounded-full pointer-events-none"></div>}

            <div className="flex justify-between items-start relative z-10">
                <span className={classNames(
                    "text-xs font-bold uppercase tracking-widest",
                    isPrimary ? "text-slate-500" : "text-slate-400"
                )}>{title}</span>

                {isPrimary ? (
                    <div className="bg-black text-white p-2.5 rounded-2xl shadow-md">
                        <Icon strokeWidth={2.5} className="w-4 h-4" />
                    </div>
                ) : (
                    <div className="bg-white/5 p-2.5 rounded-2xl text-slate-400 border border-white/5">
                        <Icon strokeWidth={2} className="w-4 h-4" />
                    </div>
                )}
            </div>

            <div className="relative z-10 mt-auto">
                <div className="flex items-end justify-between">
                    <div className="flex items-end gap-3">
                        <span className={classNames(
                            "text-4xl font-black tracking-tighter",
                            isPrimary ? "text-black" : "text-white"
                        )}>{value}</span>

                        {pillText && (
                            <span className={classNames(
                                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg mb-1.5 border",
                                pillColor === 'green'
                                    ? classNames(isPrimary ? "bg-[#00e57c]/10 text-[#00c868] border-[#00e57c]/20" : "bg-pastel-green/10 text-pastel-green border-pastel-green/20")
                                    : "bg-white/5 text-slate-400 border-white/10"
                            )}>
                                {pillColor === 'green' && <TrendingUp className="w-3 h-3" />}
                                {pillText}
                            </span>
                        )}
                    </div>
                    {isPrimary && <Sparkline />}
                </div>
                {children}
            </div>
        </div>
    );

    if (tooltipText) {
        return <Tooltip text={tooltipText} position={tooltipPosition || 'top'}>{cardContent}</Tooltip>;
    }

    return cardContent;
};

const Metrics = ({ stats }) => {
    if (!stats || !stats.summary) return null;
    const { summary } = stats;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-8">
            <MetricCard
                icon={Users}
                title="Total Leads"
                value={summary.totalLeads.toLocaleString()}
                pillText="+12.5%"
                pillColor="green"
                isPrimary={true}
                tooltipText="Leads válidos extraídos exitosamente que superaron los filtros de control de VORTEX (Email/Web/Teléfono presentes)."
                tooltipPosition="bottom"
            />
            <MetricCard
                icon={Zap}
                title="Active Scrapers"
                value={summary.totalSearches || "4"}
                pillText={null}
                tooltipText="Instancias concurrentes del motor de extracción procesando data en la nube."
            >
                <ActiveScrapersGraphic />
            </MetricCard>
            <MetricCard
                icon={Activity}
                title="Average Opp Score"
                value={`${(summary.avgScore || 0).toFixed(0)}`}
                pillText="pts"
                tooltipText="Promedio global del Costo Hundido. Puntajes más de 60 pts implican alta predisposición a cambiar de proveedor."
            >
                <OppScoreGraphic score={summary.avgScore || 0} />
            </MetricCard>
            <MetricCard
                icon={Database}
                title="Market Dominance"
                value={`${Math.min(100, Math.round((summary.totalLeads / 5000) * 100))}%`}
                pillText="+5.6%"
                pillColor="green"
                tooltipText="Participación de mercado total escaneada en comparación al target teórico comercial establecido."
            >
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-6">
                    <div className="bg-pastel-green h-1.5 rounded-full relative" style={{ width: `${Math.min(100, Math.round((summary.totalLeads / 5000) * 100))}%` }}>
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/50"></div>
                    </div>
                </div>
            </MetricCard>
        </div>
    );
};

export default Metrics;
