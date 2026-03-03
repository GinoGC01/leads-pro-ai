import { useState, useEffect, useMemo, useCallback } from 'react';
import { getHistory, getHistoryItem, deleteHistory } from '../../../services/api';
import AlertService from '../../../services/AlertService';

/**
 * Hook: useCampaignHistory
 * Exclusive domain: Past Campaigns (History).
 * Manages fetching the history list, filtering, opening historical logs,
 * and deleting campaigns.
 */
const useCampaignHistory = () => {
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeHistoryLogs, setActiveHistoryLogs] = useState(null);
    const [activeHistoryStats, setActiveHistoryStats] = useState(null);

    const fetchHistory = useCallback(async () => {
        try {
            const { data } = await getHistory();
            setHistory(data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Derived State: Filtered history using useMemo
    const filteredHistory = useMemo(() => {
        if (!searchTerm.trim()) return history;

        const query = searchTerm.toLowerCase();
        return history.filter(item => {
            const keywordMatch = item.keyword?.toLowerCase().includes(query);
            const locationMatch = item.location?.toLowerCase().includes(query);
            const costMatch = (item.totalCost || 0).toString().includes(query);
            const dateMatch = new Date(item.createdAt).toLocaleDateString().includes(query);

            return keywordMatch || locationMatch || costMatch || dateMatch;
        });
    }, [history, searchTerm]);

    const handleFilterChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    const fetchHistoricalLogs = useCallback(async (searchId) => {
        try {
            const { data } = await getHistoryItem(searchId);
            if (data) {
                setActiveHistoryLogs(data.logs || []);
                setActiveHistoryStats({
                    keyword: data.keyword,
                    results: data.resultsCount,
                    cost: data.totalCost || 0
                });
            }
        } catch (error) {
            console.error('Error fetching history logs:', error);
            AlertService.error("No se pudieron cargar los logs de esta campaña");
        }
    }, []);

    const closeHistoricalLogs = useCallback(() => {
        setActiveHistoryLogs(null);
        setActiveHistoryStats(null);
    }, []);

    const purgeCampaign = useCallback(async (searchId) => {
        const deleteReq = deleteHistory(searchId);

        return AlertService.promise(deleteReq, {
            loading: 'Eliminando campaña web...',
            success: 'Campaña eliminada permanentemente',
            error: 'Error al purgar la campaña'
        }).then(() => {
            fetchHistory();
        });
    }, [fetchHistory]);

    return {
        history,
        filteredHistory,
        searchTerm,
        activeHistoryLogs,
        activeHistoryStats,
        fetchHistory,
        handleFilterChange,
        fetchHistoricalLogs,
        closeHistoricalLogs,
        purgeCampaign
    };
};

export default useCampaignHistory;
