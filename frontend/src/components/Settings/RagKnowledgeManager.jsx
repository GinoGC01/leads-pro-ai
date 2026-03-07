import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle, XCircle, Tag, Settings2, FileText, Calendar, Trash2, AlertTriangle, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadKnowledgeDocument, getKnowledgeDocuments, deleteKnowledgeDocument, flushKnowledgeDocuments, getAgencySettings, updateAgencySettings } from '../../services/api';
import DeleteConfirmationModal from '../Modals/DeleteConfirmationModal';
import useModal from '../../hooks/useModal';

const RagKnowledgeManager = () => {
    // Tag dictionary from Settings
    const [predefinedTags, setPredefinedTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [newTagInput, setNewTagInput] = useState('');

    // Ingestion config
    const [chunkSize, setChunkSize] = useState(1000);
    const [overlap, setOverlap] = useState(200);

    // Upload state
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Document list
    const [documents, setDocuments] = useState([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    // Modal state for delete/flush confirmations
    const deleteModal = useModal();
    const [flushModalOpen, setFlushModalOpen] = useState(false);
    const [flushConfirmText, setFlushConfirmText] = useState('');
    const pendingDelete = useRef(null);

    useEffect(() => {
        fetchDocuments();
        fetchPredefinedTags();
    }, []);

    const fetchDocuments = async () => {
        try {
            setIsLoadingDocs(true);
            const response = await getKnowledgeDocuments();
            if (response.data?.success) setDocuments(response.data.documents || []);
        } catch (error) {
            console.error('Error fetching knowledge documents:', error);
        } finally {
            setIsLoadingDocs(false);
        }
    };

    const fetchPredefinedTags = async () => {
        try {
            const response = await getAgencySettings();
            if (response.data?.rag_predefined_tags) {
                setPredefinedTags(response.data.rag_predefined_tags);
            }
        } catch (error) {
            console.error('Error fetching predefined tags:', error);
        }
    };

    // ─── Tag Dictionary Management ────────────────────────────────
    const toggleTag = (tag) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const addNewTag = async () => {
        const tag = newTagInput.trim().toLowerCase();
        if (!tag || predefinedTags.includes(tag)) {
            setNewTagInput('');
            return;
        }

        const updatedTags = [...predefinedTags, tag];
        setPredefinedTags(updatedTags);
        setNewTagInput('');

        try {
            await updateAgencySettings({ rag_predefined_tags: updatedTags });
            toast.success(`Tag "${tag}" agregado al diccionario.`);
        } catch {
            toast.error('Error al guardar el tag.');
        }
    };

    const removeTagFromDictionary = async (tagToRemove) => {
        const updatedTags = predefinedTags.filter(t => t !== tagToRemove);
        setPredefinedTags(updatedTags);
        setSelectedTags(prev => prev.filter(t => t !== tagToRemove));

        try {
            await updateAgencySettings({ rag_predefined_tags: updatedTags });
        } catch {
            toast.error('Error al eliminar el tag.');
        }
    };

    // ─── File Upload ──────────────────────────────────────────────
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]); };
    const handleFileSelect = (e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); if (fileInputRef.current) fileInputRef.current.value = ''; };
    const handleBoxClick = () => { if (!isUploading && fileInputRef.current) fileInputRef.current.click(); };

    const processFile = async (file) => {
        if (!file) return;
        setIsUploading(true);

        const options = {
            metadata: selectedTags.length > 0 ? selectedTags.join(', ') : undefined,
            chunkSize: chunkSize || undefined,
            overlap: overlap || undefined
        };

        const uploadPromise = uploadKnowledgeDocument(file, options);
        toast.promise(uploadPromise, {
            loading: 'Analizando documento con IA Guardian...',
            success: 'Documento vectorizado e ingresado a la base de conocimiento.',
            error: 'Gatekeeper rechazó el documento o falló la ingesta.'
        });

        try { await uploadPromise; } catch { /* handled by toast */ }
        await fetchDocuments();
        setIsUploading(false);
    };

    // ─── Deletion ─────────────────────────────────────────────────
    // ─── Delete (via modal) ─────────────────────────────────────
    const requestDeleteDocument = (docId, filename) => {
        pendingDelete.current = { docId, filename };
        deleteModal.openModal({ customMessage: `Estás a punto de eliminar "${filename}" de la base RAG de MARIO. Se borrarán sus vectores de Qdrant permanentemente.` });
    };

    const confirmDeleteDocument = async () => {
        deleteModal.closeModal();
        const { docId, filename } = pendingDelete.current || {};
        if (!docId) return;

        setDeletingId(docId);
        try {
            await deleteKnowledgeDocument(docId);
            toast.success(`"${filename}" eliminado.`);
            await fetchDocuments();
        } catch {
            toast.error('Error al eliminar el documento.');
        } finally {
            setDeletingId(null);
            pendingDelete.current = null;
        }
    };

    // ─── Flush (via custom modal with text confirmation) ──────
    const openFlushModal = () => { setFlushConfirmText(''); setFlushModalOpen(true); };
    const closeFlushModal = () => { setFlushModalOpen(false); setFlushConfirmText(''); };

    const confirmFlush = async () => {
        if (flushConfirmText !== 'VACIAR MARIO') {
            toast.error('Confirmación incorrecta. Escribe exactamente "VACIAR MARIO".');
            return;
        }
        closeFlushModal();
        try {
            const response = await flushKnowledgeDocuments();
            toast.success(response.data?.message || 'Base de conocimiento vaciada.');
            await fetchDocuments();
        } catch {
            toast.error('Error al vaciar la base de conocimiento.');
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* ═══ SECTION 1: Upload & Config ═══ */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-2">Upload Knowledge Document</h2>
                <p className="text-slate-400 mb-6 font-light">
                    Upload PDFs or TXT files. IA Guardian will evaluate quality before ingesting.
                </p>

                {/* Controlled Tag Selector (Pills) */}
                <div className="space-y-3 mb-5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag size={13} className="text-indigo-400" />
                        Etiquetas de Nicho
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {predefinedTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`group relative px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all duration-200 ${
                                    selectedTags.includes(tag)
                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                        : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-600 hover:text-slate-300'
                                }`}
                            >
                                {tag}
                                {/* X to remove from dictionary */}
                                <span
                                    onClick={(e) => { e.stopPropagation(); removeTagFromDictionary(tag); }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-slate-700 rounded-full items-center justify-center text-slate-400 hover:bg-red-500/80 hover:text-white cursor-pointer hidden group-hover:flex transition-all"
                                >
                                    <X size={10} />
                                </span>
                            </button>
                        ))}

                        {/* Add new tag inline */}
                        <div className="flex items-center gap-1">
                            <input
                                type="text"
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addNewTag()}
                                placeholder="Nuevo tag..."
                                className="w-28 bg-slate-900/50 border border-slate-700/50 rounded-full px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                            />
                            <button
                                onClick={addNewTag}
                                disabled={!newTagInput.trim()}
                                className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                        Click para seleccionar. Hover + <span className="text-slate-400">&times;</span> para eliminar del diccionario. MARIO usará estos tags para búsqueda híbrida.
                    </p>
                </div>

                {/* Chunk Config */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Settings2 size={13} /> Chunk Size
                        </label>
                        <input type="number" min="200" max="4000" step="100" value={chunkSize}
                            onChange={(e) => setChunkSize(parseInt(e.target.value) || 1000)}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Settings2 size={13} /> Overlap
                        </label>
                        <input type="number" min="0" max="1000" step="50" value={overlap}
                            onChange={(e) => setOverlap(parseInt(e.target.value) || 200)}
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
                    </div>
                    <div className="flex items-end pb-1">
                        <p className="text-[11px] text-slate-500">
                            <span className="text-slate-400 font-medium">~{Math.max(1, Math.ceil(3000 / (chunkSize - overlap || 1)))}</span> chunks / 3000 chars
                        </p>
                    </div>
                </div>

                {/* Dropzone */}
                <div onClick={handleBoxClick} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                    className={`group border-dashed border-2 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
                        isDragging ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-slate-600 bg-slate-800/30 hover:border-indigo-400 hover:bg-slate-800/60'
                    } ${isUploading ? 'pointer-events-none border-indigo-500/50 bg-indigo-500/5' : ''}`}>
                    {isUploading ? (
                        <div className="flex flex-col items-center animate-in zoom-in duration-300">
                            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-indigo-400 font-medium animate-pulse">Processing via Guardian...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="p-4 bg-slate-800 rounded-full mb-4 shadow-lg ring-1 ring-white/5 group-hover:bg-slate-700 transition-colors">
                                <UploadCloud size={32} className="text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <p className="text-white font-medium mb-1 group-hover:text-indigo-300 transition-colors">Click to select or drag and drop</p>
                            <p className="text-sm text-slate-500">PDF, TXT (Max 10MB)</p>
                            {selectedTags.length > 0 && (
                                <div className="flex gap-1.5 mt-3">
                                    {selectedTags.map(t => (
                                        <span key={t} className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-semibold border border-indigo-500/20 uppercase">{t}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept=".pdf,.txt" />
                </div>
            </div>

            {/* ═══ SECTION 2: Document Audit Table ═══ */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FileText size={18} className="text-indigo-400" />
                        Knowledge Base Audit
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">{documents.length} documento{documents.length !== 1 ? 's' : ''}</span>
                </div>

                {isLoadingDocs ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-700/50 rounded-xl text-slate-500 text-sm">
                        No documents ingested yet. Upload your first knowledge document above.
                    </div>
                ) : (
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden shadow-inner">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700/50 bg-slate-800/50">
                                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-400 uppercase">Document</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-400 uppercase">Status</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-400 uppercase hidden md:table-cell">Tags</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-400 uppercase hidden sm:table-cell text-center">Chunks</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-400 uppercase hidden lg:table-cell text-center">Config</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-400 uppercase text-right">Date</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-slate-400 uppercase text-center w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {documents.map(doc => (
                                    <tr key={doc._id} className="transition-colors hover:bg-slate-800/30 group">
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-slate-200 truncate max-w-[180px] sm:max-w-xs" title={doc.filename}>{doc.filename}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{formatBytes(doc.size_bytes)}</p>
                                        </td>
                                        <td className="p-4">
                                            {doc.status === 'ACCEPTED' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                                    <CheckCircle size={14} /> Accepted
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20" title={doc.reject_reason}>
                                                    <XCircle size={14} /> Rejected
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1.5">
                                                {doc.metadata?.tags?.length > 0 ? doc.metadata.tags.map((tag, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold border border-indigo-500/20 uppercase tracking-wider">{tag}</span>
                                                )) : <span className="text-xs text-slate-600 italic">—</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 hidden sm:table-cell text-center">
                                            <span className="text-sm font-medium text-slate-300">{doc.chunks_count || 0}</span>
                                        </td>
                                        <td className="p-4 hidden lg:table-cell text-center">
                                            <span className="text-[11px] text-slate-500 font-mono">{doc.chunk_size || 1000}/{doc.overlap || 200}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500">
                                                <Calendar size={12} /> {formatDate(doc.createdAt)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => requestDeleteDocument(doc._id, doc.filename)}
                                                disabled={deletingId === doc._id}
                                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                title="Eliminar documento"
                                            >
                                                {deletingId === doc._id ? (
                                                    <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ═══ SECTION 3: Danger Zone ═══ */}
            {documents.length > 0 && (
                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Danger Zone</h3>
                            <p className="text-xs text-red-400/60 mt-0.5">Operación irreversible. Elimina todos los documentos y vectores de MARIO.</p>
                        </div>
                    </div>
                    <button
                        onClick={openFlushModal}
                        className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
                    >
                        Vaciar Base de Datos RAG de MARIO
                    </button>
                </div>
            )}

            {/* ═══ Delete Confirmation Modal ═══ */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={deleteModal.closeModal}
                onConfirm={confirmDeleteDocument}
                customMessage={deleteModal.data?.customMessage}
            />

            {/* ═══ Flush Confirmation Modal ═══ */}
            {flushModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Vaciar Base RAG de MARIO</h3>
                                    <p className="text-sm text-slate-500">Esta acción es permanente e irreversible.</p>
                                </div>
                            </div>

                            <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-4">
                                <p className="text-sm text-red-700 leading-relaxed">
                                    Se eliminarán <span className="font-bold">todos los documentos</span> y sus vectores de Qdrant asociados al agente MARIO.
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                                    Escribe <span className="text-red-600 font-bold">VACIAR MARIO</span> para confirmar
                                </label>
                                <input
                                    type="text"
                                    value={flushConfirmText}
                                    onChange={(e) => setFlushConfirmText(e.target.value)}
                                    placeholder="VACIAR MARIO"
                                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:border-red-400 transition-all font-mono tracking-wider"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={closeFlushModal}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmFlush}
                                    disabled={flushConfirmText !== 'VACIAR MARIO'}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Vaciar Permanentemente
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={closeFlushModal}
                            className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RagKnowledgeManager;
