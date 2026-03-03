import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AlertService from '../../../services/AlertService';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

/**
 * Hook: useVortexAnalysis
 * Owns Vortex enrichment activation, polling lifecycle, and status derivation.
 * Syncs completed/failed/skipped results back to the canonical lead state
 * via the setLead callback from useLeadData.
 */
const useVortexAnalysis = (lead, setLead, onLeadUpdate) => {
    const [isActivating, setIsActivating] = useState(false);
    const vortexToastIdRef = useRef(null);

    // Derived status flags
    const isProcessing = lead.enrichmentStatus === 'pending';
    const isCompleted = lead.enrichmentStatus === 'completed';
    const isFailed = lead.enrichmentStatus === 'failed';
    const isSkippedRentedLand = lead.enrichmentStatus === 'skipped_rented_land';

    // Polling for vortex status when lead is pending
    useEffect(() => {
        let interval;
        if (lead.enrichmentStatus === 'pending') {
            interval = setInterval(async () => {
                try {
                    const { data } = await api.get(`/vortex/status/${lead._id}`);
                    if (data.status === 'completed') {
                        // Re-fetch the full lead to get enriched data (tech_stack, seo_audit, etc.)
                        const { data: updatedLead } = await api.get(`/leads/${lead._id}`);
                        setLead(updatedLead);
                        if (onLeadUpdate) onLeadUpdate(updatedLead);
                        clearInterval(interval);

                        if (vortexToastIdRef.current) {
                            AlertService.successUpdate(vortexToastIdRef.current, '¡Auditoría Técnica Completada!');
                            vortexToastIdRef.current = null;
                        } else {
                            AlertService.success('Vortex Audit completado en 2do plano');
                        }
                    } else if (data.status === 'failed') {
                        setLead(prev => ({ ...prev, enrichmentStatus: 'failed', enrichmentError: data.error }));
                        clearInterval(interval);

                        if (vortexToastIdRef.current) {
                            AlertService.errorUpdate(vortexToastIdRef.current, 'Vortex Audit falló o fue bloqueado.');
                            vortexToastIdRef.current = null;
                        }
                    } else if (data.status === 'skipped_rented_land') {
                        setLead(prev => ({ ...prev, enrichmentStatus: 'skipped_rented_land' }));
                        clearInterval(interval);

                        if (vortexToastIdRef.current) {
                            AlertService.errorUpdate(vortexToastIdRef.current, 'Auditoría omitida (Tierra Alquilada).');
                            vortexToastIdRef.current = null;
                        }
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [lead.enrichmentStatus, lead._id]);

    const handleActivateVortex = async () => {
        setIsActivating(true);

        const tid = AlertService.loading('Infiltrando Vortex Engine. Analizando Infraestructura...');
        vortexToastIdRef.current = tid;

        try {
            await api.post(`/vortex/enrich/${lead._id}`);
            // Update canonical lead state → triggers polling useEffect
            setLead(prev => ({ ...prev, enrichmentStatus: 'pending' }));
            if (onLeadUpdate) onLeadUpdate({ ...lead, enrichmentStatus: 'pending' });
        } catch (err) {
            AlertService.errorUpdate(tid, 'Fallo al iniciar protocolo Vortex.');
            vortexToastIdRef.current = null;
        } finally {
            setIsActivating(false);
        }
    };

    return {
        isActivating,
        isProcessing,
        isCompleted,
        isFailed,
        isSkippedRentedLand,
        handleActivateVortex,
    };
};

export default useVortexAnalysis;
