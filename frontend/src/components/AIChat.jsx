import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Sparkles, MessageSquare, Loader2, Plus, Trash2, ChevronLeft, Clock, Edit2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askAi, getChatSessions, getChatSession, renameChatSession, deleteChatSession } from '../services/api';

const AIChat = ({ onClose, campaignId, leadId }) => {
    // Session State
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const messagesEndRef = useRef(null);

    const activeSession = sessions.find(s => s.id === activeSessionId);
    const messages = activeSession?.messages || [];

    // Initial Fetch
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const { data } = await getChatSessions(campaignId, leadId);
                if (data && data.length > 0) {
                    setSessions(data.map(d => ({ id: d._id, name: d.title, messages: [] })));
                    setActiveSessionId(data[0]._id);
                } else {
                    handleCreateSession();
                }
            } catch (error) {
                console.error('[AIChat] Failed to fetch sessions', error);
                handleCreateSession();
            }
        };
        fetchSessions();
    }, [campaignId, leadId]);

    // Fetch Full Messages when Active Session Changes
    useEffect(() => {
        if (activeSessionId && !activeSessionId.startsWith('local-')) {
            const fetchFullSession = async () => {
                const session = sessions.find(s => s.id === activeSessionId);
                if (session && session.messages.length === 0) {
                    setIsLoading(true);
                    try {
                        const { data } = await getChatSession(activeSessionId);
                        setSessions(prev => prev.map(s =>
                            s.id === activeSessionId ? { ...s, messages: data.messages } : s
                        ));
                    } catch (error) {
                        console.error('[AIChat] Failed to fetch full session', error);
                    } finally {
                        setIsLoading(false);
                    }
                }
            };
            fetchFullSession();
        }
    }, [activeSessionId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleCreateSession = () => {
        const newId = `local-${Date.now()}`;
        const newSession = {
            id: newId,
            name: `Nueva Conversación`,
            messages: [{ role: 'assistant', text: 'Nueva sesión iniciada. ¿En qué trabajamos hoy?' }],
            createdAt: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newId);
        setShowHistory(false);
    };

    const handleDeleteSession = async (id, e) => {
        e.stopPropagation();
        if (sessions.length === 1) return;

        const newSessions = sessions.filter(s => s.id !== id);
        setSessions(newSessions);

        if (activeSessionId === id) {
            setActiveSessionId(newSessions[0].id);
        }

        if (!id.startsWith('local-')) {
            try {
                await deleteChatSession(id);
            } catch (err) {
                console.error('[AIChat] Delete Session Error', err);
            }
        }
    };

    const handleSaveTitle = async (id, e) => {
        e.stopPropagation();
        if (!editTitle.trim()) {
            setEditingSessionId(null);
            return;
        }

        // Optimistic UI updates
        setSessions(prev => prev.map(s => s.id === id ? { ...s, name: editTitle } : s));
        setEditingSessionId(null);

        if (!id.startsWith('local-')) {
            try {
                await renameChatSession(id, editTitle);
            } catch (error) {
                console.error('[AIChat] Rename Error', error);
            }
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', text: input };
        const queryTerm = input;

        // Update local session immediately
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId
                ? { ...s, messages: [...s.messages, userMessage], name: s.messages.length === 1 && s.id.startsWith('local-') ? queryTerm.substring(0, 30) : s.name }
                : s
        ));

        setInput('');
        setIsLoading(true);

        try {
            // Send history (excluding the first greeting), along with context identifiers
            const chatHistory = messages.slice(1);
            const sendSessionId = activeSessionId.startsWith('local-') ? null : activeSessionId;
            const { data } = await askAi(queryTerm, chatHistory, leadId, campaignId, sendSessionId);

            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    const updatedSession = {
                        ...s,
                        id: data.sessionId || s.id, // Update to DB ID if newly created
                        name: data.sessionTitle || s.name, // Auto-naming from backend
                        messages: [...s.messages, userMessage, {
                            role: 'assistant',
                            text: data.answer,
                            sources: data.sources
                        }]
                    };
                    // Update activeSessionId if it morphed from local to remote
                    if (s.id.startsWith('local-') && data.sessionId) {
                        setActiveSessionId(data.sessionId);
                    }
                    return updatedSession;
                }
                return s;
            }));

        } catch (error) {
            setSessions(prev => prev.map(s =>
                s.id === activeSessionId
                    ? {
                        ...s,
                        messages: [...s.messages, {
                            role: 'assistant',
                            text: 'Error de conexión. Verifica tu API Key o conexión al servidor.'
                        }]
                    }
                    : s
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] w-full sm:w-[420px] bg-white border-2 border-indigo-950 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto relative">

            {/* Session Sidebar (Overlay) */}
            {showHistory && (
                <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-left duration-200">
                    <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                            <Clock className="w-4 h-4" />
                            Historial de Chats
                        </div>
                        <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-200 rounded-md">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {sessions.map(s => (
                            <div
                                key={s.id}
                                onClick={() => { setActiveSessionId(s.id); setShowHistory(false); }}
                                className={`group p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${activeSessionId === s.id ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50 border-transparent'
                                    } border`}
                            >
                                <div className="flex flex-1 items-center gap-3 overflow-hidden mr-2">
                                    <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeSessionId === s.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    {editingSessionId === s.id ? (
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveTitle(s.id, e);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                            className="w-full bg-white border border-indigo-200 text-sm rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-700"
                                        />
                                    ) : (
                                        <span className={`text-sm truncate font-medium ${activeSessionId === s.id ? 'text-indigo-700' : 'text-slate-600'}`}>
                                            {s.name}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {editingSessionId === s.id ? (
                                        <button onClick={(e) => handleSaveTitle(s.id, e)} className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 rounded-md">
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    ) : (
                                        <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(s.id); setEditTitle(s.name); }} className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-md">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => handleDeleteSession(s.id, e)}
                                        className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t">
                        <button
                            onClick={handleCreateSession}
                            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Sesión
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="p-4 bg-[#0f0f11] border-b border-white/10 text-white flex items-center justify-between shadow-lg z-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/5"></div>

                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={() => setShowHistory(true)}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-200'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                            }`}>
                            <div className={`prose prose-sm max-w-none prose-p:leading-relaxed ${m.role === 'user' ? 'text-white' : 'text-slate-800'}`}>
                                <ReactMarkdown>{m.text}</ReactMarkdown>
                            </div>

                            {m.sources && m.sources.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fuentes del Contexto:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {m.sources.map((s, idx) => (
                                            <span key={idx} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-medium border border-indigo-100">
                                                {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                            <span className="text-xs text-slate-500 font-medium italic">Consultando memoria y analizando...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Escribe tu consulta aquí..."
                        className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all outline-none placeholder-slate-400"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100 active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChat;
