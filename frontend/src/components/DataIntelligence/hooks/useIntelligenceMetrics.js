import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

/**
 * Hook: useIntelligenceMetrics
 * Owns usage data fetching, alerts, month selection, sync stats, and auto-polling.
 */
const useIntelligenceMetrics = () => {
    const [usage, setUsage] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');

    const fetchMetrics = useCallback(async (month) => {
        try {
            const monthParam = month || selectedMonth;
            const [usageRes, alertsRes] = await Promise.all([
                api.get('/intelligence/usage' + (monthParam ? `?month=${monthParam}` : '')),
                api.get('/intelligence/alerts'),
            ]);
            setUsage(usageRes.data);
            if (!selectedMonth && usageRes.data.availableMonths?.length > 0) {
                setSelectedMonth(usageRes.data.availableMonths[0]);
            }
            setAlerts(alertsRes.data.alerts || []);
        } catch (err) {
            console.error('[Intelligence] Metrics fetch error:', err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(() => fetchMetrics(), 30000);
        return () => clearInterval(interval);
    }, [fetchMetrics]);

    const handleMonthChange = (month) => {
        setSelectedMonth(month);
        fetchMetrics(month);
    };

    const handleSyncStats = async () => {
        setSyncing(true);
        try {
            const res = await api.post('/intelligence/sync-stats');
            if (res.data.success) {
                toast.success(`Sync: ${res.data.google.totalApiCalls} Google calls + ${res.data.openai.estimatedCalls} OpenAI calls`);
                await fetchMetrics();
            }
        } catch (err) {
            toast.error('Error en sync: ' + (err.response?.data?.message || err.message));
        } finally {
            setSyncing(false);
        }
    };

    return {
        usage,
        alerts,
        loading,
        syncing,
        selectedMonth,
        handleMonthChange,
        handleSyncStats,
        refresh: fetchMetrics,
    };
};

export default useIntelligenceMetrics;
