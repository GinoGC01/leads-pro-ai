import React, { useState } from 'react';
import { Search, MapPin, Navigation, Globe, Zap } from 'lucide-react';

const SearchForm = ({ onSearch, isLoading }) => {
    const [formData, setFormData] = useState({
        keyword: '',
        location: '',
        radius: 5000,
        maxResults: 60,
        countryCode: 'AR'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-app-card p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
            {/* Soft background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-white font-black text-xl tracking-tight">Data Intelligence Engine</h2>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Define Your Next Target Audience</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 relative z-10">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Concepto / Nicho</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Ej: Dentistas, Abogados..."
                            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-accent-blue focus:border-accent-blue outline-none transition-all text-white text-sm placeholder:text-slate-600"
                            value={formData.keyword}
                            onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Ubicación (HQ)</label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Ciudad o Estado..."
                            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-accent-blue focus:border-accent-blue outline-none transition-all text-white text-sm placeholder:text-slate-600"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Radio</label>
                    <div className="relative">
                        <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <select
                            className="w-full pl-11 pr-4 py-3 bg-[#2a2a2e] border border-white/10 rounded-xl focus:ring-2 focus:ring-accent-blue outline-none transition-all text-white text-sm appearance-none"
                            value={formData.radius}
                            onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                        >
                            <option value={1000}>1 km (Hyperlocal)</option>
                            <option value={5000}>5 km (Local)</option>
                            <option value={10000}>10 km (City)</option>
                            <option value={50000}>50 km (Metro)</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">País</label>
                    <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <select
                            className="w-full pl-11 pr-4 py-3 bg-[#2a2a2e] border border-white/10 rounded-xl focus:ring-2 focus:ring-accent-blue outline-none transition-all text-white text-sm appearance-none"
                            value={formData.countryCode}
                            onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        >
                            <option value="">Global</option>
                            <option value="AR">Argentina</option>
                            <option value="ES">España</option>
                            <option value="MX">México</option>
                            <option value="US">Estados Unidos</option>
                            <option value="CO">Colombia</option>
                            <option value="CL">Chile</option>
                            <option value="PE">Perú</option>
                            <option value="UY">Uruguay</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold h-[46px] rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(13,108,242,0.3)] hover:shadow-[0_0_25px_rgba(13,108,242,0.5)] active:scale-95"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                <span>Compile List</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default SearchForm;
