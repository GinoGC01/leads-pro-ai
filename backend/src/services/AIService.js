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
            const systemPrompt = ragConfig.prompts.system;
            const contextPrompt = ragConfig.prompts.buildChatContext(query, retrievedLeads);

            // Construct messages array with system prompt, history, and current context-aware prompt
            const messages = [
                { role: "system", content: systemPrompt },
                ...history.slice(-6).map(m => ({
                    role: m.role,
                    content: m.text || m.content // Handle both frontend and backend formats
                })),
                { role: "user", content: contextPrompt }
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
