import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchLeads, getHistory, getHistoryItem, deleteHistory } from '../services/api';
import AlertService from '../services/AlertService';

export default function useSearchView() {
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentSearchId, setCurrentSearchId] = useState(null);
    const [logs, setLogs] = useState([]);
    const [activeHistoryLogs, setActiveHistoryLogs] = useState(null);
    const [activeHistoryStats, setActiveHistoryStats] = useState(null);
    const [totalCost, setTotalCost] = useState(0);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [campaignToDelete, setCampaignToDelete] = useState(null);
    const navigate = useNavigate();
    const logEndRef = React.useRef(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data } = await getHistory();
            setHistory(data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const scrollToBottom = () => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

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
                        fetchHistory();
                        // Automatically redirect to prospective dashboard when done
                        navigate(`/dashboard?campaignId=${currentSearchId}`);
                    } else if (historyItem.status === 'failed') {
                        clearInterval(interval);
                        setIsLoading(false);
                        fetchHistory();
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isLoading, currentSearchId, navigate]);

    // Filtered history using useMemo
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

    const handleSearch = async (formData) => {
        setIsLoading(true);
        setLogs([{ message: '🚀 Iniciando motor de búsqueda Leads Pro AI...', type: 'info', timestamp: new Date() }]);
        setTotalCost(0);
        setCurrentSearchId(null);

        try {
            const { data } = await searchLeads(formData);
            if (data.success) {
                setCurrentSearchId(data.searchId);
                // Polling useEffect takes over
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            AlertService.error('Error al realizar la búsqueda', msg);
            setIsLoading(false);
        }
    };

    const handleDeleteHistory = async (e, searchId) => {
        e.stopPropagation();
        setCampaignToDelete(searchId);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteCampaign = async () => {
        if (!campaignToDelete) return;

        const deleteReq = deleteHistory(campaignToDelete);

        AlertService.promise(
            deleteReq,
            {
                loading: 'Eliminando campaña web...',
                success: 'Campaña eliminada permanentemente',
                error: 'Error al purgar la campaña'
            }
        ).then(() => {
            fetchHistory();
            setIsDeleteModalOpen(false);
            setCampaignToDelete(null);
        }).catch(() => {
            setIsDeleteModalOpen(false);
            setCampaignToDelete(null);
        });
    };

    const handleHistoryClick = async (searchId) => {
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
    };

    const openInDashboard = (e, searchId) => {
        e.stopPropagation(); // prevent triggering the history log fetch
        navigate(`/dashboard?campaignId=${searchId}`);
    };

    const handlerFilter = (e) => {
        setSearchTerm(e.target.value);
    }

    return {
        history,
        searchTerm,
        isLoading,
        currentSearchId,
        logs,
        activeHistoryLogs,
        activeHistoryStats,
        totalCost,
        isDeleteModalOpen,
        campaignToDelete,
        navigate,
        logEndRef,
        fetchHistory,
        scrollToBottom,
        filteredHistory,
        handleSearch,
        handleDeleteHistory,
        confirmDeleteCampaign,
        handleHistoryClick,
        openInDashboard,
        handlerFilter
    }
}
