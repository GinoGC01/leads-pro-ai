const { createClient } = require('@supabase/supabase-js');
const ragConfig = require('../config/rag.config');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('CRITICAL: Supabase credentials missing in .env');
}

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ANON_KEY || ''
);

class SupabaseService {
    /**
     * Upsert a lead with its embedding and metadata into Supabase
     */
    static async upsertLeadVector(leadData, embedding) {
        try {
            const { error } = await supabase
                .from('business_leads')
                .upsert({
                    lead_id: leadData.lead_id,
                    name: leadData.name,
                    metadata: leadData.metadata,
                    content: leadData.content,
                    embedding: embedding
                }, { onConflict: 'lead_id' });

            if (error) {
                console.error('[Supabase] Upsert Error:', error.message);
                throw error;
            }
        } catch (err) {
            console.error('[Supabase] Critical Service Error:', err.message);
            throw err;
        }
    }

    /**
     * Search for similar leads using vector similarity RPC
     */
    static async searchSimilarLeads(queryEmbedding) {
        try {
            console.log(`[RAG-DEBUG] Iniciando búsqueda vectorial. Umbral: ${ragConfig.vector.similarityThreshold}, Límit: ${ragConfig.vector.maxResults}`);
            const { data, error } = await supabase.rpc('match_leads', {
                query_embedding: queryEmbedding,
                match_threshold: ragConfig.vector.similarityThreshold,
                match_count: ragConfig.vector.maxResults
            });

            if (error) {
                console.error('[Supabase] RPC Search Error:', error.message);
                throw error;
            }

            console.log(`[RAG-DEBUG] Búsqueda finalizada. Resultados crudos: ${data ? data.length : 0}`);
            return data || [];
        } catch (err) {
            console.error('[Supabase] Search Service Error:', err.message);
            return [];
        }
    }
}

module.exports = SupabaseService;
