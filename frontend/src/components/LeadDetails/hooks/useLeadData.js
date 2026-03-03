import { useState } from 'react';
import axios from 'axios';
import AlertService from '../../../services/AlertService';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

/**
 * Hook: useLeadData
 * Owns the canonical lead state, CRM status updates, and provides
 * setLead so sibling hooks (Vortex, Mario) can push real-time mutations.
 */
const useLeadData = (initialLead, onLeadUpdate) => {
    const [lead, setLead] = useState(initialLead);
    const [error, setError] = useState(null);
    const [statusModal, setStatusModal] = useState({ isOpen: false, newStatus: null });

    const confirmStatusUpdate = async (note) => {
        const newStatus = statusModal.newStatus;
        setStatusModal({ isOpen: false, newStatus: null });

        const updateRequest = api.patch(`/leads/${lead._id}/status`, { status: newStatus, note });

        AlertService.promise(
            updateRequest,
            {
                loading: 'Actualizando CRM...',
                success: 'Estado del prospecto actualizado',
                error: 'Error al actualizar el CRM'
            }
        ).then(({ data }) => {
            setLead(data);
            if (onLeadUpdate) onLeadUpdate(data);
        });
    };

    return {
        lead,
        setLead,       // Exposed so useVortexAnalysis & useMarioStrategy can sync state
        error,
        setError,
        statusModal,
        setStatusModal,
        confirmStatusUpdate,
    };
};

export default useLeadData;
