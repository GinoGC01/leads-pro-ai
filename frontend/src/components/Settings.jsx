import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import AlertService from '../services/AlertService';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const Settings = () => {
    const [agencyContext, setAgencyContext] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        // Load initial settings
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings/agency-context');
                if (data.success && data.context) {
                    setAgencyContext(data.context);
                }
            } catch (err) {
                console.error("No context found or error fetching", err);
            }
        };
        fetchSettings();
    }, []);

    const handleSaveRequest = (e) => {
        e.preventDefault();
        setShowConfirmModal(true);
    };

    const handleConfirmSave = async () => {
        setShowConfirmModal(false);
        setIsLoading(true);

        const saveReq = api.post('/settings/agency-context', { context: agencyContext });

        AlertService.promise(
            saveReq,
            {
                loading: 'Actualizando núcleo del sistema...',
                success: 'Códice de la Agencia guardado exitosamente.',
                error: 'Error al actualizar el contexto.'
            }
        ).finally(() => {
            setIsLoading(false);
        });
    };

    return (
        <div className="p-10 max-w-5xl relative">

            {/* Confirmation Modal */}
            {showConfirmModal && (
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
                                onClick={() => setShowConfirmModal(false)}
                                className="px-5 py-2.5 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmSave}
                                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] active:scale-95"
                            >
                                Sí, Actualizar Identidad
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">System Settings</h1>
                <p className="text-slate-400 mt-2">Configure core operational rules and parameters for Leads Pro AI.</p>
            </div>

            <div className="bg-app-card rounded-2xl p-8 border border-white/5 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    Códice de la Agencia (Agency Context)
                </h2>
                <p className="text-slate-400 text-sm mb-6 max-w-3xl leading-relaxed">
                    Este documento interno (escrito en formato Markdown) define tu negocio, tu cliente ideal, el tono comunicacional y los servicios que ofreces.
                    El Cortex de Inteligencia Artificial ("Vortex") consumirá este archivo master para evaluar <strong>el valor y compatibilidad</strong> de cada Lead entrante,
                    y determinar qué tácticas o guiones generar en base a lo que vendes. Modifícalo con precaución.
                </p>

                <form onSubmit={handleSaveRequest} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <textarea
                            value={agencyContext}
                            onChange={(e) => setAgencyContext(e.target.value)}
                            placeholder="# Quiénes somos\nSomos una agencia de pauta digital B2B...\n\n# Qué buscamos\nClientes que inviertan más de $2000 al mes en Google Ads..."
                            className="w-full h-[500px] p-6 bg-[#1a1a1c] border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-300 font-mono text-sm resize-y shadow-inner scroll-smooth"
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/5">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Guardar Configuración</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
