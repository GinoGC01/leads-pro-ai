import React, { useState } from 'react';
import { Bot, X } from 'lucide-react';

// Custom Hooks (all logic lives here)
import useChatSessions from './hooks/useChatSessions';
import useChatEngine from './hooks/useChatEngine';

// Presentational Components (zero API calls)
import ChatSidebar from './components/ChatSidebar';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';

/**
 * AIChat — Thin Orchestrator
 * Wires the session CRUD hook and the chat engine hook to pure UI components.
 * Owns only local UI state: isSidebarOpen.
 */
const AIChat = ({ onClose, campaignId, leadId }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const {
        sessions, activeSessionId, activeSession, activeSessionMessages,
        createNewSession, loadSessionDetails, renameSession, deleteSession,
        updateSession, updateActiveSessionId
    } = useChatSessions(campaignId, leadId);

    const { isThinking, sendMessage } = useChatEngine(
        activeSessionId,
        activeSessionMessages,
        leadId,
        campaignId,
        updateSession,
        updateActiveSessionId
    );

    return (
        <div className="flex flex-col h-[600px] w-full sm:w-[420px] bg-white border-2 border-indigo-950 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto relative">

            {/* Session Sidebar (Overlay) */}
            {isSidebarOpen && (
                <ChatSidebar
                    sessions={sessions}
                    activeId={activeSessionId}
                    onSelect={loadSessionDetails}
                    onNew={createNewSession}
                    onRename={renameSession}
                    onDelete={deleteSession}
                    onClose={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Header */}
            <div className="p-4 bg-[#0f0f11] border-b border-white/10 text-white flex items-center justify-between shadow-lg z-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/5"></div>

                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors relative flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    >
                        <img src="/bot.png" alt="Mario" className="w-8 h-8 object-contain drop-shadow-lg" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                        <Bot className="w-5 h-5 text-cyan-400 hidden" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                    </button>
                    <div>
                        <h3 className="font-bold text-sm tracking-wide leading-none mb-1 truncate max-w-[150px] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            {activeSession?.name && activeSession.name !== 'Nueva Estrategia' ? activeSession.name : 'Mario'}
                        </h3>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                            Smart Context Active
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1 relative z-10">
                    <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <MessageList messages={activeSessionMessages} isThinking={isThinking} />

            {/* Input Area */}
            <ChatInput onSend={sendMessage} disabled={isThinking} />
        </div>
    );
};

export default AIChat;
