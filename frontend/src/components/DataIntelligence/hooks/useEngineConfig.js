import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

/**
 * Hook: useEngineConfig
 * Owns engine config state (model, temperature, tokens), API keys form state,
 * and the save logic with masked-key blindaje.
 *
 * SECURITY: Before PUT, strips any key field that still contains the masked
 * placeholder (e.g. "sk-p...9x2A" or "***") to prevent overwriting
 * encrypted vault values with a display-only mask.
 */
const useEngineConfig = () => {
    const [config, setConfig] = useState(null);
    const [isFetching, setIsFetching] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [engineForm, setEngineForm] = useState({ model_name: 'gpt-4o-mini', temperature: 0.7, max_tokens: 1500 });
    const [keysForm, setKeysForm] = useState({ openai_key: '', google_places_key: '' });

    const fetchConfig = useCallback(async () => {
        try {
            const { data } = await api.get('/intelligence/config');
            setConfig(data);
            setEngineForm({
                model_name: data.ai_engine?.model_name || 'gpt-4o-mini',
                temperature: data.ai_engine?.temperature ?? 0.7,
                max_tokens: data.ai_engine?.max_tokens || 1500,
            });
            setKeysForm({
                openai_key: data.api_keys?.openai_key || '',
                google_places_key: data.api_keys?.google_places_key || '',
            });
        } catch (err) {
            console.error('[Intelligence] Config fetch error:', err.message);
        } finally {
            setIsFetching(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    /**
     * isMaskedValue — returns true if the value is a masked display string
     * that should NEVER be sent back to the backend.
     */
    const isMaskedValue = (value) => {
        if (!value || typeof value !== 'string') return true; // empty = don't overwrite
        if (value.includes('***')) return true;
        // Matches patterns like "sk-p...9x2A" or "AIza...7s"
        if (/^.{2,6}\.\.\..{2,6}$/.test(value)) return true;
        return false;
    };

    const saveConfig = async () => {
        setIsSaving(true);
        try {
            // Build safe payload — strip masked keys
            const safeKeys = {};
            if (!isMaskedValue(keysForm.openai_key)) {
                safeKeys.openai_key = keysForm.openai_key;
            }
            if (!isMaskedValue(keysForm.google_places_key)) {
                safeKeys.google_places_key = keysForm.google_places_key;
            }

            const payload = {
                ai_engine: engineForm,
                api_keys: safeKeys,
            };

            const res = await api.put('/intelligence/config', payload);
            if (res.data.success) {
                toast.success('Configuración guardada en la Bóveda');
                await fetchConfig();
            }
        } catch (err) {
            toast.error('Error guardando: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSaving(false);
        }
    };

    const updateEngineForm = (updater) => {
        setEngineForm(prev => typeof updater === 'function' ? updater(prev) : { ...prev, ...updater });
    };

    const updateKeysForm = (updater) => {
        setKeysForm(prev => typeof updater === 'function' ? updater(prev) : { ...prev, ...updater });
    };

    return {
        config,
        isFetching,
        isSaving,
        engineForm,
        keysForm,
        updateEngineForm,
        updateKeysForm,
        saveConfig,
    };
};

export default useEngineConfig;
