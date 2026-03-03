import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

/**
 * Hook: useApiTelemetry
 * Polling engine for API usage metrics and alerts.
 * 
 * MEMORY LEAK PREVENTION: The useEffect strictly returns clearInterval()
 * to kill the polling thread when the component unmounts or the user
 * navigates away.
 */
const useApiTelemetry = () => {
    const [usage, setUsage] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTelemetry = useCallback(async () => {
        try {
            const [usageRes, alertsRes] = await Promise.all([
                api.get('/intelligence/usage'),
                api.get('/intelligence/alerts'),
            ]);
            setUsage(usageRes.data);
            setAlerts(alertsRes.data.alerts || []);
            setError(null);
        } catch (err) {
            console.error('[useApiTelemetry] Fetch error:', err.message);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTelemetry();
        const intervalId = setInterval(fetchTelemetry, 30000);
        // STRICT CLEANUP — prevents memory leak on unmount
        return () => clearInterval(intervalId);
    }, [fetchTelemetry]);

    return { usage, alerts, isLoading, error };
};

export default useApiTelemetry;
