import { useState, useEffect, useCallback } from 'react';
import { getChatSessions, getChatSession, renameChatSession, deleteChatSession } from '../../../services/api';

/**
 * Hook: useChatSessions
 * Manages the CRUD lifecycle of chat sessions.
 * Handles fetching session list, loading full message history,
 * creating new local sessions, renaming, and deleting.
 */
const useChatSessions = (campaignId, leadId) => {
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Derive active session and messages
    const activeSession = sessions.find(s => s.id === activeSessionId);
    const activeSessionMessages = activeSession?.messages || [];

    // Create a new local session
    const createNewSession = useCallback(() => {
        const newId = `local-${Date.now()}`;
        const newSession = {
            id: newId,
            name: 'Nueva Conversación',
            messages: [{ role: 'assistant', text: 'Nueva sesión iniciada. ¿En qué trabajamos hoy?' }],
            createdAt: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newId);
        return newId;
    }, []);

    // Initial fetch of session list
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const { data } = await getChatSessions(campaignId, leadId);
                if (data && data.length > 0) {
                    setSessions(data.map(d => ({ id: d._id, name: d.title, messages: [] })));
                    setActiveSessionId(data[0]._id);
                } else {
                    createNewSession();
                }
            } catch (error) {
                console.error('[useChatSessions] Failed to fetch sessions', error);
                createNewSession();
            }
        };
        fetchSessions();
    }, [campaignId, leadId, createNewSession]);

    // Load full messages when switching to a session
    useEffect(() => {
        if (activeSessionId && !activeSessionId.startsWith('local-')) {
            const session = sessions.find(s => s.id === activeSessionId);
            if (session && session.messages.length === 0) {
                setIsLoadingHistory(true);
                getChatSession(activeSessionId)
                    .then(({ data }) => {
                        setSessions(prev => prev.map(s =>
                            s.id === activeSessionId ? { ...s, messages: data.messages } : s
                        ));
                    })
                    .catch(err => console.error('[useChatSessions] Failed to fetch full session', err))
                    .finally(() => setIsLoadingHistory(false));
            }
        }
    }, [activeSessionId]);

    // Select a session
    const loadSessionDetails = useCallback((id) => {
        setActiveSessionId(id);
    }, []);

    // Rename
    const renameSession = useCallback(async (id, newName) => {
        if (!newName.trim()) return;
        setSessions(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
        if (!id.startsWith('local-')) {
            try {
                await renameChatSession(id, newName);
            } catch (err) {
                console.error('[useChatSessions] Rename error', err);
            }
        }
    }, []);

    // Delete
    const deleteSession = useCallback(async (id) => {
        setSessions(prev => {
            const filtered = prev.filter(s => s.id !== id);
            if (filtered.length === 0) return prev; // prevent empty
            if (activeSessionId === id) {
                setActiveSessionId(filtered[0].id);
            }
            return filtered;
        });
        if (!id.startsWith('local-')) {
            try {
                await deleteChatSession(id);
            } catch (err) {
                console.error('[useChatSessions] Delete error', err);
            }
        }
    }, [activeSessionId]);

    /**
     * updateSession — Used by useChatEngine to push new messages
     * and handle local→remote ID transition.
     */
    const updateSession = useCallback((sessionId, updater) => {
        setSessions(prev => prev.map(s => s.id === sessionId ? updater(s) : s));
    }, []);

    const updateActiveSessionId = useCallback((newId) => {
        setActiveSessionId(newId);
    }, []);

    return {
        sessions,
        activeSessionId,
        activeSession,
        activeSessionMessages,
        isLoadingHistory,
        createNewSession,
        loadSessionDetails,
        renameSession,
        deleteSession,
        updateSession,
        updateActiveSessionId,
    };
};

export default useChatSessions;
