import React, { useState } from 'react';
import { X, UserPlus, Phone, Globe, Mail, MapPin, FileText } from 'lucide-react';
import axios from 'axios';
import AlertService from '../services/AlertService';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const SOURCE_OPTIONS = [
    { value: 'manual', label: 'Manual', icon: '✏️' },
    { value: 'referido', label: 'Referido', icon: '🤝' },
    { value: 'red_social', label: 'Red Social', icon: '📱' },
    { value: 'evento', label: 'Evento', icon: '🎤' },
    { value: 'otro', label: 'Otro', icon: '📋' },
];

const ManualLeadModal = ({ isOpen, onClose, onLeadCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        website: '',
        email: '',
        address: '',
        notes: '',
        source: 'manual',
        sourceLabel: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            AlertService.error('El nombre del lead es obligatorio.');
            return;
        }
        if (!formData.phoneNumber && !formData.website && !formData.email) {
            AlertService.error('Se requiere al menos un dato de contacto.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await api.post('/leads/manual', formData);
            AlertService.success(`Lead "${res.data.lead.name}" agregado exitosamente.`);
            onLeadCreated && onLeadCreated(res.data.lead);
            setFormData({ name: '', phoneNumber: '', website: '', email: '', address: '', notes: '', source: 'manual', sourceLabel: '' });
            onClose();
        } catch (err) {
            AlertService.error(err.response?.data?.message || 'Error al crear el lead.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#1a1a1d] border border-white/10 rounded-2xl w-full max-w-lg mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">Agregar Lead Manual</h2>
                            <p className="text-slate-400 text-xs">Lead externo a Google Maps</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nombre del Negocio *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Ej: Clínica Dental Sonrisas"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Phone + Email Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</label>
                            <input
                                type="text"
                                value={formData.phoneNumber}
                                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                placeholder="+54 11 1234-5678"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="info@negocio.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Website */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Globe className="w-3 h-3" /> Website</label>
                        <input
                            type="text"
                            value={formData.website}
                            onChange={(e) => handleChange('website', e.target.value)}
                            placeholder="www.negocio.com"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> Dirección</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            placeholder="Av. Corrientes 1234, CABA"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Source */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Canal de Origen</label>
                        <div className="flex flex-wrap gap-2">
                            {SOURCE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleChange('source', opt.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${formData.source === opt.value
                                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                                        : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {opt.icon} {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><FileText className="w-3 h-3" /> Notas</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Referido por Juan, interesado en landing page..."
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-50 flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        {isSubmitting ? 'Guardando...' : 'Agregar Lead'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualLeadModal;
