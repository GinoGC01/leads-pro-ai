import { QdrantClient } from "@qdrant/js-client-rest";

const COLLECTIONS = {
  SPIDER_MEMORY: "spider_memory",
  MARIO_KNOWLEDGE: "mario_knowledge",
};
const VECTOR_DIM = 1536; // text-embedding-3-small

/**
 * VectorStoreService — Multi-Collection Qdrant Singleton.
 *
 * Collections:
 *   - spider_memory: Tácticas ganadoras (WON leads) para predicción de SPIDER V2.
 *   - mario_knowledge: Conocimiento RAG de leads enriquecidos para MARIO AI.
 *
 * ARCHITECTURE RULES:
 *   - spider_memory.upsert: ONLY from markLeadAsWon (SearchController).
 *   - mario_knowledge.upsert: From EnrichmentWorker (FASE 4).
 *   - Workers are READ-ONLY for spider_memory.
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
      const url = process.env.QDRANT_URL || "http://localhost:6333";
      this._client = new QdrantClient({ url });
      console.log(`[VectorStore] Qdrant client initialized → ${url}`);
    }
    return this._client;
  }

  /**
   * Ensure both collections exist (1536D, Cosine).
   * Called once at server startup.
   */
  async initializeCollections() {
    try {
      const client = this.getClient();
      const existing = await client.getCollections();
      const existingNames = existing.collections.map((c) => c.name);

      for (const colName of Object.values(COLLECTIONS)) {
        if (!existingNames.includes(colName)) {
          await client.createCollection(colName, {
            vectors: { size: VECTOR_DIM, distance: "Cosine" },
          });
          console.log(
            `[VectorStore] ✅ Collection "${colName}" created (${VECTOR_DIM}D, Cosine).`,
          );
        } else {
          console.log(`[VectorStore] Collection "${colName}" already exists.`);
        }
      }
      this._initialized = true;
    } catch (err) {
      console.error(
        `[VectorStore] ⚠️ Qdrant initialization failed (non-blocking): ${err.message}`,
      );
    }
  }

  // Legacy alias for backwards compatibility (server.js)
  async initializeCollection() {
    return this.initializeCollections();
  }

  // ─── GENERIC CRUD ──────────────────────────────────────────────────

  /**
   * Insert or update a vector in any collection.
   * @param {string} collectionName - Target collection
   * @param {string} id - Document ID (will be hashed for Qdrant)
   * @param {number[]} vector - 1536D embedding
   * @param {Object} payload - Metadata payload
   */
  async upsertVector(collectionName, id, vector, payload) {
    try {
      const client = this.getClient();
      await client.upsert(collectionName, {
        wait: true,
        points: [
          {
            id: this._hashId(id),
            vector,
            payload: { doc_id: id, ...payload },
          },
        ],
      });
      return true;
    } catch (err) {
      console.error(
        `[VectorStore] ⚠️ Upsert to "${collectionName}" failed: ${err.message}`,
      );
      return false;
    }
  }

  /**
   * Search for similar vectors in any collection.
   * @param {string} collectionName - Target collection
   * @param {number[]} vector - Query embedding
   * @param {Object} [filter] - Qdrant filter
   * @param {number} [limit=5] - Max results
   * @param {number} [scoreThreshold=0.3] - Min similarity
   */
  async searchSimilar(
    collectionName,
    vector,
    filter = null,
    limit = 5,
    scoreThreshold = 0.3,
  ) {
    try {
      const client = this.getClient();
      const searchParams = {
        vector,
        limit,
        with_payload: true,
        score_threshold: scoreThreshold,
      };
      if (filter) searchParams.filter = filter;

      const results = await client.search(collectionName, searchParams);
      return results || [];
    } catch (err) {
      console.error(
        `[VectorStore] ⚠️ Search in "${collectionName}" failed: ${err.message}`,
      );
      return [];
    }
  }

  /**
   * Delete vectors by their document IDs.
   * @param {string} collectionName - Target collection
   * @param {string[]} docIds - Array of document IDs
   */
  async deleteVectors(collectionName, docIds) {
    try {
      const client = this.getClient();
      const pointIds = docIds.map((id) => this._hashId(id));
      await client.delete(collectionName, {
        wait: true,
        points: pointIds,
      });
      console.log(
        `[VectorStore] 🗑️ Deleted ${pointIds.length} vectors from "${collectionName}".`,
      );
      return true;
    } catch (err) {
      console.error(
        `[VectorStore] ⚠️ Delete from "${collectionName}" failed: ${err.message}`,
      );
      return false;
    }
  }

  /**
   * Retrieve a single vector's payload by document ID.
   * @param {string} collectionName - Target collection
   * @param {string} docId - Document ID
   */
  async getPayload(collectionName, docId) {
    try {
      const client = this.getClient();
      const pointId = this._hashId(docId);
      const results = await client.retrieve(collectionName, {
        ids: [pointId],
        with_payload: true,
      });
      return results?.[0]?.payload || null;
    } catch (err) {
      console.error(
        `[VectorStore] ⚠️ Retrieve from "${collectionName}" failed: ${err.message}`,
      );
      return null;
    }
  }

  // ─── SPIDER-SPECIFIC ALIASES (backwards compat) ────────────────────

  async upsertLeadVector(leadId, vector, payload) {
    return this.upsertVector(
      COLLECTIONS.SPIDER_MEMORY,
      leadId,
      vector,
      payload,
    );
  }

  async searchSimilarLeads(vector, filter = null, limit = 5) {
    return this.searchSimilar(
      COLLECTIONS.SPIDER_MEMORY,
      vector,
      filter,
      limit,
      0.65,
    );
  }

  // ─── ISOLATED DELETION (AGENT-SCOPED) ────────────────────────────

  /**
   * Delete all vectors belonging to a specific document, scoped by agent.
   * Uses Qdrant's filter-based deletion to avoid touching other agents' data.
   * @param {string} collectionName - Target collection
   * @param {string} documentId - The UUID document_id stored in payload
   * @param {string} agentId - The agent owner (e.g. 'MARIO')
   */
  async deleteByDocumentId(collectionName, documentId, agentId = 'MARIO') {
    try {
      const client = this.getClient();
      await client.delete(collectionName, {
        wait: true,
        filter: {
          must: [
            { key: 'document_id', match: { value: documentId } },
            { key: 'agent_id', match: { value: agentId } }
          ]
        }
      });
      console.log(`[VectorStore] 🗑️ Deleted vectors for document "${documentId}" (agent: ${agentId}) from "${collectionName}".`);
      return true;
    } catch (err) {
      console.error(`[VectorStore] ⚠️ deleteByDocumentId failed: ${err.message}`);
      return false;
    }
  }

  /**
   * Flush ALL vectors belonging to a specific agent from a collection.
   * NEVER drops the collection — only removes vectors matching the agent_id filter.
   * @param {string} collectionName - Target collection
   * @param {string} agentId - The agent owner (e.g. 'MARIO')
   */
  async flushByAgent(collectionName, agentId = 'MARIO') {
    try {
      const client = this.getClient();
      await client.delete(collectionName, {
        wait: true,
        filter: {
          must: [
            { key: 'agent_id', match: { value: agentId } }
          ]
        }
      });
      console.log(`[VectorStore] 🧹 Flushed all vectors for agent "${agentId}" from "${collectionName}".`);
      return true;
    } catch (err) {
      console.error(`[VectorStore] ⚠️ flushByAgent failed: ${err.message}`);
      return false;
    }
  }

  // ─── UTILITIES ─────────────────────────────────────────────────────

  /**
   * Convert a MongoDB ObjectId string to a Qdrant-compatible unsigned integer.
   */
  _hashId(mongoId) {
    let hash = 0;
    const str = mongoId.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash >>> 0;
    }
    return hash || 1;
  }
}

export { COLLECTIONS };
export default new VectorStoreService();
