import { useState, useEffect, useCallback } from 'react';
import { getAgencyContext, saveAgencyContext } from '../../../services/api';
import AlertService from '../../../services/AlertService';

/**
 * Hook: useSystemSettings
 * Manages the agency identity form state and all backend communication.
 * Uses the global api.js service — zero local axios, zero hardcoded URLs.
 */
const useSystemSettings = () => {
    const [formData, setFormData] = useState({
        agencyContext: '',
        senderName: '',
        agencyName: '',
        languageTone: 'AUTO_DETECT',
    });
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch initial settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await getAgencyContext();
                if (data.success) {
                    setFormData(prev => ({
                        ...prev,
                        agencyContext: data.context || '',
                        senderName: data.senderName || '',
                        agencyName: data.agencyName || '',
                        languageTone: data.languageTone || 'AUTO_DETECT',
                    }));
                }
            } catch (err) {
                console.error('Error loading agency context:', err);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const saveSettings = useCallback(async () => {
        setIsSaving(true);

        const saveReq = saveAgencyContext({
            context: formData.agencyContext,
            senderName: formData.senderName,
            agencyName: formData.agencyName,
            languageTone: formData.languageTone,
        });

        try {
            await AlertService.promise(saveReq, {
                loading: 'Actualizando núcleo del sistema...',
                success: 'Códice de la Agencia guardado exitosamente.',
                error: 'Error al actualizar el contexto.',
            });
        } finally {
            setIsSaving(false);
        }
    }, [formData]);

    return {
        formData,
        isLoadingData,
        isSaving,
        handleChange,
        saveSettings,
    };
};

export default useSystemSettings;
