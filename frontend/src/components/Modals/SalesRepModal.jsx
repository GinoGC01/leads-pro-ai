import React, { useState, useEffect } from 'react';
import { User, ArrowRight } from 'lucide-react';

const SalesRepModal = ({ onComplete }) => {
    const [name, setName] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if name is already set
        const storedName = localStorage.getItem('salesRepName');
        if (!storedName) {
            setIsVisible(true);
        } else if (onComplete) {
            onComplete(storedName);
        }
    }, [onComplete]);

    if (!isVisible) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim().length < 2) return;

        localStorage.setItem('salesRepName', name.trim());
        setIsVisible(false);
        if (onComplete) {
            onComplete(name.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050505]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.05)_0,transparent_50%)] pointer-events-none"></div>

            <div className="w-full max-w-md p-8 bg-[#0B0B0C] rounded-3xl border border-white/5 shadow-[0_0_100px_rgba(56,189,248,0.1)] relative z-10 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-blue/50 to-transparent"></div>

                <div className="flex justify-center mb-8">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 relative">
                        <div className="absolute inset-0 bg-accent-blue/20 blur-xl rounded-full"></div>
                        <User className="w-10 h-10 text-white relative z-10" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-white tracking-tight mb-2">Identificación de Agente</h2>
                    <p className="text-slate-400 text-sm font-medium">Por favor, ingresa tu nombre. Esto firmará los mensajes automáticos de WhatsApp en esta sesión.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Gino, Carlos, María..."
                            className="w-full bg-[#151720] text-center text-lg text-white border border-white/10 rounded-2xl p-4 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue outline-none transition-all placeholder:text-slate-600 font-bold"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={name.trim().length < 2}
                        className="w-full py-4 bg-accent-blue hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] disabled:opacity-50 disabled:shadow-none disabled:hover:bg-accent-blue flex items-center justify-center gap-2 group"
                    >
                        Iniciar Sesión <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SalesRepModal;
