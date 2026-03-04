import React from 'react';
import { AlertTriangle, X, RefreshCcw } from 'lucide-react';

const VortexResetModal = ({ isOpen, onClose, onConfirm, leadName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#11131A] rounded-2xl shadow-2xl border border-white/10 w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Hard Reset: VORTEX</h3>
                            <p className="text-sm text-slate-400">Esta acción purgará la memoria.</p>
                        </div>
                    </div>

                    <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20 mb-6">
                        <p className="text-sm text-red-400/90 leading-relaxed font-medium">
                            Estás a punto de borrar todo el análisis previo (SPIDER/Deep Vision) para <span className="font-bold text-red-400">"{leadName}"</span>. 
                            El prospecto será enviado nuevamente a la cola inicial.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCcw className="w-4 h-4" /> Ejecutar Reset
                        </button>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors text-slate-500 hover:text-white"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default VortexResetModal;
