import React, { useCallback, useState } from 'react';
import { Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Hooks
import useLiveSearch from './hooks/useLiveSearch';
import useCampaignHistory from './hooks/useCampaignHistory';
import useModal from '../../hooks/useModal';

// Components
import SearchForm from '../../components/SearchForm/SearchForm';
import LiveConsole from './components/LiveConsole';
import HistoricalConsole from './components/HistoricalConsole';
import HistoryList from './components/HistoryList';
import { DeleteConfirmationModal } from '../../components/Modals';

/**
 * AcquisitionHub — The Orchestrator
 * Connects the two separate brains (useLiveSearch, useCampaignHistory) 
 * with the visual muscle (Pure Components) and global modals.
 */
const AcquisitionHub = () => {
    const navigate = useNavigate();

    // -- Brain 1: Campaign History --
    const {
        filteredHistory,
        searchTerm,
        activeHistoryLogs,
        activeHistoryStats,
        fetchHistory,
        handleFilterChange,
        fetchHistoricalLogs,
        closeHistoricalLogs,
        purgeCampaign
    } = useCampaignHistory();

    // -- Brain 2: Live Search --
    // Passes `fetchHistory` so LiveSearch can update the sibling domain when a search finishes.
    const {
        isLoading,
        logs,
        totalCost,
        handleSearch
    } = useLiveSearch(fetchHistory);

    // -- Modal Management --
    const deleteModal = useModal();
    const [campaignToDelete, setCampaignToDelete] = useState(null);

    // ==== Stable Callback Handlers for React.memo (HistoryListItem) ==== //

    const handleHistoryClick = useCallback((id) => {
        fetchHistoricalLogs(id);
    }, [fetchHistoricalLogs]);

    const handleDeleteClick = useCallback((id) => {
        setCampaignToDelete(id);
        deleteModal.open();
    }, [deleteModal]);

    const handleOpenDashboard = useCallback((id) => {
        navigate(`/dashboard?campaignId=${id}`);
    }, [navigate]);

    const confirmDelete = useCallback(() => {
        if (!campaignToDelete) return;
        
        purgeCampaign(campaignToDelete).then(() => {
            deleteModal.close();
        });
    }, [campaignToDelete, purgeCampaign, deleteModal]);


    return (
        <div className="min-h-screen bg-app-bg text-slate-200 p-10">
            <header className="mb-12">
                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                    <Database className="w-8 h-8 text-indigo-500" />
                    Acquisition Hub
                </h1>
                <p className="text-slate-400 mt-2">Lanza agentes de recolección geolocalizada y coordina campañas pasadas.</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Visual Muscle Area */}
                <div className="xl:col-span-2 space-y-8">
                    
                    {/* 1. Core Input Form (Already Refactored) */}
                    <SearchForm onSearch={handleSearch} isLoading={isLoading} />

                    {/* 2. Live Console (Self-contained scroll) */}
                    <LiveConsole 
                        logs={logs} 
                        isLoading={isLoading} 
                        totalCost={totalCost} 
                    />

                    {/* 3. Historical Console (Self-contained scroll) */}
                    {!isLoading && activeHistoryLogs && (
                        <HistoricalConsole 
                            logs={activeHistoryLogs} 
                            stats={activeHistoryStats} 
                            onClose={closeHistoricalLogs} 
                        />
                    )}
                    
                </div>

                {/* Sidebar History Area */}
                <div className="xl:col-span-1">
                    <HistoryList 
                        filteredHistory={filteredHistory}
                        searchTerm={searchTerm}
                        onFilter={handleFilterChange}
                        onHistoryClick={handleHistoryClick}
                        onDeleteClick={handleDeleteClick}
                        onOpenDashboard={handleOpenDashboard}
                    />
                </div>

                {/* Global Modals */}
                <DeleteConfirmationModal
                    isOpen={deleteModal.isOpen}
                    onClose={deleteModal.close}
                    onConfirm={confirmDelete}
                    customMessage="Todos los prospectos y datos de la campaña web serán destruidos. Esta acción es irreversible."
                />
            </div>
        </div>
    );
};

export default AcquisitionHub;
