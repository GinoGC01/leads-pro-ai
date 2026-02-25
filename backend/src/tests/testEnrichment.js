const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const ScraperService = require('../services/ScraperService');
const { connection, addLeadToEnrichment } = require('../services/QueueService');

async function runTests() {
    console.log('🧪 INICIANDO TEST DE ENRIQUECIMIENTO ASÍNCRONO (FASES 0 & 1)\n');

    // 1. Test de Conexión a Redis
    console.log('--- 1. Verificando Conexión a Redis ---');
    try {
        await connection.ping();
        console.log('✅ Redis conectado correctamente.\n');
    } catch (err) {
        console.error('⚠️ Error de conexión a Redis:', err.message);
        console.log('⚠️ Saltando pruebas de cola. Asegúrate de que Redis esté corriendo para producción.\n');
        // No exit, let's continue with Scraper tests
    }

    // 2. Test de ScraperService (Level 1: Got-Scraping)
    console.log('--- 2. Probando ScraperService - Nivel 1 (Got-Scraping) ---');
    const testUrl = 'https://example.com';
    try {
        const html = await ScraperService.getRawHtml(testUrl);
        console.log(`✅ Extracción exitosa de ${testUrl}. Tamaño: ${html.length} bytes.`);
        if (html.includes('<title>Example Domain</title>')) {
            console.log('✅ Contenido verificado correctamente.\n');
        } else {
            console.warn('⚠️ El contenido no parece ser el esperado (posible bloqueo o cambio).\n');
        }
    } catch (err) {
        console.error('❌ Error en ScraperService:', err.message, '\n');
    }

    // 3. Test de ScraperService (Level 2: Puppeteer Fallback)
    // Probamos con una URL que suele ser más restrictiva o forzamos el fallback
    console.log('--- 3. Probando ScraperService - Nivel 2 (Puppeteer Fallback) ---');
    try {
        const htmlFallback = await ScraperService.getPuppeteerFallback('https://www.google.com');
        console.log(`✅ Fallback de Puppeteer exitoso. Tamaño: ${htmlFallback.length} bytes.\n`);
    } catch (err) {
        console.error('❌ Error en Puppeteer Fallback:', err.message, '\n');
    }

    // 4. Test de QueueService y Worker
    console.log('--- 4. Probando Encolamiento Asíncrono ---');
    try {
        const mockLead = {
            _id: '64f1a2b3c4d5e6f7a8b9c0d1',
            name: 'Test Agency',
            website: 'https://example.com'
        };

        console.log('📡 Encolando lead ficticio...');
        await addLeadToEnrichment(mockLead);
        console.log('✅ Lead encolado. Si el servidor está corriendo (`npm run dev`), deberías ver logs del Worker procesándolo en la otra terminal.\n');
    } catch (err) {
        console.error('❌ Error al encolar lead:', err.message, '\n');
    }

    console.log('🏁 TESTS FINALIZADOS.');
    process.exit(0);
}

runTests();
