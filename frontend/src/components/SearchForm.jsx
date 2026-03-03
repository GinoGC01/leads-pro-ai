import React, { useState } from 'react';
import { Search, MapPin, Navigation, Globe, Zap, Grid3X3 } from 'lucide-react';

const SearchForm = ({ onSearch, isLoading }) => {
    const [formData, setFormData] = useState({
        keyword: '',
        location: '',
        radius: 5000,
        maxResults: 60,
        countryCode: 'AR',
        gridMode: false,
        gridSize: 3
    });

    // Grid cost estimation
    const gridCost = formData.gridMode ? {
        cells: formData.gridSize * formData.gridSize,
        maxRequests: formData.gridSize * formData.gridSize * 3,
        maxUSD: (formData.gridSize * formData.gridSize * 3 * 0.032).toFixed(2)
    } : null;

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

            {/* Grid Search Toggle */}
            <div className="mt-5 relative z-10">
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-3">
                    <div className="flex items-center gap-3">
                        <Grid3X3 className={`w-5 h-5 ${formData.gridMode ? 'text-amber-400' : 'text-slate-500'}`} />
                        <div>
                            <span className="text-sm font-bold text-white">Grid Search</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">Busca en zonas diferentes para encontrar leads que la búsqueda normal no alcanza</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {formData.gridMode && (
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Densidad:</label>
                                <select
                                    className="bg-[#2a2a2e] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white appearance-none"
                                    value={formData.gridSize}
                                    onChange={(e) => setFormData({ ...formData, gridSize: parseInt(e.target.value) })}
                                >
                                    <option value={3}>3×3 (9 celdas)</option>
                                    <option value={5}>5×5 (25 celdas)</option>
                                    <option value={7}>7×7 (49 celdas)</option>
                                </select>
                                <span className="text-[10px] font-bold text-amber-400">~${gridCost?.maxUSD} USD máx</span>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, gridMode: !formData.gridMode })}
                            className={`relative w-11 h-6 rounded-full transition-all ${formData.gridMode ? 'bg-amber-500' : 'bg-white/10'}`}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${formData.gridMode ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default SearchForm;
