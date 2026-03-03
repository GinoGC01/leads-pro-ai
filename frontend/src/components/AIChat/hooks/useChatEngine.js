import { useState, useCallback } from 'react';
import { askAi } from '../../../services/api';

/**
 * Hook: useChatEngine
 * Handles sending messages to the AI backend, managing the "thinking" state,
 * and orchestrating the local→remote session ID transition on first message.
 *
 * @param {string} activeSessionId - Current session ID (may start with 'local-')
 * @param {Array} activeSessionMessages - Current messages in the active session
 * @param {string} leadId - Optional lead context
 * @param {string} campaignId - Optional campaign context
 * @param {Function} updateSession - Callback to update session state in useChatSessions
 * @param {Function} updateActiveSessionId - Callback to switch the active ID after persist
 */
const useChatEngine = (activeSessionId, activeSessionMessages, leadId, campaignId, updateSession, updateActiveSessionId) => {
    const [isThinking, setIsThinking] = useState(false);

    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || isThinking || !activeSessionId) return;

        const userMessage = { role: 'user', text };

        // Optimistically add user message to session
        updateSession(activeSessionId, (session) => ({
            ...session,
            messages: [...session.messages, userMessage],
            name: session.messages.length === 1 && session.id.startsWith('local-')
                ? text.substring(0, 30)
                : session.name
        }));

        setIsThinking(true);

        try {
            // Send history (excluding the greeting) + context identifiers
            const chatHistory = activeSessionMessages.slice(1);
            const sendSessionId = activeSessionId.startsWith('local-') ? null : activeSessionId;
            const { data } = await askAi(text, chatHistory, leadId, campaignId, sendSessionId);

            const assistantMessage = {
                role: 'assistant',
                text: data.answer,
                sources: data.sources
            };

            updateSession(activeSessionId, (session) => {
                const updatedSession = {
                    ...session,
                    id: data.sessionId || session.id,
                    name: data.sessionTitle || session.name,
                    messages: [...session.messages, assistantMessage]
                };
                return updatedSession;
            });

            // If session morphed from local to remote, update the active ID
            if (activeSessionId.startsWith('local-') && data.sessionId) {
                updateActiveSessionId(data.sessionId);
            }
        } catch (error) {
            console.error('[useChatEngine] Send error:', error);
            updateSession(activeSessionId, (session) => ({
                ...session,
                messages: [...session.messages, {
                    role: 'assistant',
                    text: 'Error de conexión. Verifica tu API Key o conexión al servidor.'
                }]
            }));
        } finally {
            setIsThinking(false);
        }
    }, [activeSessionId, activeSessionMessages, leadId, campaignId, isThinking, updateSession, updateActiveSessionId]);

    return { isThinking, sendMessage };
};

export default useChatEngine;
