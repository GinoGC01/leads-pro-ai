import React from 'react';
import { Grid3X3 } from 'lucide-react';

/**
 * Grid density options — extracted as constant.
 */
const GRID_SIZE_OPTIONS = [
    { value: 3, label: '3×3 (9 celdas)' },
    { value: 5, label: '5×5 (25 celdas)' },
    { value: 7, label: '7×7 (49 celdas)' },
];

/**
 * GridSettingsPanel — Toggle switch for grid search mode,
 * density selector, and cost estimation banner.
 * Pure presentational — receives all state via props.
 */
const GridSettingsPanel = ({ gridMode, gridSize, gridCost, onToggle, onChangeSize }) => (
    <div className="mt-5 relative z-10">
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-3">
            <div className="flex items-center gap-3">
                <Grid3X3 className={`w-5 h-5 ${gridMode ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                    <span className="text-sm font-bold text-white">Grid Search</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Busca en zonas diferentes para encontrar leads que la búsqueda normal no alcanza</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {gridMode && (
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Densidad:</label>
                        <select
                            name="gridSize"
                            className="bg-[#2a2a2e] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white appearance-none"
                            value={gridSize}
                            onChange={onChangeSize}
                        >
                            {GRID_SIZE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {gridCost && (
                            <span className="text-[10px] font-bold text-amber-400">~${gridCost.maxUSD} USD máx</span>
                        )}
                    </div>
                )}
                <button
                    type="button"
                    onClick={onToggle}
                    className={`relative w-11 h-6 rounded-full transition-all ${gridMode ? 'bg-amber-500' : 'bg-white/10'}`}
                >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${gridMode ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
            </div>
        </div>
    </div>
);

export default GridSettingsPanel;
