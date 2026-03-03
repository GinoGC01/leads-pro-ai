import React from 'react';
import { X, Star } from 'lucide-react';

const LeadHeader = ({ lead, onClose }) => {
    return (
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-white tracking-tight truncate max-w-[500px] drop-shadow-md">{lead.name}</h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0 group">
                    <X className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                </button>
            </div>
            <div className="flex gap-2">
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${lead.opportunityLevel === 'Critical' ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>{lead.opportunityLevel}</span>
                {lead.is_advertising && <span className="px-2.5 py-1 bg-accent-red/20 text-accent-red border border-accent-red/30 text-[10px] font-bold rounded uppercase">Ads Active</span>}
            </div>
        </div>
    );
};

export default LeadHeader;
