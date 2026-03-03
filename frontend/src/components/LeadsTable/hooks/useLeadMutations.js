import { useState, useCallback } from 'react';
import { updateLeadStatus, bulkDeleteLeads } from '../../../services/api';
import AlertService from '../../../services/AlertService';
import useModal from '../../../hooks/useModal';

/**
 * Hook: useLeadMutations
 * Isolates all network calls (status update, bulk delete) and their
 * associated modal state from the rendering layer.
 * Uses the standardized useModal hook for state management.
 */
const useLeadMutations = ({ onLocalLeadsUpdate, onParentStatusChange, clearSelection }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const deleteModal = useModal();
    const statusModal = useModal();

    // --- Bulk Delete ---
    const handleBulkDelete = useCallback(async (selectedIds) => {
        setIsDeleting(true);
        const deleteReq = bulkDeleteLeads(selectedIds);

        AlertService.promise(deleteReq, {
            loading: `Eliminando ${selectedIds.length} leads...`,
            success: 'Leads eliminados permanentemente',
            error: 'Error al purgar los leads seleccionados'
        }).then(() => {
            onLocalLeadsUpdate(prev => prev.filter(l => !selectedIds.includes(l._id)));
            clearSelection();
            deleteModal.closeModal();
        }).finally(() => {
            setIsDeleting(false);
        });
    }, [onLocalLeadsUpdate, clearSelection, deleteModal]);

    // --- Status Change ---
    const confirmStatusChange = useCallback(async (note) => {
        const { leadId, newStatus } = statusModal.data || {};
        statusModal.closeModal();

        const updateReq = updateLeadStatus(leadId, newStatus, note);

        AlertService.promise(updateReq, {
            loading: 'Actualizando estado en CRM...',
            success: 'Estado del lead actualizado',
            error: 'Error de sincronización con CRM'
        }).then(({ data }) => {
            onLocalLeadsUpdate(prev =>
                prev.map(l => l._id === leadId ? { ...l, status: data.status, interactionLogs: data.interactionLogs } : l)
            );
            if (onParentStatusChange) onParentStatusChange(leadId, data.status);
        });
    }, [statusModal, onLocalLeadsUpdate, onParentStatusChange]);

    return {
        isDeleting,
        deleteModal,
        statusModal,
        handleBulkDelete,
        confirmStatusChange,
    };
};

export default useLeadMutations;
