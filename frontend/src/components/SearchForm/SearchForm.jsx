import React from 'react';
import { Search, MapPin, Navigation, Globe, Zap } from 'lucide-react';

// Custom Hook (all brain)
import useSearchForm from './hooks/useSearchForm';

// Atomic Components (all muscle)
import FormInput from './components/FormInput';
import FormSelect from './components/FormSelect';
import GridSettingsPanel from './components/GridSettingsPanel';
import SubmitButton from './components/SubmitButton';

/**
 * Dropdown options — extracted from JSX for readability.
 */
const RADIUS_OPTIONS = [
    { value: 1000, label: '1 km (Hyperlocal)' },
    { value: 5000, label: '5 km (Local)' },
    { value: 10000, label: '10 km (City)' },
    { value: 50000, label: '50 km (Metro)' },
];

const COUNTRY_OPTIONS = [
    { value: '',   label: 'Global' },
    { value: 'AR', label: 'Argentina' },
    { value: 'ES', label: 'España' },
    { value: 'MX', label: 'México' },
    { value: 'US', label: 'Estados Unidos' },
    { value: 'CO', label: 'Colombia' },
    { value: 'CL', label: 'Chile' },
    { value: 'PE', label: 'Perú' },
    { value: 'UY', label: 'Uruguay' },
];

/**
 * SearchForm — Thin Orchestrator
 * Wires 1 hook → 4 atomic components.
 * Zero state management, zero math — purely structural.
 */
const SearchForm = ({ onSearch, isLoading }) => {
    const { formData, gridCost, handleChange, toggleGridMode, handleSubmit } = useSearchForm();

    return (
        <form onSubmit={(e) => handleSubmit(e, onSearch)} className="bg-app-card p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
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
                <FormInput
                    icon={Search}
                    name="keyword"
                    value={formData.keyword}
                    onChange={handleChange}
                    placeholder="Ej: Dentistas, Abogados..."
                    required
                />
                <FormInput
                    icon={MapPin}
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Ciudad o Estado..."
                    required
                />
                <FormSelect
                    icon={Navigation}
                    name="radius"
                    label="Radio"
                    value={formData.radius}
                    onChange={handleChange}
                    options={RADIUS_OPTIONS}
                />
                <FormSelect
                    icon={Globe}
                    name="countryCode"
                    label="País"
                    value={formData.countryCode}
                    onChange={handleChange}
                    options={COUNTRY_OPTIONS}
                />
                <div className="flex items-end">
                    <SubmitButton isLoading={isLoading} />
                </div>
            </div>

            <GridSettingsPanel
                gridMode={formData.gridMode}
                gridSize={formData.gridSize}
                gridCost={gridCost}
                onToggle={toggleGridMode}
                onChangeSize={handleChange}
            />
        </form>
    );
};

export default SearchForm;
