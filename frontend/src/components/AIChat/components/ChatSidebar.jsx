import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, Clock, ChevronLeft, Edit2, Check } from 'lucide-react';

/**
 * ChatSidebar — Session history overlay panel.
 * Pure presentational. Handles only local editing state (inline rename).
 */
const ChatSidebar = ({ sessions, activeId, onSelect, onNew, onRename, onDelete, onClose }) => {
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');

    const handleSaveTitle = (id, e) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            onRename(id, editTitle);
        }
        setEditingId(null);
    };

    return (
        <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                    <Clock className="w-4 h-4" />
                    Historial de Chats
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-md">
                    <ChevronLeft className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.map(s => (
                    <div
                        key={s.id}
                        onClick={() => { onSelect(s.id); onClose(); }}
                        className={`group p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${activeId === s.id ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50 border-transparent'
                            } border`}
                    >
                        <div className="flex flex-1 items-center gap-3 overflow-hidden mr-2">
                            <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeId === s.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                            {editingId === s.id ? (
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(s.id, e); }}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                    className="w-full bg-white border border-indigo-200 text-sm rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-700"
                                />
                            ) : (
                                <span className={`text-sm truncate font-medium ${activeId === s.id ? 'text-indigo-700' : 'text-slate-600'}`}>
                                    {s.name}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {editingId === s.id ? (
                                <button onClick={(e) => handleSaveTitle(s.id, e)} className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 rounded-md">
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button onClick={(e) => { e.stopPropagation(); setEditingId(s.id); setEditTitle(s.name); }} className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-md">
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
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
                    onClick={() => { onNew(); onClose(); }}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Sesión
                </button>
            </div>
        </div>
    );
};

export default ChatSidebar;
