const { OpenAI } = require('openai');
const ragConfig = require('../config/rag.config');

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
${contextPrompt}
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
}

module.exports = AIService;
