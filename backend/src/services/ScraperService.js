const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Configuración de Puppeteer Stealth
puppeteer.use(StealthPlugin());

/**
 * Servicio de extracción de HTML con evasión de WAF.
 * Utiliza un sistema de dos niveles: Got-Scraping (Rápido) y PuppeteerFallback (Pesado).
 */
class ScraperService {
    /**
     * Intenta extraer el HTML usando got-scraping (Level 1).
     * @param {string} url 
     */
    static async getRawHtml(url) {
        if (!url.startsWith('http')) url = `https://${url}`;

        try {
            console.log(`[ScraperService] Level 1 Tracking: ${url}`);

            // Dynamic import for ESM package in CommonJS
            const { gotScraping } = await import('got-scraping');

            const response = await gotScraping({
                url,
                timeout: { request: 8000 },
                headerGeneratorOptions: {
                    browsers: [{ name: 'chrome', minVersion: 100 }],
                    devices: ['desktop'],
                    locales: ['en-US', 'es-ES']
                }
            });

            // Filtro Heurístico
            const title = /<title>(.*?)<\/title>/i.exec(response.body)?.[1] || '';
            if (response.statusCode === 403 ||
                response.statusCode === 520 ||
                title.includes('Just a moment') ||
                title.includes('Cloudflare')) {
                throw new Error('WAF_CHALLENGE_DETECTED');
            }

            return response.body;

        } catch (error) {
            console.warn(`[ScraperService] Level 1 Falló (${error.message}). Iniciando Level 2 Fallback...`);
            return await this.getPuppeteerFallback(url);
        }
    }

    /**
     * Fallback usando Puppeteer Stealth para evadir bloqueos agresivos (Level 2).
     * @param {string} url 
     */
    static async getPuppeteerFallback(url) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // Optimización de RAM: Bloquear recursos innecesarios
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                if (['image', 'font', 'stylesheet', 'media'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
            const content = await page.content();

            return content;

        } catch (error) {
            console.error(`[ScraperService] Level 2 Error Fatal: ${error.message}`);
            throw new Error(`EXTRACTION_FAILED: ${error.message}`);
        } finally {
            if (browser) await browser.close();
        }
    }
}

module.exports = ScraperService;
