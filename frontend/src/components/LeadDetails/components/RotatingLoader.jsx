import React from 'react';
import { Loader2 } from 'lucide-react';

const RotatingLoader = () => {
    const steps = [
        "Inicializando Araña...",
        "Resolviendo DNS y escaneando red...",
        "Bypass de Firewalls (WAF)...",
        "Descargando código fuente HTML...",
        "Buscando píxeles y analíticas...",
        "Extrayendo emails y teléfonos ocultos...",
        "Perforando estructura SEO...",
        "Generando Radiografía SPIDER..."
    ];
    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1 < steps.length ? prev + 1 : prev));
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-4 py-8 text-center relative z-10 animate-in fade-in duration-300">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
            <div className="h-6 relative overflow-hidden flex items-center justify-center mt-2">
                <p key={index} className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] animate-in slide-in-from-bottom-2 fade-in duration-300 absolute">
                    {steps[index]}
                </p>
            </div>
            <div className="w-48 h-1 bg-indigo-500/10 mx-auto rounded-full overflow-hidden mt-6">
                <div
                    className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-500 ease-out"
                    style={{ width: `${((index + 1) / steps.length) * 100}%` }}
                />
            </div>
        </div>
    );
};

export default RotatingLoader;
