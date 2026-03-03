import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchLeads, getHistoryItem } from '../../../services/api';
import AlertService from '../../../services/AlertService';

/**
 * Hook: useLiveSearch
 * Exclusive domain: Active scraping process.
 * Manages the launch of a new campaign, polling for progress logs,
 * and navigating to the dashboard upon completion.
 */
const useLiveSearch = (onSearchComplete) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentSearchId, setCurrentSearchId] = useState(null);
    const [logs, setLogs] = useState([]);
    const [totalCost, setTotalCost] = useState(0);
    const navigate = useNavigate();

    const handleSearch = useCallback(async (formData) => {
        setIsLoading(true);
        setLogs([{ message: '🚀 Iniciando motor de búsqueda Leads Pro AI...', type: 'info', timestamp: new Date() }]);
        setTotalCost(0);
        setCurrentSearchId(null);

        try {
            const { data } = await searchLeads(formData);
            if (data.success) {
                setCurrentSearchId(data.searchId);
                // Polling useEffect below takes over
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            AlertService.error('Error al realizar la búsqueda', msg);
            setIsLoading(false);
        }
    }, []);

    // Polling for progress logs & cost when a search is running
    useEffect(() => {
        let interval;
        if (isLoading && currentSearchId) {
            interval = setInterval(async () => {
                try {
                    const { data: historyItem } = await getHistoryItem(currentSearchId);
                    if (historyItem.logs) setLogs(historyItem.logs);
                    if (historyItem.totalCost) setTotalCost(historyItem.totalCost);

                    if (historyItem.status === 'completed') {
                        clearInterval(interval);
                        setIsLoading(false);
                        if (onSearchComplete) onSearchComplete(); // Re-fetch history in sibling domain
                        // Automatically redirect to prospective dashboard when done
                        navigate(`/dashboard?campaignId=${currentSearchId}`);
                    } else if (historyItem.status === 'failed') {
                        clearInterval(interval);
                        setIsLoading(false);
                        if (onSearchComplete) onSearchComplete();
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isLoading, currentSearchId, navigate, onSearchComplete]);

    return {
        isLoading,
        logs,
        totalCost,
        handleSearch
    };
};

export default useLiveSearch;
