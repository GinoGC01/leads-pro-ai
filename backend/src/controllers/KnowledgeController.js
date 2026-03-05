import { randomUUID } from 'crypto';
import multer from 'multer';
import DocumentProcessor from '../services/DocumentProcessor.js';
import AIService from '../services/AIService.js';
import VectorStoreService, { COLLECTIONS } from '../services/VectorStoreService.js';
import KnowledgeDocument from '../models/KnowledgeDocument.js';

// ─── MULTER CONFIG (Memory only — no disk writes) ────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'text/plain'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo PDF y TXT.`), false);
        }
    }
});

/**
 * KnowledgeController — Dynamic RAG Document Ingestion with Gatekeeper.
 * 
 * Pipeline: Hash Dedup → Extract → Strategic Sample → LLM Gate → Chunk → Embed → Qdrant
 * 
 * Security layers:
 *   1. SHA-256 deduplication (MongoDB cache)
 *   2. 3-point equidistant sampling (anti-Trojan Horse)
 *   3. LLM domain congruence audit (gpt-4o-mini)
 */
class KnowledgeController {

    static uploadMiddleware = upload.single('file');

    /**
     * POST /api/knowledge/upload
     * 
     * Full orchestration: dedup → extract → sample → LLM gate → chunk → vectorize.
     */
    static async uploadDocument(req, res) {
        try {
            // ─── STEP 0: Validate file presence ────────────────────────
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se recibió ningún archivo. Envía un PDF o TXT en el campo "file".'
                });
            }

            const { originalname, buffer, mimetype, size } = req.file;
            console.log(`[Knowledge] 📄 Archivo recibido: "${originalname}" (${mimetype}, ${(size / 1024).toFixed(1)}KB)`);

            // ─── STEP 1: SHA-256 Deduplication ─────────────────────────
            const fileHash = DocumentProcessor.generateHash(buffer);
            console.log(`[Knowledge] 🔑 Hash SHA-256: ${fileHash.substring(0, 16)}...`);

            const existingDoc = await KnowledgeDocument.findOne({ file_hash: fileHash });

            if (existingDoc) {
                if (existingDoc.status === 'REJECTED') {
                    console.log(`[Knowledge] 🚫 Documento rechazado previamente (tokens ahorrados).`);
                    return res.status(406).json({
                        success: false,
                        message: `Este documento ya fue analizado y RECHAZADO.`,
                        reason: existingDoc.reject_reason,
                        original_filename: existingDoc.filename,
                        analyzed_at: existingDoc.createdAt
                    });
                }

                if (existingDoc.status === 'ACCEPTED') {
                    console.log(`[Knowledge] ✅ Documento idéntico ya procesado (tokens ahorrados).`);
                    return res.status(200).json({
                        success: true,
                        message: `Este documento ya está en el sistema.`,
                        document_id: existingDoc.document_id,
                        original_filename: existingDoc.filename,
                        chunks_count: existingDoc.chunks_count,
                        ingested_at: existingDoc.createdAt
                    });
                }
            }

            // ─── STEP 2: Extract text ──────────────────────────────────
            const rawText = await DocumentProcessor.extractText(buffer, mimetype);
            console.log(`[Knowledge] ✅ Texto extraído: ${rawText.length} caracteres.`);

            // ─── STEP 3: Strategic Sampling (Anti-Trojan) ──────────────
            const sampledText = DocumentProcessor.extractStrategicSamples(rawText);
            console.log(`[Knowledge] 🔬 Muestreo estratégico generado (${sampledText.length} chars).`);

            // ─── STEP 4: LLM Domain Gatekeeper ────────────────────────
            const gateVerdict = await AIService.evaluateDocumentDomain(sampledText);

            if (!gateVerdict.is_relevant) {
                // Persist rejection to save future tokens
                await KnowledgeDocument.create({
                    file_hash: fileHash,
                    filename: originalname,
                    mimetype,
                    size_bytes: size,
                    status: 'REJECTED',
                    reject_reason: gateVerdict.reason
                });

                console.log(`[Knowledge] ❌ Documento rechazado por LLM gatekeeper: ${gateVerdict.reason}`);
                return res.status(406).json({
                    success: false,
                    message: 'Documento rechazado por el auditor de dominio.',
                    reason: gateVerdict.reason
                });
            }

            // ─── STEP 5: Chunk text ────────────────────────────────────
            const chunkSize = parseInt(req.body.chunkSize) || 1000;
            const overlap = parseInt(req.body.overlap) || 200;
            const { chunks, stats } = DocumentProcessor.chunkText(rawText, chunkSize, overlap);
            console.log(`[Knowledge] 📦 Fragmentado en ${stats.chunkCount} chunks.`);

            // ─── STEP 6: Vectorize and upsert to Qdrant ───────────────
            const documentId = randomUUID();
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < chunks.length; i++) {
                try {
                    const chunk = chunks[i];
                    const chunkId = `${documentId}_chunk_${i}`;

                    const embedding = await AIService.generateEmbedding(chunk);

                    const ok = await VectorStoreService.upsertVector(
                        COLLECTIONS.MARIO_KNOWLEDGE,
                        chunkId,
                        embedding,
                        {
                            text_chunk: chunk,
                            document_id: documentId,
                            source: originalname,
                            chunk_index: i,
                            total_chunks: chunks.length
                        }
                    );

                    if (ok) successCount++;
                    else errorCount++;

                } catch (chunkErr) {
                    console.error(`[Knowledge] ⚠️ Error en chunk ${i}: ${chunkErr.message}`);
                    errorCount++;
                }
            }

            // ─── STEP 7: Persist acceptance to MongoDB ─────────────────
            await KnowledgeDocument.create({
                file_hash: fileHash,
                filename: originalname,
                mimetype,
                size_bytes: size,
                document_id: documentId,
                status: 'ACCEPTED',
                chunks_count: successCount
            });

            console.log(`[Knowledge] ✅ Ingesta completada: ${successCount}/${chunks.length} chunks vectorizados para "${originalname}".`);

            return res.status(200).json({
                success: true,
                message: `Documento "${originalname}" procesado exitosamente.`,
                document_id: documentId,
                gate_verdict: gateVerdict.reason,
                stats: {
                    filename: originalname,
                    mimetype,
                    size_kb: (size / 1024).toFixed(1),
                    total_characters: rawText.length,
                    chunks_total: chunks.length,
                    chunks_vectorized: successCount,
                    chunks_failed: errorCount,
                    chunk_size: chunkSize,
                    overlap
                }
            });

        } catch (error) {
            console.error(`[Knowledge] ❌ Error en ingesta:`, error.message);
            const status = error.message.includes('no soportado') ||
                           error.message.includes('vacío') ||
                           error.message.includes('no contiene texto')
                ? 400 : 500;
            return res.status(status).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default KnowledgeController;
