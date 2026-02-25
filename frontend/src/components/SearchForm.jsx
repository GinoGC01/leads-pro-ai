import React, { useState } from 'react';
import { Search, MapPin, Navigation, Globe } from 'lucide-react';

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
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Palabra Clave</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Ej: Abogados laborales"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={formData.keyword}
                            onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Ubicación</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Ciudad o Coordenadas"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Radio (metros)</label>
                    <div className="relative">
                        <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all appearance-none"
                            value={formData.radius}
                            onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                        >
                            <option value={1000}>1 km</option>
                            <option value={5000}>5 km</option>
                            <option value={10000}>10 km</option>
                            <option value={50000}>50 km</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">País (Sesgo)</label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all appearance-none"
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
                        className="cursor-pointer w-full bg-gradient-to-r from-indigo-600 to-indigo-900 hover:from-indigo-700 hover:to-primary-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                <span>Generar Leads Pro</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default SearchForm;
