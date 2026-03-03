import React from 'react';
import { Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import useAutoScroll from '../hooks/useAutoScroll';

/**
 * MessageList — Scrollable message container.
 * Maps MessageBubble for each message.
 * Shows "thinking" spinner when AI is processing.
 * Attaches useAutoScroll ref at the bottom.
 */
const MessageList = ({ messages, isThinking }) => {
    const endRef = useAutoScroll([messages, isThinking]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
            ))}

            {isThinking && (
                <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                        <span className="text-xs text-slate-500 font-medium italic">Consultando memoria y analizando...</span>
                    </div>
                </div>
            )}

            <div ref={endRef} />
        </div>
    );
};

export default MessageList;
