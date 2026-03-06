import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { StatusUpdateModal, VortexResetModal } from '../Modals';

// Custom Hooks (all API logic lives here)
import useLeadData from './hooks/useLeadData';
import useVortexAnalysis from './hooks/useVortexAnalysis';
import useMarioStrategy from './hooks/useMarioStrategy';

// Presentational Components (zero API calls)
import LeadHeader from './components/LeadHeader';
import VortexRadiography from './components/VortexRadiography';
import StrategyGuide from './components/StrategyGuide';
import MarioPanel from './components/MarioPanel';
import GestionPanel from './components/GestionPanel';

/**
 * LeadDetailsPanel — Thin Orchestrator
 * Wires hooks to components. Owns only local UI concerns (activeTab, resizer).
 * All data fetching, polling, and AI logic delegated to custom hooks.
 */
const LeadDetailsPanel = ({ lead: initialLead, onClose, onLeadUpdate }) => {
    // --- Hooks (data + logic layer) ---
    const { lead, setLead, error, statusModal, setStatusModal, confirmStatusUpdate } = useLeadData(initialLead, onLeadUpdate);
    const { 
        isActivating, isDisqualified, isProcessing, isCompleted, isFailed, isSkippedRentedLand, handleActivateVortex,
        isVisionPending, isVisionProcessing, isVisionCompleted, handleActivateDeepVision, handleResetVortex,
        activeJobId, handleStreamComplete
    } = useVortexAnalysis(lead, setLead, onLeadUpdate);

    // --- Local UI state ---
    const [activeTab, setActiveTab] = useState('inteligencia');
    const [isSpiderHelpActive, setIsSpiderHelpActive] = useState(false);
    const [resetModalOpen, setResetModalOpen] = useState(false);

    // Mario strategy hook needs activeTab to auto-fetch on 'estrategia' tab
    const { spiderData, aiResponse, strategyId, isSpiderLoading, isAiLoading, fetchSpiderStrategy, handleRLHFRegeneration } = useMarioStrategy(lead._id, activeTab);

    // Resizable Mario Panel
    const [marioWidth, setMarioWidth] = useState(550);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDraggingRef.current) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= 350 && newWidth <= 900) {
                setMarioWidth(newWidth);
            }
        };
        const handleMouseUp = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    if (!lead) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            ></div>

            {/* Slide-over panel container */}
            <div className="relative w-[1400px] max-w-[95vw] bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] flex border-l border-white/10 animate-in slide-in-from-right duration-300 h-full">

                {/* Left Column (Data Tabs) */}
                <div className="flex-1 flex flex-col bg-gradient-to-b from-[#11131A] to-[#0A0B10] h-full overflow-hidden">

                    <LeadHeader lead={lead} onClose={onClose} />

                    {/* Tab Navigation */}
                    <div className="flex border-b border-white/5 bg-black/20 backdrop-blur-sm shrink-0">
                        {['inteligencia', 'estrategia', 'gestion'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-[1] py-4 text-[10px] font-black uppercase tracking-[0.1em] transition-all relative overflow-hidden group ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                <span className="relative z-10">{tab === 'gestion' ? 'Gestión' : tab === 'estrategia' ? 'Radiografía Spider' : tab}</span>
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 inset-x-0 h-[2px] bg-accent-blue shadow-[0_0_10px_rgba(56,189,248,0.5)] animate-in fade-in duration-300" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6 scroll-smooth minimal-scrollbar">
                        {error && (
                            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        {activeTab === 'inteligencia' && (
                            <VortexRadiography
                                lead={lead}
                                isProcessing={isProcessing}
                                isCompleted={isCompleted}
                                isFailed={isFailed}
                                isSkippedRentedLand={isSkippedRentedLand}
                                isDisqualified={isDisqualified}
                                isActivating={isActivating}
                                onActivateVortex={handleActivateVortex}
                                isSpiderHelpActive={isSpiderHelpActive}
                                onToggleSpiderHelp={() => setIsSpiderHelpActive(!isSpiderHelpActive)}
                                isVisionPending={isVisionPending}
                                isVisionProcessing={isVisionProcessing}
                                isVisionCompleted={isVisionCompleted}
                                onActivateDeepVision={handleActivateDeepVision}
                                onResetVortex={() => setResetModalOpen(true)}
                                activeJobId={activeJobId}
                                onStreamComplete={handleStreamComplete}
                            />
                        )}

                        {activeTab === 'estrategia' && (
                            <StrategyGuide
                                lead={lead}
                                spiderData={spiderData}
                                isSpiderLoading={isSpiderLoading}
                                aiResponse={aiResponse}
                            />
                        )}

                        {activeTab === 'gestion' && (
                            <GestionPanel
                                lead={lead}
                                onStatusSelect={(newStatus) => setStatusModal({ isOpen: true, newStatus })}
                            />
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-[#0B0B0C] relative overflow-hidden shrink-0">
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        <a
                            href={lead.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.address || ''}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all shadow-[0_0_15px_rgba(255,255,255,0.02)] group"
                        >
                            Ver en Google Maps <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                        </a>
                    </div>
                </div>

                {/* Resizer Handle */}
                <div
                    className="w-1.5 bg-transparent hover:bg-accent-blue/50 active:bg-accent-blue cursor-col-resize shrink-0 transition-colors z-50 group relative"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        isDraggingRef.current = true;
                        document.body.style.cursor = 'col-resize';
                        document.body.style.userSelect = 'none';
                    }}
                >
                    <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-0.5 h-12 bg-accent-blue/50 rounded-full"></div>
                    </div>
                </div>

                {/* Right Column (MARIO Copilot AI) */}
                <div
                    className="shrink-0 h-full border-l border-white/5 bg-[#0B0B0C] transition-none"
                    style={{ width: `${marioWidth}px` }}
                >
                    <MarioPanel
                        lead={lead}
                        aiResponse={aiResponse}
                        strategyId={strategyId}
                        isSpiderLoading={isSpiderLoading}
                        isAiLoading={isAiLoading}
                        onRegenerate={(isRlhf) => isRlhf ? handleRLHFRegeneration() : fetchSpiderStrategy(true)}
                        onFetchSpider={() => fetchSpiderStrategy(false)}
                    />
                </div>
            </div>

            <StatusUpdateModal
                isOpen={statusModal.isOpen}
                newStatus={statusModal.newStatus}
                onClose={() => setStatusModal({ isOpen: false, newStatus: null })}
                onConfirm={confirmStatusUpdate}
            />

            <VortexResetModal
                isOpen={resetModalOpen}
                onClose={() => setResetModalOpen(false)}
                leadName={lead.name}
                onConfirm={() => {
                    setResetModalOpen(false);
                    handleResetVortex();
                }}
            />
        </div>
    );
};

export default LeadDetailsPanel;
