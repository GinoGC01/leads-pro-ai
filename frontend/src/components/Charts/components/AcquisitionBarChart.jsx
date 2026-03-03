import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * AcquisitionBarChart — Pure Recharts wrapper.
 * Receives pre-computed barChartData array and isGlobal flag.
 * ZERO math — just renders the chart.
 */
const AcquisitionBarChart = ({ data, isGlobal }) => {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
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
    );
};

export default AcquisitionBarChart;
