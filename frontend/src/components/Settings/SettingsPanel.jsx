import React from 'react';

// Custom Hooks
import useSystemSettings from './hooks/useSystemSettings';
import useModal from '../../hooks/useModal';

// Presentational Components
import SettingsForm from './components/SettingsForm';
import { IdentityConfirmModal } from '../Modals';

/**
 * SettingsPanel — Thin Orchestrator
 * Wires useSystemSettings (data/network) + useModal (confirmation flow).
 * Zero state management, zero API calls — purely structural.
 */
const SettingsPanel = () => {
    const { formData, isLoadingData, isSaving, handleChange, saveSettings } = useSystemSettings();
    const confirmModal = useModal();

    const handleSaveRequest = (e) => {
        e.preventDefault();
        confirmModal.openModal();
    };

    const handleConfirmSave = async () => {
        try {
            await saveSettings();
            confirmModal.closeModal();
        } catch {
            // Error already handled by AlertService inside the hook
        }
    };

    if (isLoadingData) {
        return (
            <div className="p-10 max-w-5xl">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-10 max-w-5xl relative">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">System Settings</h1>
                <p className="text-slate-400 mt-2">Configure core operational rules and parameters for Leads Pro AI.</p>
            </div>

            <SettingsForm
                formData={formData}
                onChange={handleChange}
                onSubmitRequest={handleSaveRequest}
                isSaving={isSaving}
            />

            <IdentityConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={confirmModal.closeModal}
                onConfirm={handleConfirmSave}
                isLoading={isSaving}
            />
        </div>
    );
};

export default SettingsPanel;
