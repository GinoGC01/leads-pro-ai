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
 * via the setLead callback from useLeadData. Supports Two-Tier pipeline.
 */
const useVortexAnalysis = (lead, setLead, onLeadUpdate) => {
    const [isActivating, setIsActivating] = useState(false);
    const [activeJobId, setActiveJobId] = useState(null);
    const vortexToastIdRef = useRef(null);

    // Derived status flags (Tier 1)
    const isDisqualified = lead.vortex_status === 'disqualified';
    const isProcessing = lead.enrichmentStatus === 'pending';
    const isCompleted = !isDisqualified && (lead.enrichmentStatus === 'completed' || ['base_completed', 'vision_processing', 'vision_completed'].includes(lead.vortex_status));
    const isFailed = lead.enrichmentStatus === 'failed' || lead.vortex_status === 'failed';
    const isSkippedRentedLand = lead.enrichmentStatus === 'skipped_rented_land';

    // Derived status flags (Tier 2 - Deep Vision)
    const isVisionPending = lead.vortex_status === 'base_completed';
    const isVisionProcessing = lead.vortex_status === 'vision_processing';
    const isVisionCompleted = lead.vortex_status === 'vision_completed';

    // Polling for vortex status when lead is processing
    // CRITICAL: Polling is SUPPRESSED when activeJobId exists —
    // in that case, SSE is the sole source of truth.
    useEffect(() => {
        let interval;
        const needsPolling = lead.enrichmentStatus === 'pending' || lead.vortex_status === 'vision_processing';

        // If SSE stream is active, do NOT poll
        if (activeJobId) return;

        if (needsPolling) {
            interval = setInterval(async () => {
                try {
                    const { data } = await api.get(`/vortex/status/${lead._id}`);
                    
                    // Nivel 2: Deep Vision Polling
                    if (lead.vortex_status === 'vision_processing') {
                        if (data.vortex_status === 'vision_completed' || data.vortex_status === 'failed') {
                            const { data: updatedLead } = await api.get(`/leads/${lead._id}`);
                            setLead(updatedLead);
                            if (onLeadUpdate) onLeadUpdate(updatedLead);
                            clearInterval(interval);
                            
                            if (data.vortex_status === 'vision_completed') {
                                AlertService.success('¡Auditoría UX/UI Deep Vision completada!');
                            } else {
                                AlertService.error('Deep Vision falló o fue cancelado.');
                            }
                        }
                        return; // Exit here for vision processing
                    }

                    // Nivel 1: Base Enrichment Polling
                    if (data.status === 'completed' || data.vortex_status === 'base_completed') {
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
                    } else if (data.status === 'failed' || data.vortex_status === 'failed') {
                        setLead(prev => ({ ...prev, enrichmentStatus: 'failed', vortex_status: 'failed', enrichmentError: data.error }));
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
    }, [lead.enrichmentStatus, lead.vortex_status, lead._id, activeJobId]);

    /**
     * Callback fired by VortexLiveConsole when the SSE stream terminates.
     * Refetches lead data and clears the activeJobId to allow polling fallback.
     */
    const handleStreamComplete = async () => {
        setActiveJobId(null);
        try {
            const { data: updatedLead } = await api.get(`/leads/${lead._id}`);
            setLead(updatedLead);
            if (onLeadUpdate) onLeadUpdate(updatedLead);

            if (updatedLead.vortex_status === 'vision_completed') {
                AlertService.success('¡Auditoría UX/UI Deep Vision completada!');
            } else if (updatedLead.vortex_status === 'base_completed' || updatedLead.enrichmentStatus === 'completed') {
                if (vortexToastIdRef.current) {
                    AlertService.successUpdate(vortexToastIdRef.current, '¡Auditoría Técnica Completada!');
                    vortexToastIdRef.current = null;
                } else {
                    AlertService.success('Vortex Audit completado.');
                }
            } else if (updatedLead.vortex_status === 'failed' || updatedLead.enrichmentStatus === 'failed') {
                AlertService.error('Vortex falló o fue bloqueado.');
            } else if (updatedLead.enrichmentStatus === 'skipped_rented_land') {
                if (vortexToastIdRef.current) {
                    AlertService.errorUpdate(vortexToastIdRef.current, 'Auditoría omitida (Tierra Alquilada).');
                    vortexToastIdRef.current = null;
                } else {
                    AlertService.error('Auditoría omitida (Tierra Alquilada).');
                }
            }
        } catch (err) {
            console.error('[useVortexAnalysis] Error refetching after stream:', err);
        }
    };

    const handleActivateVortex = async () => {
        setIsActivating(true);

        const tid = AlertService.loading('Infiltrando Vortex Engine. Analizando Infraestructura...');
        vortexToastIdRef.current = tid;

        try {
            const { data } = await api.post(`/vortex/enrich/${lead._id}`);
            if (data.jobId) setActiveJobId(data.jobId);
            
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

    const handleActivateDeepVision = async () => {
        try {
            const { data } = await api.post(`/vortex/deep-vision/${lead._id}`);
            if (data.jobId) setActiveJobId(data.jobId);

            setLead(prev => ({ ...prev, vortex_status: 'vision_processing' }));
            if (onLeadUpdate) onLeadUpdate({ ...lead, vortex_status: 'vision_processing' });
            AlertService.success('Activando Deep Vision Engine...');
        } catch (err) {
            if (err.response?.status === 409) {
                AlertService.error('Conflicto: Ya se está procesando este prospecto.');
                // Optimistically fix the state
                setLead(prev => ({ ...prev, vortex_status: err.response.data?.lead?.vortex_status || 'vision_processing' }));
            } else if (err.response?.status === 503) {
                AlertService.error('Servicio Inestable', 'Deep Vision está temporalmente inaccesible. Reintente.');
                setLead(prev => ({ ...prev, vortex_status: 'base_completed' })); // Rollback fallback
            } else {
                AlertService.error('Fallo de red al activar Deep Vision.');
            }
        }
    };

    const handleResetVortex = async () => {
        const tid = AlertService.loading('Purgando memoria y reiniciando Vortex...');
        vortexToastIdRef.current = tid;

        try {
            const { data } = await api.post(`/vortex/reset/${lead._id}`);
            if (data.jobId) setActiveJobId(data.jobId);

            // Optimistic update
            const resetState = { 
                vortex_status: 'pending', 
                enrichmentStatus: 'pending', 
                enrichmentError: null,
                base_metrics: null,
                vision_analysis: null,
                spider_verdict: null 
            };
            setLead(prev => ({ ...prev, ...resetState }));
            if (onLeadUpdate) onLeadUpdate({ ...lead, ...resetState });
        } catch (err) {
            AlertService.errorUpdate(tid, 'Fallo al resetear el lead. Reintente en unos segundos.');
            vortexToastIdRef.current = null;
        }
    };

    return {
        isActivating,
        isDisqualified,
        isProcessing,
        isCompleted,
        isFailed,
        isSkippedRentedLand,
        isVisionPending,
        isVisionProcessing,
        isVisionCompleted,
        handleActivateVortex,
        handleActivateDeepVision,
        handleResetVortex,
        activeJobId,
        handleStreamComplete
    };
};

export default useVortexAnalysis;
