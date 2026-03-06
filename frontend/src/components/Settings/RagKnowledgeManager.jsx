import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadKnowledgeDocument } from '../../services/api';

const RagKnowledgeManager = () => {
    const [uploadHistory, setUploadHistory] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
        // Reset input value to allow selecting the same file again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleBoxClick = () => {
        if (!isUploading && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const processFile = async (file) => {
        if (!file) return;

        setIsUploading(true);
        const uploadPromise = uploadKnowledgeDocument(file);

        toast.promise(uploadPromise, {
            loading: 'Analizando documento con IA Guardián...',
            success: 'Document vectorized and added to knowledge base',
            error: 'Gatekeeper Rejected or Failed'
        });

        const historyItem = {
            id: Date.now().toString(),
            filename: file.name,
            size: file.size,
            date: new Date().toISOString(),
            status: 'PENDING'
        };

        setUploadHistory(prev => [historyItem, ...prev]);

        try {
            const response = await uploadPromise;
            // Success! Update history with chunks vectorized
            setUploadHistory(prev => prev.map(item => 
                item.id === historyItem.id 
                    ? { 
                        ...item, 
                        status: 'ACCEPTED', 
                        chunks: response.data?.stats?.chunks_vectorized || response.data?.chunks_vectorized || 0 
                      } 
                    : item
            ));
        } catch (error) {
            let rejectReason = 'Failed to connect to server';
            if (error.response) {
                if (error.response.status === 406) {
                    rejectReason = error.response.data?.reason || 'Gatekeeper Rejected';
                } else {
                    rejectReason = error.response.data?.message || `HTTP ${error.response.status}`;
                }
            }

            setUploadHistory(prev => prev.map(item => 
                item.id === historyItem.id 
                    ? { ...item, status: 'REJECTED', reason: rejectReason } 
                    : item
            ));
        } finally {
            setIsUploading(false);
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <h2 className="text-xl font-semibold text-white mb-2">Upload Knowledge Document</h2>
                <p className="text-slate-400 mb-6 font-light">
                    Upload PDFs or TXT files. IA Guardian will evaluate quality before ingesting.
                </p>

                <div 
                    onClick={handleBoxClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-dashed border-2 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
                        isDragging 
                            ? 'border-indigo-500 bg-indigo-500/10' 
                            : 'border-slate-600 bg-slate-800/30 hover:border-indigo-400 hover:bg-slate-800/60'
                    } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    {isUploading && (
                        <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-indigo-400 font-medium">Processing via Guardian...</p>
                        </div>
                    )}
                    
                    <div className="p-4 bg-slate-800 rounded-full mb-4 shadow-lg ring-1 ring-white/5">
                        <UploadCloud size={32} className="text-indigo-400" />
                    </div>
                    <p className="text-white font-medium mb-1">Click to select or drag and drop</p>
                    <p className="text-sm text-slate-500">PDF, TXT, DOCX (Max 20MB)</p>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect}
                        accept=".pdf,.txt,.docx"
                    />
                </div>
            </div>

            {uploadHistory.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Ingestion History</h3>
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden shadow-inner">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700/50 bg-slate-800/50">
                                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-400 uppercase">Document</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-400 uppercase">Status</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-400 uppercase hidden sm:table-cell">Size</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-400 uppercase text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {uploadHistory.map(item => (
                                    <tr key={item.id} className="transition-colors hover:bg-slate-800/30">
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-slate-200 truncate max-w-[200px] sm:max-w-xs">{item.filename}</p>
                                        </td>
                                        <td className="p-4">
                                            {item.status === 'ACCEPTED' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                                    <CheckCircle size={14} /> Accepted
                                                </span>
                                            )}
                                            {item.status === 'REJECTED' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20">
                                                    <XCircle size={14} /> Rejected
                                                </span>
                                            )}
                                            {item.status === 'PENDING' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                                                    <div className="w-3 h-3 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500 hidden sm:table-cell">
                                            {formatBytes(item.size)}
                                        </td>
                                        <td className="p-4 text-right">
                                            {item.status === 'ACCEPTED' && (
                                                <span className="text-sm text-slate-400">
                                                    <span className="font-medium text-slate-300">{item.chunks}</span> chunks
                                                </span>
                                            )}
                                            {item.status === 'REJECTED' && (
                                                <p className="text-xs text-rose-400/80 truncate max-w-[150px] sm:max-w-[250px] ml-auto" title={item.reason}>
                                                    {item.reason}
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RagKnowledgeManager;
