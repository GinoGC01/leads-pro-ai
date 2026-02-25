require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('../src/models/Lead');
const AIService = require('../src/services/AIService');
const SupabaseService = require('../src/services/SupabaseService');
const ragConfig = require('../src/config/rag.config');

async function testFullFlow() {
    console.log('🔍 Iniciando Test de Flujo Completo (Discovery -> DB -> RAG -> IA)...');

    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leads-pro');
        console.log('✅ MongoDB Conectado.');

        // 1. Crear Lead de Prueba
        const mockLeadData = {
            placeId: "test_" + Date.now(),
            name: "Estetica Avanzada Test",
            address: "Calle Falsa 123, Miami",
            website: "https://estetica-test.com",
            rating: 4.8,
            userRatingsTotal: 120,
            searchId: new mongoose.Types.ObjectId(),
            tech_stack: ["Wix"],
            performance_metrics: { ttfb: 2.5, performance_issue: true },
            is_advertising: true,
            is_zombie: false,
            leadOpportunityScore: 95,
            opportunityLevel: 'Critical',
            sales_angle: "Lead de prueba para verificación RAG"
        };

        const created = await Lead.create(mockLeadData);
        console.log(`✅ Lead guardado en MongoDB: ${created.name} (${created._id})`);

        // 2. Sincronizar con RAG
        console.log('📡 Sincronizando con Supabase (Vectores)...');
        const semanticContent = ragConfig.ingestion.buildSemanticContent(created);
        const embedding = await AIService.generateEmbedding(semanticContent);

        await SupabaseService.upsertLeadVector({
            lead_id: created._id.toString(),
            name: created.name,
            content: semanticContent,
            metadata: { category: 'Test', location: 'Miami' }
        }, embedding);
        console.log('✅ Lead vectorizado y guardado en Supabase.');

        // 3. Probar Recuperación y Chat
        console.log('🤖 Probando consulta de IA...');
        const query = "¿A qué estetica de Miami debería venderle mis servicios primero?";
        const queryEmbedding = await AIService.generateEmbedding(query);
        const retrieved = await SupabaseService.searchSimilarLeads(queryEmbedding);

        console.log(`📊 RAG recuperó ${retrieved.length} leads relevantes.`);

        const answer = await AIService.chatWithContext(query, retrieved);
        console.log('\n--- RESPUESTA FINAL DE LA IA ---');
        console.log(answer);
        console.log('------------------------------');

        if (answer.toLowerCase().includes('estetica avanzada test')) {
            console.log('\n🏆 ÉXITO: El sistema funciona end-to-end.');
        } else {
            console.log('\n⚠️ EL SISTEMA RESPONDIÓ PERO NO CITÓ EL LEAD DE PRUEBA.');
        }

    } catch (err) {
        console.error('\n❌ ERROR CRÍTICO:', err.message);
        console.error(err.stack);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

testFullFlow();
