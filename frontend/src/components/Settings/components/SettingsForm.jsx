import React from 'react';
import { Save } from 'lucide-react';

/**
 * Language tone options — extracted from JSX for readability.
 */
const LANGUAGE_OPTIONS = [
    { value: 'AUTO_DETECT', label: '🌍 Detección Automática (Basado en el prefijo del Teléfono)' },
    { value: 'FORCE_LATAM', label: '🇦🇷 Forzar LATAM (Dialecto comercial porteño, NINGÚN signo \'¿/¡\' permitido)' },
    { value: 'FORCE_EXPORT', label: '🌐 Forzar EXPORT (Español Neutro/Internacional, Formalidad Permitida)' },
];

/**
 * SettingsForm — Pure presentational form.
 * Renders the Códice textarea, identity inputs, language selector, and save button.
 * ZERO network calls — receives everything via props.
 */
const SettingsForm = ({ formData, onChange, onSubmitRequest, isSaving }) => (
    <div className="bg-app-card rounded-2xl p-8 border border-white/5 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            Códice de la Agencia (Agency Context)
        </h2>
        <p className="text-slate-400 text-sm mb-6 max-w-3xl leading-relaxed">
            Este documento interno (escrito en formato Markdown) define tu negocio, tu cliente ideal, el tono comunicacional y los servicios que ofreces.
            El Cortex de Inteligencia Artificial ("Vortex") consumirá este archivo master para evaluar <strong>el valor y compatibilidad</strong> de cada Lead entrante,
            y determinar qué tácticas o guiones generar en base a lo que vendes. Modifícalo con precaución.
        </p>

        <form onSubmit={onSubmitRequest} className="flex flex-col gap-6">
            {/* Códice Textarea */}
            <div className="flex flex-col gap-2">
                <textarea
                    name="agencyContext"
                    value={formData.agencyContext}
                    onChange={onChange}
                    placeholder={"# Quiénes somos\nSomos una agencia de pauta digital B2B...\n\n# Qué buscamos\nClientes que inviertan más de $2000 al mes en Google Ads..."}
                    className="w-full h-[500px] p-6 bg-[#1a1a1c] border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-300 font-mono text-sm resize-y shadow-inner scroll-smooth"
                    required
                />
            </div>

            {/* Persona Identity Inputs */}
            <div className="bg-[#1a1a1c] border border-white/10 p-6 rounded-xl flex flex-col md:flex-row gap-6 mt-4">
                <div className="flex-1">
                    <label className="block text-slate-400 text-xs font-bold uppercase mb-2 tracking-wider">Tu Nombre (Sales Rep)</label>
                    <input
                        type="text"
                        name="senderName"
                        value={formData.senderName}
                        onChange={onChange}
                        placeholder="Gino"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-slate-400 text-xs font-bold uppercase mb-2 tracking-wider">Nombre de Tu Agencia</label>
                    <input
                        type="text"
                        name="agencyName"
                        value={formData.agencyName}
                        onChange={onChange}
                        placeholder="Mariosweb"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Language Tone Selector */}
            <div className="bg-[#1a1a1c] border border-white/10 p-6 rounded-xl flex flex-col gap-4">
                <div>
                    <h3 className="text-white font-bold mb-1">Comportamiento Lingüístico de MARIO</h3>
                    <p className="text-xs text-slate-400">Define si la Inteligencia Artificial debe anular la detección por código de área y forzar un dialecto específico para evitar doblajes o respuestas robóticas.</p>
                </div>
                <div className="relative">
                    <select
                        name="languageTone"
                        value={formData.languageTone}
                        onChange={onChange}
                        className="w-full appearance-none px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                    >
                        {LANGUAGE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-[#1a1a1c] text-white py-2">{opt.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    {isSaving ? (
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
);

export default SettingsForm;
