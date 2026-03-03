import { useState, useCallback } from 'react';
import { updateLeadStatus, bulkDeleteLeads } from '../../../services/api';
import AlertService from '../../../services/AlertService';

/**
 * Hook: useLeadMutations
 * Isolates all network calls (status update, bulk delete) and their
 * associated modal state from the rendering layer.
 */
const useLeadMutations = ({ onLocalLeadsUpdate, onParentStatusChange, clearSelection }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, leadId: null, newStatus: null });

    // --- Bulk Delete ---
    const openDeleteModal = useCallback(() => setIsDeleteModalOpen(true), []);
    const closeDeleteModal = useCallback(() => setIsDeleteModalOpen(false), []);

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
            setIsDeleteModalOpen(false);
        }).finally(() => {
            setIsDeleting(false);
        });
    }, [onLocalLeadsUpdate, clearSelection]);

    // --- Status Change ---
    const openStatusModal = useCallback((leadId, newStatus) => {
        setStatusModal({ isOpen: true, leadId, newStatus });
    }, []);

    const closeStatusModal = useCallback(() => {
        setStatusModal({ isOpen: false, leadId: null, newStatus: null });
    }, []);

    const confirmStatusChange = useCallback(async (note) => {
        const { leadId, newStatus } = statusModal;
        setStatusModal({ isOpen: false, leadId: null, newStatus: null });

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
        isDeleteModalOpen,
        statusModal,
        openDeleteModal,
        closeDeleteModal,
        handleBulkDelete,
        openStatusModal,
        closeStatusModal,
        confirmStatusChange,
    };
};

export default useLeadMutations;
