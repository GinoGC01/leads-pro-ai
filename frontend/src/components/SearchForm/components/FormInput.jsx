import React from 'react';

/**
 * FormInput — Reusable text input with left-aligned icon.
 * Pure presentational. Applies consistent Tailwind styling.
 */
const FormInput = ({ icon: Icon, name, value, onChange, placeholder, required = false }) => (
    <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
            {name === 'keyword' ? 'Concepto / Nicho' : name === 'location' ? 'Ubicación (HQ)' : name}
        </label>
        <div className="relative">
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
                type="text"
                name={name}
                placeholder={placeholder}
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-accent-blue focus:border-accent-blue outline-none transition-all text-white text-sm placeholder:text-slate-600"
                value={value}
                onChange={onChange}
                required={required}
            />
        </div>
    </div>
);

export default FormInput;
