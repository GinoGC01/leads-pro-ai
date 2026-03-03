import { useState, useCallback, useEffect } from 'react';

/**
 * Hook: useRowSelection
 * Manages checkbox state independently from data processing.
 * All handlers are useCallback-wrapped to preserve referential equality
 * for React.memo rows.
 */
const useRowSelection = (leads) => {
    const [selectedIds, setSelectedIds] = useState([]);

    // Auto-clear selection when the source leads change (e.g. campaign switch)
    useEffect(() => {
        setSelectedIds([]);
    }, [leads]);

    const toggleSelection = useCallback((id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    }, []);

    const selectAll = useCallback((processedLeads) => {
        setSelectedIds(prev => {
            if (prev.length === processedLeads.length) return [];
            return processedLeads.map(l => l._id);
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds([]);
    }, []);

    return { selectedIds, toggleSelection, selectAll, clearSelection };
};

export default useRowSelection;
