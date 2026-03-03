import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

/**
 * TableHeader — <thead> with interactive sort arrows.
 * Receives sortConfig and onSort callback.
 */
const TableHeader = ({ sortConfig, onSort, onSelectAll, isAllSelected }) => {
    const getSortIcon = (key) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 text-primary-600" />
            : <ArrowDown className="w-3 h-3 text-primary-600" />;
    };

    return (
        <thead>
            <tr className="border-b border-white/5">
                <th className="px-4 py-4 w-10">
                    <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={onSelectAll}
                        className="w-4 h-4 rounded border-slate-600 bg-white/5 text-accent-blue focus:ring-accent-blue cursor-pointer"
                    />
                </th>
                <th
                    className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => onSort('name')}
                >
                    <div className="flex items-center gap-2">Negocio {getSortIcon('name')}</div>
                </th>
                <th
                    className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => onSort('status')}
                >
                    <div className="flex items-center gap-2">Estado CRM {getSortIcon('status')}</div>
                </th>
                <th
                    className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => onSort('ttfb')}
                >
                    <div className="flex items-center gap-2">Tech / Performance {getSortIcon('ttfb')}</div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Oportunidad / Ángulo
                </th>
                <th
                    className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors text-center"
                    onClick={() => onSort('leadOpportunityScore')}
                >
                    <div className="flex items-center justify-center gap-2">Score {getSortIcon('leadOpportunityScore')}</div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Acciones
                </th>
            </tr>
        </thead>
    );
};

export default TableHeader;
