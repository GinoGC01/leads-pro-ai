import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── IMPORTS ───────────────────────────────────────────────────────────────
import Lead from '../../src/models/Lead.js';
import AIService from '../../src/services/AIService.js';
import VectorStoreService, { COLLECTIONS } from '../../src/services/VectorStoreService.js';
import KnowledgeDocument from '../../src/models/KnowledgeDocument.js';
import app from '../../src/app.js';

// ─── TEST DATA ─────────────────────────────────────────────────────────
const validBuffer = Buffer.from(
    'Estrategias de ventas B2B y prospección en frío. Técnicas de cierre comercial y negociación avanzada. '.repeat(50)
);

const trojanBuffer = Buffer.from(
    'Estrategias de ventas. ' + 'Sopa de la abuela y motores de avión F4 Phantom. Recetas de cocina peruana. '.repeat(50)
);

const DUMMY_EMBEDDING = Array(1536).fill(0.05);

const TEST_MONGO_URI = process.env.MONGODB_URI
    ? process.env.MONGODB_URI.replace(/\/[^/]+$/, '/leads_pro_ai_test')
    : 'mongodb://127.0.0.1:27017/leads_pro_ai_test';

// ─── TEST SUITE ────────────────────────────────────────────────────────
describe('Knowledge Ingestion Pipeline — RAG Gatekeeper', () => {

    let evaluateDocSpy;
    let generateEmbeddingSpy;

    beforeAll(async () => {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(TEST_MONGO_URI);
        }
        console.log(`[Test] Connected to MongoDB: ${mongoose.connection.name}`);

        // Clean slate
        await KnowledgeDocument.deleteMany({});

        // Initialize Qdrant collections
        try {
            await VectorStoreService.initializeCollections();
            await VectorStoreService.clearCollection(COLLECTIONS.MARIO_KNOWLEDGE);
        } catch (err) {
            console.warn(`[Test] Qdrant cleanup warning: ${err.message}`);
        }

        // ─── SET UP MOCKS ───────────────────────────────────────────────
        evaluateDocSpy = jest.spyOn(AIService, 'evaluateDocumentDomain')
            .mockResolvedValue({ is_relevant: true, reason: 'Mocked relevance' });
        
        generateEmbeddingSpy = jest.spyOn(AIService, 'generateEmbedding')
            .mockResolvedValue(DUMMY_EMBEDDING);
    });

    afterAll(async () => {
        evaluateDocSpy.mockRestore();
        generateEmbeddingSpy.mockRestore();
        await mongoose.disconnect();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mocks
        evaluateDocSpy.mockResolvedValue({ is_relevant: true, reason: 'mock default' });
        generateEmbeddingSpy.mockResolvedValue(DUMMY_EMBEDDING);
    });

    // ═══════════════════════════════════════════════════════════════════
    // TEST 1: New Valid File → HTTP 200 (ACCEPTED)
    // ═══════════════════════════════════════════════════════════════════
    test('accepts a valid business document and vectorizes it into Qdrant', async () => {
        // Mock: LLM Gatekeeper approves the document
        evaluateDocSpy.mockResolvedValue({
            is_relevant: true,
            reason: 'Contenido sobre ventas B2B y prospección comercial.'
        });

        const res = await request(app)
            .post('/api/knowledge/upload')
            .attach('file', validBuffer, 'ventas-b2b.txt')
            .expect(200);

        // Verify response shape
        expect(res.body.success).toBe(true);
        expect(res.body.document_id).toBeDefined();
        expect(res.body.stats.chunks_vectorized).toBeGreaterThan(0);
        expect(res.body.stats.chunks_failed).toBe(0);

        // Verify MongoDB persistence
        const doc = await KnowledgeDocument.findOne({ filename: 'ventas-b2b.txt' });
        expect(doc).not.toBeNull();
        expect(doc.status).toBe('ACCEPTED');
        expect(doc.chunks_count).toBeGreaterThan(0);

        // Verify mocks were called
        expect(evaluateDocSpy).toHaveBeenCalledTimes(1);
        expect(generateEmbeddingSpy).toHaveBeenCalled();

        console.log(`[Test 1] ✅ PASSED — ${res.body.stats.chunks_vectorized} chunks vectorized.`);
    }, 10000);

    // ═══════════════════════════════════════════════════════════════════
    // TEST 2: Duplicate Valid File → HTTP 200 (Cache Hit, 0 tokens)
    // ═══════════════════════════════════════════════════════════════════
    test('returns cached acceptance for duplicate file (zero OpenAI tokens)', async () => {
        const res = await request(app)
            .post('/api/knowledge/upload')
            .attach('file', validBuffer, 'ventas-b2b.txt') // Exact same payload
            .expect(200);

        // Verify cache hit response
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('ya está en el sistema');
        expect(res.body.document_id).toBeDefined();

        // CRITICAL: Zero OpenAI calls (tokens saved)
        expect(evaluateDocSpy).toHaveBeenCalledTimes(0);
        expect(generateEmbeddingSpy).toHaveBeenCalledTimes(0);

        console.log('[Test 2] ✅ PASSED — Duplicate detected, 0 OpenAI tokens consumed.');
    }, 10000);

    // ═══════════════════════════════════════════════════════════════════
    // TEST 3: Trojan Horse Document → HTTP 406 (REJECTED)
    // ═══════════════════════════════════════════════════════════════════
    test('rejects a Trojan Horse document and caches the rejection', async () => {
        // Mock: LLM Gatekeeper rejects the document
        evaluateDocSpy.mockResolvedValue({
            is_relevant: false,
            reason: 'El documento desvía hacia recetas de cocina y aviación militar.'
        });

        const res = await request(app)
            .post('/api/knowledge/upload')
            .attach('file', trojanBuffer, 'trojan-doc.txt')
            .expect(406);

        // Verify rejection response
        expect(res.body.success).toBe(false);
        expect(res.body.reason).toContain('recetas');

        // Verify MongoDB persistence of rejection
        const doc = await KnowledgeDocument.findOne({ filename: 'trojan-doc.txt' });
        expect(doc).not.toBeNull();
        expect(doc.status).toBe('REJECTED');
        expect(doc.reject_reason).toContain('recetas');

        // CRITICAL: No embeddings generated (no garbage vectorized)
        expect(evaluateDocSpy).toHaveBeenCalledTimes(1);
        expect(generateEmbeddingSpy).toHaveBeenCalledTimes(0);

        console.log('[Test 3] ✅ PASSED — Trojan Horse rejected, 0 embeddings generated.');
    }, 10000);

    // ═══════════════════════════════════════════════════════════════════
    // TEST 4: Duplicate Rejected File → HTTP 406 (Cache Hit, 0 tokens)
    // ═══════════════════════════════════════════════════════════════════
    test('returns cached rejection for duplicate bad file (zero OpenAI tokens)', async () => {
        const res = await request(app)
            .post('/api/knowledge/upload')
            .attach('file', trojanBuffer, 'trojan-doc.txt') // Exact same payload
            .expect(406);

        // Verify cached rejection
        expect(res.body.success).toBe(false);
        expect(res.body.reason).toContain('recetas');
        expect(res.body.original_filename).toBe('trojan-doc.txt');

        // CRITICAL: Zero OpenAI calls (rejection cached in MongoDB)
        expect(evaluateDocSpy).toHaveBeenCalledTimes(0);
        expect(generateEmbeddingSpy).toHaveBeenCalledTimes(0);

        console.log('[Test 4] ✅ PASSED — Cached rejection, 0 OpenAI tokens consumed.');
    }, 10000);
});
