import { useState, useMemo, useCallback } from 'react';

/**
 * Pricing constant — extracted from JSX.
 * Cost per Google Places API request (in USD).
 * Change this single value to update all cost estimations globally.
 */
const API_COST_PER_REQUEST = 0.032;

/**
 * Hook: useSearchForm
 * Encapsulates all 7 form inputs, the grid cost calculator,
 * and the submit handler. Zero rendering logic.
 */
const useSearchForm = () => {
    const [formData, setFormData] = useState({
        keyword: '',
        location: '',
        radius: 5000,
        maxResults: 60,
        countryCode: 'AR',
        gridMode: false,
        gridSize: 3,
    });

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const toggleGridMode = useCallback(() => {
        setFormData(prev => ({ ...prev, gridMode: !prev.gridMode }));
    }, []);

    // Grid cost estimation via useMemo — recalculates only when gridMode/gridSize change
    const gridCost = useMemo(() => {
        if (!formData.gridMode) return null;

        const cells = formData.gridSize * formData.gridSize;
        const totalRequests = cells * 3; // max pages per cell
        const maxUSD = (totalRequests * API_COST_PER_REQUEST).toFixed(2);

        return { cells, totalRequests, maxUSD };
    }, [formData.gridMode, formData.gridSize]);

    const handleSubmit = useCallback((e, onSearchCallback) => {
        e.preventDefault();
        if (onSearchCallback) onSearchCallback(formData);
    }, [formData]);

    return {
        formData,
        gridCost,
        handleChange,
        toggleGridMode,
        handleSubmit,
    };
};

export default useSearchForm;
