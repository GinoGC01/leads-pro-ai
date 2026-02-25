import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Sparkles, MessageSquare, Loader2, Plus, Trash2, ChevronLeft, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askAi } from '../services/api';

const STORAGE_KEY = 'leads_pro_ai_sessions';

const AIChat = ({ onClose }) => {
    // Session State
    const [sessions, setSessions] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
        return [{
            id: 'default',
            name: 'Nueva Estrategia',
            messages: [{ role: 'assistant', text: '¡Hola! Soy tu estratega de IA. ¿En qué podemos trabajar hoy?' }],
            createdAt: Date.now()
        }];
    });

    const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id || 'default');
    const [showHistory, setShowHistory] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
    const messages = activeSession?.messages || [];

    // Persistence Effect
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }, [sessions]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleCreateSession = () => {
        const newId = Date.now().toString();
        const newSession = {
            id: newId,
            name: `Sesión ${sessions.length + 1}`,
            messages: [{ role: 'assistant', text: 'Nueva sesión iniciada. ¿Qué analizamos?' }],
            createdAt: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newId);
        setShowHistory(false);
    };

    const handleDeleteSession = (id, e) => {
        e.stopPropagation();
        if (sessions.length === 1) return;
        const newSessions = sessions.filter(s => s.id !== id);
        setSessions(newSessions);
        if (activeSessionId === id) {
            setActiveSessionId(newSessions[0].id);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', text: input };
        const queryTerm = input;

        // Update local session immediately
        setSessions(prev => prev.map(s =>
            s.id === activeSessionId
                ? { ...s, messages: [...s.messages, userMessage], name: s.messages.length === 1 ? queryTerm.substring(0, 30) : s.name }
                : s
        ));

        setInput('');
        setIsLoading(true);

        try {
            // Send history (excluding the first greeting)
            const chatHistory = messages.slice(1);
            const { data } = await askAi(queryTerm, chatHistory);

            setSessions(prev => prev.map(s =>
                s.id === activeSessionId
                    ? {
                        ...s,
                        messages: [...s.messages, userMessage, {
                            role: 'assistant',
                            text: data.answer,
                            sources: data.sources
                        }]
                    }
                    : s
            ));
        } catch (error) {
            setSessions(prev => prev.map(s =>
                s.id === activeSessionId
                    ? {
                        ...s,
                        messages: [...s.messages, {
                            role: 'assistant',
                            text: 'Error de conexión. Verifica tu API Key o conexión.'
                        }]
                    }
                    : s
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] w-full sm:w-[420px] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto relative">

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
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeSessionId === s.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    <span className={`text-sm truncate font-medium ${activeSessionId === s.id ? 'text-indigo-700' : 'text-slate-600'}`}>
                                        {s.name}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteSession(s.id, e)}
                                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 rounded-md transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between shadow-lg z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowHistory(true)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors relative"
                    >
                        <MessageSquare className="w-5 h-5 text-indigo-100" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-indigo-600 rounded-full"></span>
                    </button>
                    <div>
                        <h3 className="font-bold text-xs leading-none mb-1 truncate max-w-[150px]">
                            {activeSession?.name || 'Estratega IA'}
                        </h3>
                        <span className="text-[10px] text-indigo-100 flex items-center gap-1 opacity-90">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                            Smart Context Active
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
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
                        className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all outline-none"
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
