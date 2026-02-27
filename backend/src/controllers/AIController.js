const Lead = require('../models/Lead');
const ChatSession = require('../models/ChatSession');
const AIService = require('../services/AIService');
const SupabaseService = require('../services/SupabaseService');
const ragConfig = require('../config/rag.config');

class AIController {
    /**
     * Handle AI chat queries with RAG context
     */
    static async chat(req, res) {
        const { query, history, leadId, campaignId, sessionId } = req.body;

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

                // 3. Generate response with Context-Aware LLM
                var answer = await AIService.chatWithContext(query, retrievedLeads, history || []);

            } else if (campaignId && !leadId) {
                // Macro-RAG: Aggregate Campaign Context for general queries
                console.log(`[AIController] Macro Mode for campaign: ${campaignId}`);
                const campaignLeadsDataString = await AIService.buildCampaignContext(campaignId);

                // 3. Generate response with strict Data Analyst System Prompt
                var answer = await AIService.chatWithMacroContext(query, campaignLeadsDataString, history || []);

                retrievedLeads = [{
                    name: 'Base de Datos de Campaña Completa',
                    lead_id: campaignId,
                    similarity: 1.0
                }];

            } else {
                // General RAG: similarity search
                const queryEmbedding = await AIService.generateEmbedding(query);
                retrievedLeads = await SupabaseService.searchSimilarLeads(queryEmbedding);

                // 3. Generate response with Context-Aware LLM
                var answer = await AIService.chatWithContext(query, retrievedLeads, history || []);
            }

            // 4. Persist if tactical (lead-specific)
            if (leadId) {
                try {
                    await Lead.findByIdAndUpdate(leadId, { tactical_response: answer });
                } catch (persistErr) {
                    console.error('[AIController] Failed to persist tactical response:', persistErr.message);
                }
            }

            // 5. Persist Chat Session
            let currentSessionId = sessionId;
            try {
                let session;
                if (currentSessionId) {
                    session = await ChatSession.findById(currentSessionId);
                }

                if (!session) {
                    // Create new session
                    const titleWords = query.split(' ').slice(0, 4).join(' ');
                    const title = titleWords ? titleWords + '...' : 'Nueva Conversación';

                    session = new ChatSession({
                        title: title,
                        campaignId: campaignId || null,
                        leadId: leadId || null,
                        messages: []
                    });

                    // Add legacy history if it's the first time saving but frontend sent history
                    if (history && history.length > 0) {
                        history.forEach(msg => {
                            if (msg.role !== 'system') {
                                session.messages.push({
                                    role: msg.role,
                                    content: msg.text || msg.content
                                });
                            }
                        });
                    }
                }

                // Push current interaction
                session.messages.push({
                    role: 'user',
                    content: query
                });

                session.messages.push({
                    role: 'assistant',
                    content: answer,
                    sources: retrievedLeads.map(l => ({
                        name: l.name,
                        id: l.lead_id,
                        similarity: l.similarity
                    }))
                });

                await session.save();
                currentSessionId = session._id;
            } catch (sessionErr) {
                console.error('[AIController] Failed to persist chat session:', sessionErr.message);
            }

            res.status(200).json({
                success: true,
                answer,
                sessionId: currentSessionId,
                sessionTitle: currentSessionId ? undefined : 'Nueva Conversación',
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
