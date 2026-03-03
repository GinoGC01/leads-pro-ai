import React from 'react';
import { Trash2, X } from 'lucide-react';

/**
 * BulkActionBar — Floating blue bar for mass operations.
 * Renders only when selectedCount > 0.
 */
const BulkActionBar = ({ selectedCount, onClear, onDelete }) => {
    if (selectedCount === 0) return null;

    return (
        <div className="absolute top-0 inset-x-0 z-20 bg-indigo-600 text-white p-4 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
                <button onClick={onClear} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold">
                    {selectedCount} leads seleccionados
                </span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onDelete}
                    className="flex items-center gap-2 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar Permanentemente
                </button>
            </div>
        </div>
    );
};

export default BulkActionBar;
