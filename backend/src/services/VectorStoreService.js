import { QdrantClient } from '@qdrant/js-client-rest';

const COLLECTION_NAME = 'spider_memory';
const VECTOR_DIM = 1536; // text-embedding-3-small

/**
 * VectorStoreService — Qdrant Singleton for SPIDER V2.
 * Handles collection lifecycle, vector search, and deferred ingestion.
 * 
 * ARCHITECTURE RULE: upsertLeadVector is ONLY called from markLeadAsWon (Controller),
 * NEVER from Workers. Workers are READ-ONLY consumers.
 */
class VectorStoreService {
    constructor() {
        this._client = null;
        this._initialized = false;
    }

    /**
     * Lazy singleton — connects to Qdrant on first call.
     */
    getClient() {
        if (!this._client) {
            const url = process.env.QDRANT_URL || 'http://localhost:6333';
            this._client = new QdrantClient({ url });
            console.log(`[VectorStore] Qdrant client initialized → ${url}`);
        }
        return this._client;
    }

    /**
     * Ensure the spider_memory collection exists (1536D, Cosine).
     * Called once at server startup.
     */
    async initializeCollection() {
        try {
            const client = this.getClient();
            const collections = await client.getCollections();
            const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

            if (!exists) {
                await client.createCollection(COLLECTION_NAME, {
                    vectors: {
                        size: VECTOR_DIM,
                        distance: 'Cosine'
                    }
                });
                console.log(`[VectorStore] ✅ Collection "${COLLECTION_NAME}" created (${VECTOR_DIM}D, Cosine).`);
            } else {
                console.log(`[VectorStore] Collection "${COLLECTION_NAME}" already exists.`);
            }
            this._initialized = true;
        } catch (err) {
            console.error(`[VectorStore] ⚠️ Qdrant initialization failed (non-blocking): ${err.message}`);
            // Non-blocking — pipeline will use heuristic fallback
        }
    }

    /**
     * Insert or update a lead vector in Qdrant.
     * ONLY called from the "Won" lifecycle hook (markLeadAsWon).
     * 
     * @param {string} leadId - MongoDB _id as string
     * @param {number[]} vector - 1536D embedding
     * @param {Object} payload - { niche, tech_stack, tactic, status, performance_score, friction_score }
     */
    async upsertLeadVector(leadId, vector, payload) {
        try {
            const client = this.getClient();
            await client.upsert(COLLECTION_NAME, {
                wait: true,
                points: [{
                    id: this._hashId(leadId),
                    vector,
                    payload: {
                        lead_id: leadId,
                        ...payload
                    }
                }]
            });
            console.log(`[VectorStore] ✅ Lead vectorized in Qdrant: ${leadId}`);
            return true;
        } catch (err) {
            console.error(`[VectorStore] ⚠️ Upsert failed (non-blocking): ${err.message}`);
            return false;
        }
    }

    /**
     * Search for similar leads in the spider_memory collection.
     * Used by Workers in READ-ONLY mode for tactic prediction.
     * 
     * @param {number[]} vector - Query embedding (1536D)
     * @param {Object} [filter] - Optional Qdrant filter object
     * @param {number} [limit=5] - Max results
     * @returns {Array} Matching points with payload
     */
    async searchSimilarLeads(vector, filter = null, limit = 5) {
        try {
            const client = this.getClient();
            const searchParams = {
                vector,
                limit,
                with_payload: true,
                score_threshold: 0.65 // Only strong semantic matches
            };

            if (filter) {
                searchParams.filter = filter;
            }

            const results = await client.search(COLLECTION_NAME, searchParams);
            return results || [];
        } catch (err) {
            console.error(`[VectorStore] ⚠️ Search failed (fallback to heuristic): ${err.message}`);
            return []; // Graceful degradation — SpiderEngine uses heuristic
        }
    }

    /**
     * Delete all points from the collection (for testing/reset).
     * Drops and recreates the collection to ensure a clean slate.
     */
    async clearCollection() {
        try {
            const client = this.getClient();
            const collections = await client.getCollections();
            const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
            if (exists) {
                await client.deleteCollection(COLLECTION_NAME);
            }
            await client.createCollection(COLLECTION_NAME, {
                vectors: { size: VECTOR_DIM, distance: 'Cosine' }
            });
            console.log(`[VectorStore] 🧹 Collection "${COLLECTION_NAME}" cleared and recreated.`);
        } catch (err) {
            console.error(`[VectorStore] ⚠️ clearCollection failed: ${err.message}`);
        }
    }

    /**
     * Convert a MongoDB ObjectId string to a Qdrant-compatible unsigned integer.
     * Uses a simple hash to map the 24-char hex string to a positive integer.
     */
    _hashId(mongoId) {
        let hash = 0;
        const str = mongoId.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash >>> 0; // Convert to unsigned 32-bit
        }
        return hash || 1; // Qdrant IDs must be > 0
    }
}

export default new VectorStoreService();
