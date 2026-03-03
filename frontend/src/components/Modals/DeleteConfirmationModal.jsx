import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, count }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Confirmar Eliminación</h3>
                            <p className="text-sm text-slate-500">Esta acción es permanente.</p>
                        </div>
                    </div>

                    <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-6">
                        <p className="text-sm text-red-700 leading-relaxed">
                            Estás a punto de eliminar <span className="font-bold">{count} leads</span> del sistema.
                            Se borrarán todos sus datos, métricas y la inteligencia vectorial de forma irreversible.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all"
                        >
                            Eliminar Permanentemente
                        </button>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
