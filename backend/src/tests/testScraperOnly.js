import ScraperService from '../services/ScraperService.js';

async function testScraper() {
    console.log('🧪 INICIANDO TEST DE SCRAPER (FASE 1 - WAF EVASION)\n');

    // 1. Test de ScraperService (Level 1: Got-Scraping)
    console.log('--- 1. Probando Got-Scraping (Level 1) ---');
    const testUrl = 'https://example.com';
    try {
        const html = await ScraperService.getRawHtml(testUrl);
        console.log(`✅ Extracción exitosa. Tamaño: ${html.length} bytes.`);
        if (html.toLowerCase().includes('example domain')) {
            console.log('✅ Contenido verificado correctamente.\n');
        }
    } catch (err) {
        console.error('❌ Falló Got-Scraping:', err.message, '\n');
    }

    // 2. Test de Puppeteer Fallback (Level 2)
    console.log('--- 2. Probando Puppeteer Stealth (Level 2 Fallback) ---');
    try {
        // Usamos una URL de Google que suele requerir JS o ser más quisquillosa
        const htmlFallback = await ScraperService.getPuppeteerFallback('https://www.google.com/search?q=test');
        console.log(`✅ Fallback de Puppeteer exitoso. Tamaño: ${htmlFallback.length} bytes.`);
        console.log('✅ Motor de evasión comprobado.\n');
    } catch (err) {
        console.error('❌ Error en Puppeteer Fallback:', err.message, '\n');
    }

    console.log('🏁 TEST DE SCRAPER FINALIZADO.');
    process.exit(0);
}

testScraper();
