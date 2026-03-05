import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { addLeadToEnrichment } from '../services/QueueService.js';
import Lead from '../models/Lead.js';
// Load .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

import connectDB from '../config/db.js';

async function testFullPipeline() {
    console.log('🧪 INICIANDO TEST DE ENGINE COMPLETO (FASES 0-4)\n');

    try {
        // 1. Conectar a DB primero
        await connectDB();
        console.log('✅ MongoDB conectado.');

        // 1.5 Safe Queue Sanitization (Dev/Test only)
        if (process.env.NODE_ENV !== 'production') {
            console.log('🧹 Purging potential ghost jobs in development queue...');
        }
        await import('../workers/EnrichmentWorker.js');

        // 3. Crear un Lead de prueba con una URL real
        const testAgency = {
            placeId: 'test_agency_' + Date.now(),
            name: 'Vercel Inc',
            website: 'https://vercel.com',
            searchId: new mongoose.Types.ObjectId(),
            location: { lat: 0, lng: 0 }
        };

        console.log(`📡 Creando lead de prueba: ${testAgency.name}...`);
        const createdLead = await Lead.create(testAgency);
        console.log(`✅ Lead creado en MongoDB: ${createdLead._id}`);

        // 4. Encolar para enriquecimiento
        console.log('📦 Encolando para procesamiento asíncrono...');
        await addLeadToEnrichment(createdLead);

        console.log('\n⌛ Esperando a que el Worker procese las 4 fases...');

        let attempts = 0;
        const maxAttempts = 20;

        const interval = setInterval(async () => {
            const updated = await Lead.findById(createdLead._id);
            attempts++;

            if (updated.enrichmentStatus === 'completed') {
                clearInterval(interval);
                console.log('\n✨ [RESULTADO] ENRIQUECIMIENTO FINALIZADO CON ÉXITO');
                console.log('--------------------------------------------------');
                console.log(`🔍 SEO Audit: ${updated.seo_audit ? '✅ Encontrado' : '❌ Falló'}`);
                console.log(`🛠️  Tech Stack: ${updated.tech_stack.length} tecnologías detectadas.`);
                console.log(`⚡ Performance: ${updated.performance_metrics?.performanceScore}/100 (LCP: ${updated.performance_metrics?.lcp})`);
                console.log('--------------------------------------------------');
                process.exit(0);
            } else if (updated.enrichmentStatus === 'failed') {
                clearInterval(interval);
                console.log('\n❌ [RESULTADO] EL ENRIQUECIMIENTO FALLÓ.');
                process.exit(1);
            } else {
                console.log(`[${attempts}/${maxAttempts}] Estado actual: ${updated.enrichmentStatus}...`);
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    console.log('\n⚠️ [TIEMPO AGOTADO] El enriquecimiento está tomando demasiado tiempo.');
                    process.exit(1);
                }
            }
        }, 5000);

    } catch (error) {
        console.error('❌ Error fatal en el test:', error);
        process.exit(1);
    }
}

testFullPipeline();
