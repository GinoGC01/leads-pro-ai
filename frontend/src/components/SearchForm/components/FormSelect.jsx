import React from 'react';

/**
 * FormSelect — Reusable dropdown with left-aligned icon.
 * Receives an array of { value, label } options.
 * Pure presentational.
 */
const FormSelect = ({ icon: Icon, name, value, onChange, options, label }) => (
    <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
            {label}
        </label>
        <div className="relative">
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
                name={name}
                className="w-full pl-11 pr-4 py-3 bg-[#2a2a2e] border border-white/10 rounded-xl focus:ring-2 focus:ring-accent-blue outline-none transition-all text-white text-sm appearance-none"
                value={value}
                onChange={onChange}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    </div>
);

export default FormSelect;
