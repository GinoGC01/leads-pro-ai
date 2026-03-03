import React, { useState } from 'react';
import { Lock, Shield, ShieldCheck, Eye, EyeOff } from 'lucide-react';

/**
 * SecurityVaultForm
 * Renders the "Bóveda de Seguridad" tab. Props-only except local show/hide state.
 * Clearly communicates AES-256 encryption and masked-key protocol.
 */
const SecurityVaultForm = ({ config, keysForm, onChange, onSave, isSaving }) => {
    const [showOpenAI, setShowOpenAI] = useState(false);
    const [showGoogle, setShowGoogle] = useState(false);

    return (
        <div className="bg-gradient-to-br from-slate-900 via-[#0e0e11] to-slate-900 rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/5 blur-3xl rounded-full"></div>

            <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <Lock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white">Bóveda de Seguridad</h2>
                        <p className="text-[10px] text-slate-500 font-mono">AES-256-GCM · Las llaves jamás se envían desencriptadas</p>
                    </div>
                </div>

                {/* Security Info Banner */}
                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[10px] text-emerald-400/80 leading-relaxed">
                        <span className="font-black">Protocolo de seguridad activo.</span> Las llaves se encriptan con AES-256-GCM
                        antes de almacenarse. El frontend solo recibe versiones enmascaradas (ej: <span className="font-mono">sk-p...9x2A</span>).
                        Para actualizar una llave, ingresa el valor completo nuevo.
                    </div>
                </div>

                {/* Warning Banner */}
                <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 flex items-start gap-3">
                    <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-400/80 leading-relaxed">
                        <span className="font-black text-amber-400">⚠ Advertencia:</span> Las llaves están encriptadas con AES-256. Solo ingresa una nueva si deseas reemplazar la actual. Si dejas el valor enmascarado, no se sobreescribirá.
                    </p>
                </div>

                {/* OpenAI Key */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OpenAI API Key</label>
                        <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${config?.api_keys?.openai_source === 'vault'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                {config?.api_keys?.openai_source === 'vault' ? '🔐 Vault' : '📁 .env'}
                            </span>
                            <button onClick={() => setShowOpenAI(!showOpenAI)} className="p-1 hover:bg-white/10 rounded transition-colors">
                                {showOpenAI ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                            </button>
                        </div>
                    </div>
                    <input
                        type={showOpenAI ? 'text' : 'password'}
                        value={keysForm.openai_key}
                        onChange={e => onChange(f => ({ ...f, openai_key: e.target.value }))}
                        placeholder="sk-proj-..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm
                            focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all
                            placeholder:text-slate-600"
                    />
                </div>

                {/* Google Places Key */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google Places API Key</label>
                        <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${config?.api_keys?.google_source === 'vault'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                {config?.api_keys?.google_source === 'vault' ? '🔐 Vault' : '📁 .env'}
                            </span>
                            <button onClick={() => setShowGoogle(!showGoogle)} className="p-1 hover:bg-white/10 rounded transition-colors">
                                {showGoogle ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                            </button>
                        </div>
                    </div>
                    <input
                        type={showGoogle ? 'text' : 'password'}
                        value={keysForm.google_places_key}
                        onChange={e => onChange(f => ({ ...f, google_places_key: e.target.value }))}
                        placeholder="AIza..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm
                            focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all
                            placeholder:text-slate-600"
                    />
                </div>

                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-50
                        text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all
                        shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
                >
                    <Shield className="w-4 h-4" />
                    {isSaving ? 'Encriptando...' : 'Guardar en Bóveda Segura'}
                </button>
            </div>
        </div>
    );
};

export default SecurityVaultForm;
