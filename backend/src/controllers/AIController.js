const AIService = require('../services/AIService');
const SupabaseService = require('../services/SupabaseService');

class AIController {
    /**
     * Handle AI chat queries with RAG context
     */
    static async chat(req, res) {
        const { query, history } = req.body;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ error: 'La pregunta es obligatoria.' });
        }

        try {
            // 1. Generate query embedding for similarity search
            const queryEmbedding = await AIService.generateEmbedding(query);

            // 2. Retrieve relevant leads from Supabase (pgvector)
            const retrievedLeads = await SupabaseService.searchSimilarLeads(queryEmbedding);

            // 3. Generate response with Context-Aware LLM (gpt-4o-mini) and history
            const answer = await AIService.chatWithContext(query, retrievedLeads, history || []);

            res.status(200).json({
                success: true,
                answer,
                sources: retrievedLeads.map(l => ({
                    name: l.name,
                    id: l.lead_id,
                    similarity: l.similarity
                }))
            });
        } catch (error) {
            console.error('[AIController] Chat Error:', error);
            res.status(500).json({
                success: false,
                message: 'No pude procesar tu consulta de IA en este momento.',
                error: error.message
            });
        }
    }
}

module.exports = AIController;
