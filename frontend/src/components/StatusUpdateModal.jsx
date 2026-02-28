import React, { useState } from 'react';
import { MessageSquare, X, Check } from 'lucide-react';

const StatusUpdateModal = ({ isOpen, newStatus, onClose, onConfirm }) => {
    const [note, setNote] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(note);
        setNote('');
    };

    const handleClose = () => {
        setNote('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            ></div>

            {/* Modal */}
            <div className="relative w-[90vw] max-w-md bg-gradient-to-b from-[#11131A] to-[#0A0B10] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-blue/50 to-transparent"></div>

                <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-accent-blue/10 border border-accent-blue/20 rounded-xl">
                                <MessageSquare className="w-5 h-5 text-accent-blue" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white tracking-tight">Actualizar Estado</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Destino: <span className="text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/5">{newStatus}</span></p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Nota o Contexto (Opcional)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Escribe algún detalle sobre esta interacción o actualización..."
                            className="w-full bg-[#0B0B0C] text-sm text-slate-200 border border-white/10 rounded-xl p-4 focus:ring-1 focus:ring-accent-blue focus:border-accent-blue outline-none transition-all resize-none shadow-inner"
                            rows="4"
                            autoFocus
                        ></textarea>
                    </div>
                </div>

                <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-accent-blue hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all active:scale-95"
                    >
                        <Check className="w-4 h-4" /> Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatusUpdateModal;
