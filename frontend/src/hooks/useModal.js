import { useState, useCallback } from 'react';

/**
 * Hook: useModal
 * Standardized state controller for any modal.
 * Eliminates scattered isOpen/setIsOpen/payload states across components.
 *
 * Usage:
 *   const deleteModal = useModal();
 *   deleteModal.openModal({ leadId: '123' });
 *   <Modal isOpen={deleteModal.isOpen} data={deleteModal.data} onClose={deleteModal.closeModal} />
 */
export const useModal = (initialData = null) => {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState(initialData);

    const openModal = useCallback((payload = null) => {
        setData(payload);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setTimeout(() => setData(initialData), 200);
    }, [initialData]);

    return { isOpen, data, openModal, closeModal };
};

export default useModal;
