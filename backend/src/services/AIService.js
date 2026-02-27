const { OpenAI } = require('openai');
const ragConfig = require('../config/rag.config');
const Lead = require('../models/Lead');

if (!process.env.OPENAI_API_KEY) {
    console.error('CRITICAL: OPENAI_API_KEY missing in .env');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

class AIService {
    /**
     * Generate embedding vector for a piece of text
     */
    static async generateEmbedding(text) {
        try {
            const response = await openai.embeddings.create({
                model: ragConfig.vector.model,
                input: text,
                encoding_format: "float",
            });
            return response.data[0].embedding;
        } catch (err) {
            console.error('[OpenAI] Embedding Error:', err.message);
            throw err;
        }
    }

    /**
     * Chat with GPT-4o-mini using retrieved context and conversation history
     */
    static async chatWithContext(query, retrievedLeads, history = []) {
        try {
            const systemPrompt = `Eres un Closer de Ventas B2B de élite trabajando EXCLUSIVAMENTE para la agencia descrita a continuación.

[CONTEXTO DE TU AGENCIA - TU IDENTIDAD Y OFERTA]
${ragConfig.agency.raw}

Tu objetivo absoluto es analizar al prospecto y redactar comunicaciones o estrategias para VENDER LOS SERVICIOS de tu agencia. 

REGLAS DE ORO:
1. NO ALUCINES SERVICIOS: Solo ofrece lo que está en [CONTEXTO DE TU AGENCIA]. Si el lead tiene un problema que no resolvemos, ignora ese problema y enfócate en lo que SÍ vendemos.
2. ALINEACIÓN ESTRATÉGICA: Usa los datos del prospecto para justificar por qué NUESTRA oferta es la solución lógica.
3. TONO: Directo, asimétrico, experto y orientado al cierre.

[DATOS EMPÍRICOS DEL PROSPECTO]
${retrievedLeads.map(l => {
                const isNoWeb = !l.website;
                if (isNoWeb) {
                    return `[ESTADO DIGITAL DEL LEAD]: INEXISTENTE. El lead no posee dominio web registrado. Solo cuenta con su presencia básica en Google Maps.
Su reputación es de ${l.rating || 'N/A'} estrellas basada en ${l.userRatingsTotal || 0} opiniones.
Nombre: ${l.name}
Categoría: ${l.category || 'General'}
Dirección: ${l.address || 'No proporcionada'}`;
                }
                return `LEAD [ID: ${l.lead_id}]: ${l.name} | Contexto Semántico: ${l.content}`;
            }).join('\n')}
`;

            // Construct messages array with system prompt, history, and current context-aware prompt
            const messages = [
                { role: "system", content: systemPrompt },
                ...history.slice(-6).map(m => ({
                    role: m.role,
                    content: m.text || m.content // Handle both frontend and backend formats
                })),
                { role: "user", content: query }
            ];

            const response = await openai.chat.completions.create({
                model: ragConfig.llm.model,
                messages: messages,
                temperature: ragConfig.llm.temperature,
                max_tokens: ragConfig.llm.max_tokens,
            });

            return response.choices[0].message.content;
        } catch (err) {
            console.error('[OpenAI] Chat Error:', err.message);
            throw new Error(`AI Chat Service failed: ${err.message}`);
        }
    }

    /**
     * Build Deterministic Campaign Context (Macro-RAG)
     */
    static async buildCampaignContext(campaignId) {
        try {
            const leads = await Lead.find({
                searchId: campaignId,
                enrichmentStatus: 'completed'
            }).lean();

            if (!leads || leads.length === 0) {
                return "No hay leads procesados y enriquecidos en esta campaña aún.";
            }

            const dataString = leads.map((l, index) => {
                const webStatus = l.performance_metrics?.performanceScore
                    ? `Score: ${l.performance_metrics.performanceScore}, LCP: ${l.performance_metrics.lcp || 'N/A'}`
                    : 'Desconocido';

                const seoStatus = l.seo_audit
                    ? `H1: ${l.seo_audit.h1Count || 0}, Meta: ${l.seo_audit.hasMetaDescription ? 'Sí' : 'No'}`
                    : 'Desconocido';

                const stack = l.tech_stack?.length > 0 ? l.tech_stack.join(', ') : 'Desconocido';

                return `[Nro: ${index + 1}] Nombre: ${l.name} | Score: ${l.leadOpportunityScore} | Web: ${webStatus} | SEO: ${seoStatus} | Stack: ${stack}`;
            }).join('\n');

            return dataString;
        } catch (error) {
            console.error('[AIService] Error building campaign context:', error);
            throw error;
        }
    }

    /**
     * Chat with GPT using Macro-RAG Deterministic Campaign Context
     */
    static async chatWithMacroContext(query, campaignLeadsDataString, history = []) {
        try {
            const systemPrompt = `Eres un Analista de Datos de Ventas B2B trabajando para la agencia ${ragConfig.agency.name || '[Nombre Agencia]'}.

BASE DE DATOS DE LA CAMPAÑA ACTUAL:
${campaignLeadsDataString}

REGLAS ESTRICTAS:
1. Si el usuario te pide "el mejor prospecto", "el más probable", o "el peor", DEBES elegir un NOMBRE ESPECÍFICO de la lista de arriba.
2. NUNCA des consejos genéricos o teóricos sobre "el sector". Habla SOLO de los datos empíricos que tienes en la lista.
3. Justifica tu elección basándote en el cruce entre los fallos de su web (lentitud, mal SEO, stack obsoleto) y los servicios que vende nuestra agencia.
4. Sé directo, analítico y ve al grano.`;

            const messages = [
                { role: "system", content: systemPrompt },
                ...history.slice(-6).map(m => ({
                    role: m.role,
                    content: m.text || m.content
                })),
                { role: "user", content: query }
            ];

            const response = await openai.chat.completions.create({
                model: ragConfig.llm.model,
                messages: messages,
                temperature: ragConfig.llm.temperature,
                max_tokens: ragConfig.llm.max_tokens,
            });

            return response.choices[0].message.content;
        } catch (err) {
            console.error('[OpenAI] Macro Chat Error:', err.message);
            throw new Error(`AI Macro Chat Service failed: ${err.message}`);
        }
    }
}

module.exports = AIService;
