import React, { useState, useCallback, useEffect } from 'react';

// Custom Hooks (all brain)
import useTableProcessing from './hooks/useTableProcessing';
import useRowSelection from './hooks/useRowSelection';
import useLeadMutations from './hooks/useLeadMutations';

// Presentational Components (zero API calls)
import FilterToolbar from './components/FilterToolbar';
import BulkActionBar from './components/BulkActionBar';
import TableHeader from './components/TableHeader';
import LeadRow from './components/LeadRow';

// External Modals (pre-existing)
import DeleteConfirmationModal from '../DeleteConfirmationModal';
import StatusUpdateModal from '../StatusUpdateModal';

/**
 * LeadsTable — Thin Orchestrator
 * Wires 3 hooks → 4 components + 2 modals.
 * Owns only localLeads mirroring the incoming prop.
 * ALL handlers passed to LeadRow are useCallback-stable
 * to preserve React.memo referential equality.
 */
const LeadsTable = ({ leads, onRowClick, onStatusChange }) => {
    const [localLeads, setLocalLeads] = useState(leads || []);

    useEffect(() => {
        setLocalLeads(leads);
    }, [leads]);

    // 1. Math — filters, sorts, counts
    const { processedLeads, filters, sortConfig, counts, toggleFilter, setPerfFilter, requestSort } =
        useTableProcessing(localLeads);

    // 2. Selection — checkboxes
    const { selectedIds, toggleSelection, selectAll, clearSelection } =
        useRowSelection(leads);

    // 3. Mutations — network + modals
    const {
        isDeleting, isDeleteModalOpen, statusModal,
        openDeleteModal, closeDeleteModal, handleBulkDelete,
        openStatusModal, closeStatusModal, confirmStatusChange
    } = useLeadMutations({
        onLocalLeadsUpdate: setLocalLeads,
        onParentStatusChange: onStatusChange,
        clearSelection
    });

    // ─── useCallback-wrapped handlers for LeadRow (React.memo stable) ───
    const handleToggleSelect = useCallback((id) => {
        toggleSelection(id);
    }, [toggleSelection]);

    const handleStatusChange = useCallback((leadId, newStatus) => {
        openStatusModal(leadId, newStatus);
    }, [openStatusModal]);

    const handleRowClick = useCallback((lead) => {
        if (onRowClick) onRowClick(lead);
    }, [onRowClick]);

    const handleSelectAll = useCallback(() => {
        selectAll(processedLeads);
    }, [selectAll, processedLeads]);

    if (!localLeads || localLeads.length === 0) return null;

    return (
        <>
            <div className="bg-app-card rounded-3xl border border-white/5 overflow-hidden relative">
                <BulkActionBar
                    selectedCount={selectedIds.length}
                    onClear={clearSelection}
                    onDelete={openDeleteModal}
                />

                <FilterToolbar
                    filters={filters}
                    counts={counts}
                    onToggle={toggleFilter}
                    onPerfFilter={setPerfFilter}
                    totalShowing={processedLeads.length}
                    totalLeads={localLeads.length}
                />

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <TableHeader
                            sortConfig={sortConfig}
                            onSort={requestSort}
                            onSelectAll={handleSelectAll}
                            isAllSelected={selectedIds.length === processedLeads.length && processedLeads.length > 0}
                        />
                        <tbody className="divide-y divide-white/5">
                            {processedLeads.map((lead) => (
                                <LeadRow
                                    key={lead._id}
                                    lead={lead}
                                    isSelected={selectedIds.includes(lead._id)}
                                    onToggleSelect={() => handleToggleSelect(lead._id)}
                                    onStatusChange={(newStatus) => handleStatusChange(lead._id, newStatus)}
                                    onClickRow={() => handleRowClick(lead)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={() => handleBulkDelete(selectedIds)}
                count={selectedIds.length}
                isDeleting={isDeleting}
            />
            <StatusUpdateModal
                isOpen={statusModal.isOpen}
                newStatus={statusModal.newStatus}
                onClose={closeStatusModal}
                onConfirm={confirmStatusChange}
            />
        </>
    );
};

export default LeadsTable;
