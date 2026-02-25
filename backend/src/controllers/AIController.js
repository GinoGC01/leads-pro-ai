const Lead = require('../models/Lead');
const AIService = require('../services/AIService');
const SupabaseService = require('../services/SupabaseService');
const ragConfig = require('../config/rag.config');

class AIController {
    /**
     * Handle AI chat queries with RAG context
     */
    static async chat(req, res) {
        const { query, history, leadId } = req.body;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ error: 'La pregunta es obligatoria.' });
        }

        try {
            let retrievedLeads = [];

            if (leadId) {
                // Tactical context: fetch lead from MongoDB (Source of Truth for scores/SEO)
                console.log(`[AIController] Tactical Mode for lead: ${leadId}`);
                const mongoLead = await Lead.findById(leadId);

                if (mongoLead) {
                    // Build deterministic context from MongoDB
                    const structuredContent = ragConfig.ingestion.buildSemanticContent(mongoLead);

                    // Fetch extended deep-scrape content from Supabase
                    const vdbContent = await SupabaseService.getLeadContent(leadId);

                    // Merge: Priority to structured MongoDB data + extended Supabase scraping
                    const finalContent = `
                        DATOS ESTRUCTURADOS (Métricas CRM):
                        ${structuredContent}
                        
                        CONTENIDO EXTENDIDO (Web Scraping):
                        ${vdbContent?.content || 'Sin contenido extra de scraping disponible.'}
                    `.trim();

                    retrievedLeads = [{
                        name: mongoLead.name,
                        lead_id: leadId,
                        content: finalContent,
                        similarity: 1.0
                    }];
                }
            } else {
                // General RAG: similarity search
                const queryEmbedding = await AIService.generateEmbedding(query);
                retrievedLeads = await SupabaseService.searchSimilarLeads(queryEmbedding);
            }

            // 3. Generate response with Context-Aware LLM (gpt-4o-mini) and history
            const answer = await AIService.chatWithContext(query, retrievedLeads, history || []);

            // 4. Persist if tactical (lead-specific)
            if (leadId) {
                try {
                    await Lead.findByIdAndUpdate(leadId, { tactical_response: answer });
                } catch (persistErr) {
                    console.error('[AIController] Failed to persist tactical response:', persistErr.message);
                }
            }

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
