import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * AlertBanner — Renders an array of alerts (critical = red, warning = amber).
 * Returns null if empty array. Pure presentational.
 */
const AlertBanner = ({ alerts }) => {
    if (!alerts || alerts.length === 0) return null;

    return (
        <div className="space-y-2">
            {alerts.map((alert, i) => (
                <div
                    key={i}
                    className={`p-3 rounded-xl flex items-start gap-2 ${
                        alert.level === 'critical'
                            ? 'bg-red-500/10 border border-red-500/20'
                            : 'bg-amber-500/10 border border-amber-500/20'
                    }`}
                >
                    <AlertTriangle
                        className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                            alert.level === 'critical' ? 'text-red-400' : 'text-amber-400'
                        }`}
                    />
                    <p className={`text-[10px] font-bold ${
                        alert.level === 'critical' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                        {alert.message}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default AlertBanner;
