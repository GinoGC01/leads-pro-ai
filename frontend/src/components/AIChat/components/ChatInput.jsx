import React, { useState } from 'react';
import { Send } from 'lucide-react';

/**
 * ChatInput — Text input with send button.
 * Manages its own local text state. Clears on submit.
 * Pure presentational: calls onSend(text) and nothing else.
 */
const ChatInput = ({ onSend, disabled }) => {
    const [text, setText] = useState('');

    const handleSubmit = () => {
        if (!text.trim() || disabled) return;
        onSend(text);
        setText('');
    };

    return (
        <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative group">
                <input
                    type="text"
                    placeholder="Escribe tu consulta aquí..."
                    className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all outline-none placeholder-slate-400"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button
                    onClick={handleSubmit}
                    disabled={disabled || !text.trim()}
                    className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100 active:scale-95"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
