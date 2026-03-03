import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * IdentityConfirmModal — Critical action confirmation before overwriting agency identity.
 * Pure presentational. Receives all state via props.
 */
const IdentityConfirmModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1a1a1c] border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3 mb-4 text-amber-400">
                    <AlertCircle className="w-8 h-8" />
                    <h3 className="text-xl font-bold">¿Actualizar Identidad?</h3>
                </div>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    Estás a punto de sobrescribir el <strong>Códice de la Agencia</strong>. Esta acción reescribirá la memoria base del sistema ("Vortex"), alterando cómo la Inteligencia Artificial califica y aborda a los futuros leads buscando afinidad con los nuevos servicios descritos.
                    <br /><br />
                    ¿Estás completamente seguro de aplicar este cambio en el negocio?
                </p>
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        ) : null}
                        Sí, Actualizar Identidad
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IdentityConfirmModal;
