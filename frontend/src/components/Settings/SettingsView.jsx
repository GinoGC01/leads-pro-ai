import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash, User, Building2, MessageSquare, Briefcase, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAgencySettings, updateAgencySettings } from '../../services/api';
import RagKnowledgeManager from './RagKnowledgeManager';

const SettingsView = () => {
    const [settings, setSettings] = useState({
        sales_rep_name: '',
        agency_name: '',
        linguistic_behavior: 'AUTO',
        value_proposition: '',
        core_services: []
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const response = await getAgencySettings();
            if (response.data && response.data.success) {
                setSettings({
                    sales_rep_name: response.data.sales_rep_name || '',
                    agency_name: response.data.agency_name || '',
                    linguistic_behavior: response.data.linguistic_behavior || 'AUTO',
                    value_proposition: response.data.value_proposition || '',
                    core_services: response.data.core_services || []
                });
            }
        } catch (error) {
            console.error("Error loading agency settings:", error);
            toast.error("Failed to load Agency Settings.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const savePromise = updateAgencySettings(settings);
        
        toast.promise(savePromise, {
            loading: 'Saving Configuration...',
            success: 'Settings saved successfully!',
            error: 'Failed to save Settings.'
        });

        try {
            await savePromise;
        } catch (error) {
            console.error("Error saving agency settings:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const addService = () => {
        setSettings(prev => ({
            ...prev,
            core_services: [
                ...prev.core_services, 
                { name: '', description: '', ideal_for: '' }
            ]
        }));
    };

    const removeService = (index) => {
        setSettings(prev => ({
            ...prev,
            core_services: prev.core_services.filter((_, i) => i !== index)
        }));
    };

    const updateService = (index, field, value) => {
        setSettings(prev => {
            const newServices = [...prev.core_services];
            newServices[index][field] = value;
            return { ...prev, core_services: newServices };
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-10 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Agency Ecosystem</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your AI Agent identity, commercial offer, and core knowledge base.</p>
            </div>

            {/* Global Save Button */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>

            {/* Card 1: Identity & Tone */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <User size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Identity & Tone</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            Sales Rep Name
                        </label>
                        <input
                            type="text"
                            value={settings.sales_rep_name}
                            onChange={(e) => handleChange('sales_rep_name', e.target.value)}
                            placeholder="e.g. Mario"
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            Agency Name
                        </label>
                        <input
                            type="text"
                            value={settings.agency_name}
                            onChange={(e) => handleChange('agency_name', e.target.value)}
                            placeholder="e.g. Leads Pro AI"
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>
                    <div className="space-y-3 md:col-span-2 mt-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                            <MessageSquare size={16} className="text-slate-400" />
                            Linguistic Behavior
                        </label>
                        <div className="flex gap-4">
                            {['AUTO', 'LATAM', 'EXPORT'].map((option) => (
                                <label key={option} className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="radio"
                                            name="linguistic_behavior"
                                            value={option}
                                            checked={settings.linguistic_behavior === option}
                                            onChange={(e) => handleChange('linguistic_behavior', e.target.value)}
                                            className="peer sr-only"
                                        />
                                        <div className="h-5 w-5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 peer-checked:border-indigo-500 peer-checked:border-[6px] transition-all"></div>
                                    </div>
                                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {option === 'AUTO' ? 'Auto Detect' : option === 'LATAM' ? 'Force LATAM (Voseo/Tuteo)' : 'Force EXPORT (Neutral/Spain)'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 2: Commercial Offer */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Briefcase size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Commercial Offer</h2>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Value Proposition</label>
                        <textarea
                            value={settings.value_proposition}
                            onChange={(e) => handleChange('value_proposition', e.target.value)}
                            placeholder="Describe your agency's core value proposition..."
                            className="w-full h-24 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Core Services</label>
                            <button
                                onClick={addService}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-md transition-colors border border-slate-200 dark:border-slate-700/50"
                            >
                                <Plus size={14} />
                                <span className="text-xs font-semibold">Add New Service</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {settings.core_services.length === 0 ? (
                                <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-xl text-slate-500 dark:text-slate-400 text-sm">
                                    No core services defined. Click "Add New Service" to start.
                                </div>
                            ) : (
                                settings.core_services.map((service, index) => (
                                    <div key={index} className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl relative group transition-all hover:border-indigo-500/30">
                                        <button
                                            onClick={() => removeService(index)}
                                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                                            title="Remove Service"
                                        >
                                            <Trash size={16} />
                                        </button>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Service Name</label>
                                                <input
                                                    type="text"
                                                    value={service.name}
                                                    onChange={(e) => updateService(index, 'name', e.target.value)}
                                                    placeholder="e.g. B2B Lead Generation"
                                                    className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ideal For</label>
                                                <input
                                                    type="text"
                                                    value={service.ideal_for}
                                                    onChange={(e) => updateService(index, 'ideal_for', e.target.value)}
                                                    placeholder="e.g. SaaS companies >$1M ARR"
                                                    className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                                />
                                            </div>
                                            <div className="space-y-1.5 md:col-span-2">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                                                <input
                                                    type="text"
                                                    value={service.description}
                                                    onChange={(e) => updateService(index, 'description', e.target.value)}
                                                    placeholder="Detail what this service includes and how it is delivered."
                                                    className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 3: RAG Knowledge Base */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Database size={20} />
                    </div>
                    <div className="flex items-center justify-between w-full">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Knowledge Base (RAG)</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Upload internal documents to fuel MARIO's deep knowledge.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <RagKnowledgeManager />
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
