/**
 * SPIDER V2: End-to-End Vector Learning Loop Integration Test
 * 
 * Tests the closed-loop: Cold Start → Ingestion (Cerrado Ganado) → Vector Inference
 * 
 * REQUIREMENTS:
 * - MongoDB running (uses test DB: leads_pro_ai_test)
 * - Qdrant running on localhost:6333 (`docker compose up -d`)
 * - OpenAI API is MOCKED (no real calls)
 * 
 * RUN: npm test -- tests/integration/SpiderVectorLoop.test.js
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import dotenv from 'dotenv';

dotenv.config();

// ─── MOCK: OpenAI Embedding (MUST be before service imports) ───────────────
// Lead A: Dense cluster around 0.1
const VECTOR_LEAD_A = Array(1536).fill(0.1);
// Lead B: Very similar to A (same niche proximity)
const VECTOR_LEAD_B = Array(1536).fill(0.11);
// Lead C: Truly dissimilar vector (alternating +/- pattern → low cosine vs uniform vectors)
const VECTOR_LEAD_C = Array.from({ length: 1536 }, (_, i) => i % 2 === 0 ? 0.5 : -0.5);

let embeddingCallCount = 0;
let nextEmbeddingVector = VECTOR_LEAD_A;

// ─── IMPORTS (after mock setup) ────────────────────────────────────────────
import Lead from '../../src/models/Lead.js';
import SpiderEngine from '../../src/services/SpiderEngine.js';
import AIService from '../../src/services/AIService.js';
import VectorStoreService from '../../src/services/VectorStoreService.js';
import app from '../../src/app.js';

// ─── TEST DATABASE ─────────────────────────────────────────────────────────
const TEST_MONGO_URI = process.env.MONGODB_URI
    ? process.env.MONGODB_URI.replace(/\/[^/]+$/, '/leads_pro_ai_test')
    : 'mongodb://127.0.0.1:27017/leads_pro_ai_test';

// ─── MOCK LEAD FACTORY ─────────────────────────────────────────────────────
function createMockLead(overrides = {}) {
    return {
        name: 'Test Plomería Pro',
        website: 'https://plomeriapro.com',
        address: 'Buenos Aires, Argentina',
        phoneNumber: '+541155551234',
        rating: 4.2,
        userRatingsTotal: 85,
        category: 'plumber',
        enrichmentStatus: 'completed',
        vortex_status: 'base_completed',
        tech_stack: ['WordPress', 'jQuery'],
        performance_metrics: {
            performanceScore: 42,
            ttfb: 1800,
            lcp: '3200',
            performance_issue: true
        },
        seo_audit: {
            hasTitle: true,
            hasMetaDescription: false,
            h1Count: 1,
            titleText: 'Plomería Pro - Buenos Aires',
            metaDescription: ''
        },
        spider_memory: {
            friction_score: 'LOW',
            applied_tactic: null,
            historical_confidence: 0,
            last_analyzed_at: null
        },
        spider_verdict: {
            is_disqualified: false,
            reason: 'NONE',
            message: null
        },
        status: 'Nuevo',
        ...overrides
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════
describe('SPIDER Vector Learning Loop', () => {
    let leadA;
    let leadB;
    let embeddingSpy;

    // ─── SETUP ─────────────────────────────────────────────────────────────
    beforeAll(async () => {
        // 1. Connect to test database
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(TEST_MONGO_URI);
        }
        console.log(`[TEST] Connected to MongoDB: ${TEST_MONGO_URI}`);

        // 2. Clean slate
        await Lead.deleteMany({});

        // 3. Clear Qdrant collection
        await VectorStoreService.initializeCollection();
        await VectorStoreService.clearCollection();
        console.log('[TEST] Qdrant spider_memory collection cleared.');

        // 4. Mock AIService.generateEmbedding to avoid real OpenAI calls
        embeddingSpy = jest.spyOn(AIService, 'generateEmbedding')
            .mockImplementation(async (_text) => {
                embeddingCallCount++;
                return nextEmbeddingVector;
            });
    });

    afterAll(async () => {
        // Cleanup
        await Lead.deleteMany({});
        await VectorStoreService.clearCollection();
        embeddingSpy.mockRestore();
        await mongoose.connection.close();
        console.log('[TEST] Cleanup complete.');
    });

    // ─── TEST 1: Cold Start (Heuristic Fallback) ───────────────────────────
    test('Cold Start: predictTactic should use heuristic fallback when Qdrant is empty', async () => {
        // Create Lead A in MongoDB
        leadA = await Lead.create(createMockLead({
            name: 'Plomería Norte',
            category: 'plumber'
        }));

        // Set the mock to return vector A
        nextEmbeddingVector = VECTOR_LEAD_A;

        // Run SPIDER V2 prediction
        const prediction = await SpiderEngine.predictTactic(leadA);

        // ASSERT: Source must be heuristic (Qdrant is empty)
        expect(prediction.source).toMatch(/HEURISTIC/);
        expect(prediction.predicted_tactic).toBeDefined();
        expect(prediction.predicted_tactic.length).toBeGreaterThan(0);
        expect(prediction.confidence).toBeGreaterThanOrEqual(0);

        // ASSERT: Embedding was generated
        expect(prediction.embedding).toBeDefined();
        expect(prediction.embedding).toHaveLength(1536);
        expect(embeddingSpy).toHaveBeenCalled();

        // Save the vector to MongoDB (simulating what EnrichmentWorker does)
        await Lead.findByIdAndUpdate(leadA._id, {
            $set: {
                'spider_memory.applied_tactic': prediction.predicted_tactic,
                'spider_memory.historical_confidence': prediction.confidence,
                'spider_memory.last_analyzed_at': new Date(),
                spider_context_vector: prediction.embedding
            }
        });

        // Verify it was saved
        const savedLead = await Lead.findById(leadA._id).select('+spider_context_vector');
        expect(savedLead.spider_context_vector).toHaveLength(1536);
        expect(savedLead.spider_memory.applied_tactic).toBe(prediction.predicted_tactic);

        console.log(`[TEST 1] ✅ Cold Start: tactic="${prediction.predicted_tactic}", source=${prediction.source}`);
    }, 15000);

    // ─── TEST 2: Ingestion (Cerrado Ganado → Qdrant Write) ─────────────────
    test('Ingestion: marking lead as "Cerrado Ganado" should ingest vector into Qdrant', async () => {
        // Use supertest to call the PATCH endpoint
        const response = await request(app)
            .patch(`/api/leads/${leadA._id}/status`)
            .send({ status: 'Cerrado Ganado', note: 'Integration test - WON' });

        // ASSERT: Endpoint returns 200
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('Cerrado Ganado');

        // Wait for async Qdrant ingestion to complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        // ASSERT: Vector is now searchable in Qdrant
        const searchResults = await VectorStoreService.searchSimilarLeads(
            VECTOR_LEAD_A,
            null, // No filter — search all
            5
        );

        expect(searchResults.length).toBeGreaterThanOrEqual(1);

        const wonResult = searchResults[0];
        expect(wonResult.payload.status).toBe('WON');
        expect(wonResult.payload.lead_id).toBe(leadA._id.toString());
        expect(wonResult.payload.tactic).toBeDefined();
        expect(wonResult.score).toBeGreaterThan(0.9); // Same vector, should be ~1.0

        console.log(`[TEST 2] ✅ Ingestion: Qdrant has ${searchResults.length} result(s), tactic="${wonResult.payload.tactic}", score=${wonResult.score.toFixed(4)}`);
    }, 15000);

    // ─── TEST 3: Vector Inference (Learn from Cerrado Ganado) ───────────────
    test('Inference: predictTactic for similar lead should return tactic from Qdrant', async () => {
        // Create Lead B (same niche, similar profile)
        leadB = await Lead.create(createMockLead({
            name: 'Plomería Sur',
            category: 'plumber',
            tech_stack: ['WordPress'],
            performance_metrics: {
                performanceScore: 38,
                ttfb: 2100,
                lcp: '3800',
                performance_issue: true
            }
        }));

        // Set the mock to return vector B (very close to A)
        nextEmbeddingVector = VECTOR_LEAD_B;

        // Run SPIDER V2 prediction for Lead B
        const prediction = await SpiderEngine.predictTactic(leadB);

        // ASSERT: Source MUST be QDRANT_VECTOR (learned from Lead A)
        expect(prediction.source).toBe('QDRANT_VECTOR');

        // ASSERT: Tactic must match what Lead A used (the winning tactic)
        const leadAData = await Lead.findById(leadA._id);
        expect(prediction.predicted_tactic).toBe(leadAData.spider_memory.applied_tactic);

        // ASSERT: Confidence should be high (vectors are very similar)
        expect(prediction.confidence).toBeGreaterThan(50);

        // ASSERT: Embedding was generated
        expect(prediction.embedding).toHaveLength(1536);

        console.log(`[TEST 3] ✅ Inference: tactic="${prediction.predicted_tactic}" (from Qdrant), confidence=${prediction.confidence}%, source=${prediction.source}`);
    }, 15000);

    // ─── TEST 4: Dissimilar lead should NOT match Qdrant ───────────────────
    test('Dissimilar lead should fall back to heuristic (no Qdrant match)', async () => {
        // Set the mock to return a completely different vector
        nextEmbeddingVector = VECTOR_LEAD_C;

        const leadC = await Lead.create(createMockLead({
            name: 'Restaurante Gourmet',
            category: 'restaurant',
            tech_stack: ['Wix'],
            performance_metrics: {
                performanceScore: 75,
                ttfb: 600,
                lcp: '1200',
                performance_issue: false
            }
        }));

        const prediction = await SpiderEngine.predictTactic(leadC);

        // ASSERT: Should NOT be from Qdrant (vector 0.9 vs 0.1 = low similarity)
        expect(prediction.source).toMatch(/HEURISTIC/);

        console.log(`[TEST 4] ✅ Dissimilar: tactic="${prediction.predicted_tactic}", source=${prediction.source} (correctly avoided Qdrant match)`);

        // Cleanup
        await Lead.findByIdAndDelete(leadC._id);
    }, 15000);
});
