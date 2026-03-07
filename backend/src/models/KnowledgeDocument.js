import mongoose from 'mongoose';

/**
 * KnowledgeDocument — Tracks ingested RAG documents.
 * 
 * Provides:
 *   - SHA-256 deduplication (unique file_hash prevents re-processing)
 *   - Rejection cache (saves OpenAI tokens on repeat uploads of bad files)
 *   - Audit trail for all document ingestion attempts
 */
const knowledgeDocumentSchema = new mongoose.Schema({
    file_hash: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    filename: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        default: null
    },
    size_bytes: {
        type: Number,
        default: 0
    },
    document_id: {
        type: String,
        default: null // UUID assigned during Qdrant ingestion
    },
    status: {
        type: String,
        enum: ['ACCEPTED', 'REJECTED'],
        required: true
    },
    reject_reason: {
        type: String,
        default: null
    },
    chunks_count: {
        type: Number,
        default: 0
    },
    metadata: {
        type: Object,
        default: {}
    },
    chunk_size: {
        type: Number,
        default: 1000
    },
    overlap: {
        type: Number,
        default: 200
    },
    uploaded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

export default mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
