import Lead from '../models/Lead.js';
import ChatSession from '../models/ChatSession.js';
import AIService from '../services/AIService.js';
import SupabaseService from '../services/SupabaseService.js';
import SpiderEngine from '../services/SpiderEngine.js';
import ragConfig from '../config/rag.config.js';

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

    /**
     * Delete a chat session
     */
    static async deleteSession(req, res) {
        // ... (unchanged existing methods are above this block, this is just to append) 
    }

    /**
     * SPIDER Analysis Endpoint (Neuro-Symbolic)
     */
    static async spiderAnalysis(req, res) {
        const { leadId } = req.params;
        const forceRefresh = req.query.forceRefresh === 'true';

        try {
            const lead = await Lead.findById(leadId);
            if (!lead) {
                return res.status(404).json({ error: 'Lead no encontrado' });
            }

            // 1. Capa Simbólica (Determinista + ML) - Costo 0 Tokens
            const spiderVerdict = await SpiderEngine.analyzeLead(lead);

            // CACHE HIT LOGIC: Si no se fuerza refresco y ya hay un playbook generado para esta táctica
            if (!forceRefresh && lead.spider_memory && lead.spider_memory.generated_playbook) {
                console.log(`[AIController] Spider Cache Hit (Tokens guardados) para Lead: ${leadId}`);
                return res.status(200).json({
                    spider_verdict: spiderVerdict, // Veredicto fresh calculado
                    mario_strategy: lead.spider_memory.generated_playbook
                });
            }

            console.log(`[AIController] Spider Cache Miss/Force Refresh. LLM run para: ${leadId}`);

            // 2. Capa Neuronal (LLM Persona)
            const marioResponse = await AIService.chatWithSpiderContext(spiderVerdict);

            // Persist the strategic tactical response and memory for future ML loops
            lead.spider_memory = {
                applied_tactic: spiderVerdict.tactic_name,
                friction_score: spiderVerdict.friction_score,
                historical_confidence: spiderVerdict.historical_confidence,
                generated_playbook: marioResponse,
                last_analyzed_at: new Date()
            };
            lead.tactical_response = marioResponse;
            await lead.save();

            return res.status(200).json({
                spider_verdict: spiderVerdict,
                mario_strategy: marioResponse
            });

        } catch (error) {
            console.error('[AIController - Spider] Error:', error);
            res.status(500).json({ error: 'Error procesando la estrategia Spider/Mario' });
        }
    }
}

export default AIController;


