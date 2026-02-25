require('dotenv').config();
const AIService = require('../src/services/AIService');
const SupabaseService = require('../src/services/SupabaseService');
const ragConfig = require('../src/config/rag.config');

async function runDiagnostic() {
    console.log('🧪 Iniciando Diagnóstico del Sistema RAG AI...\n');

    // 1. Verificar variables de entorno
    const missingVars = [];
    if (!process.env.OPENAI_API_KEY) missingVars.push('OPENAI_API_KEY');
    if (!process.env.SUPABASE_URL) missingVars.push('SUPABASE_URL');
    if (!process.env.SUPABASE_ANON_KEY) missingVars.push('SUPABASE_ANON_KEY');

    if (missingVars.length > 0) {
        console.error(`❌ Faltan variables en el .env: ${missingVars.join(', ')}`);
        process.exit(1);
    }
    console.log('✅ Variables de entorno cargadas correctamente.');

    try {
        // 2. Probar Generación de Embeddings (OpenAI)
        console.log('\n[OpenAI] Generando embedding de prueba...');
        const testText = "Esta es una prueba de diagnóstico para el sistema de leads.";
        const embedding = await AIService.generateEmbedding(testText);
        console.log(`✅ Embedding generado exitosamente (${embedding.length} dimensiones).`);

        // 3. Probar Conexión y Búsqueda en Supabase
        console.log('\n[Supabase] Probando búsqueda vectorial (RPC match_leads)...');
        const searchResults = await SupabaseService.searchSimilarLeads(embedding);
        console.log(`✅ Conexión con Supabase establecida.`);
        console.log(`📊 Búsqueda completada. Resultados encontrados: ${searchResults.length}`);

        // 4. Probar Chat con Contexto (GPT-4o-mini)
        console.log('\n[AI Chat] Probando razonamiento con gpt-4o-mini...');
        const dummyContext = [
            {
                lead_id: 'test_123',
                name: 'Empresa de Prueba SA',
                content: 'Empresa especializada en marketing digital en Miami con un TTFB de 200ms.'
            }
        ];
        const query = "¿Qué sabes sobre la Empresa de Prueba SA?";
        const answer = await AIService.chatWithContext(query, dummyContext);

        console.log('\n----- RESPUESTA DE LA IA -----');
        console.log(answer);
        console.log('------------------------------');

        if (answer.includes('Empresa de Prueba SA')) {
            console.log('\n✨ DIAGNÓSTICO EXITOSO: El sistema RAG está operando correctamente.');
        } else {
            console.log('\n⚠️ ADVERTENCIA: La IA respondió pero no parece haber usado el contexto correctamente.');
        }

    } catch (error) {
        console.error('\n💥 ERROR DURANTE EL DIAGNÓSTICO:');
        console.error(error.message);
        if (error.message.includes('match_leads')) {
            console.warn('\n💡 TIP: Asegúrate de haber ejecutado el script SQL en el panel de Supabase.');
        }
    }
}

runDiagnostic();
