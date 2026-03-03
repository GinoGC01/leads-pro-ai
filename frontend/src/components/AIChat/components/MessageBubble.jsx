import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * MessageBubble — Renders a single chat message with Markdown support.
 * Wrapped in React.memo to prevent re-renders when the sidebar toggles
 * or other messages arrive (only re-renders if its own message prop changes).
 */
const MessageBubble = React.memo(({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${isUser
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-200'
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                }`}>
                <div className={`prose prose-sm max-w-none prose-p:leading-relaxed ${isUser ? 'text-white' : 'text-slate-800'}`}>
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>

                {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fuentes del Contexto:</p>
                        <div className="flex flex-wrap gap-1">
                            {message.sources.map((s, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-medium border border-indigo-100">
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
