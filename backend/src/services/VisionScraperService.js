import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Activar plugin stealth para evasión de bot detection
puppeteer.use(StealthPlugin());

class VisionScraperService {
    /**
     * Toma una captura de pantalla optimizada en móvil B2B.
     * @param {string} url La URL a analizar
     * @param {Object} [job] Instancia del job de BullMQ para telemetría
     * @returns {Promise<string>} Imagen en base64
     */
    static async takeMobileScreenshot(url, job = null) {
        let browser = null;

        try {
            browser = await puppeteer.launch({
                headless: 'new', // Use new headless mode
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage'
                ]
            });

            const page = await browser.newPage();

            // Configurar Emulación Móvil (iPhone 13)
            await page.setViewport({
                width: 390,
                height: 844,
                deviceScaleFactor: 1,
                isMobile: true,
                hasTouch: true
            });

            // Set User-Agent
            await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1');

            // Intercepción de Red Optimizada para IA (Ignorar media pesada que la IA no ve, preservar imágenes/css)
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                if (resourceType === 'media' || resourceType === 'font') {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            if (job) await job.updateProgress({ percent: 20, message: '> Navegando a la URL objetivo y evadiendo WAF...' });
            console.log(`[VisionScraper] Navegando a ${url}...`);
            // Navegación con timeout protegido de 20s
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 20000
            });

            // Deep Vision Hallucination Fix: 3s delay para permitir renderizado de SPAs/Animaciones/Modales
            if (job) await job.updateProgress({ percent: 35, message: '> Esperando hidratación del DOM (3000ms)...' });
            console.log(`[VisionScraper] Esperando 3 segundos para estabilización de UI...`);
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Extraer captura en calidad optimizada para GPT-4V / GPT-4o
            console.log(`[VisionScraper] Tomando screenshot base64 interactivo...`);
            const base64Screenshot = await page.screenshot({
                type: 'jpeg',
                quality: 70,
                encoding: 'base64',
                fullPage: false // Capturar solo el viewport visible al usuario inicial (above the fold vital para UX)
            });

            return base64Screenshot;

        } catch (error) {
            console.error(`[VisionScraper] Error general capturando URL (${url}):`, error.message);
            throw new Error(`Puppeteer Error: ${error.message}`);
        } finally {
            // REGLA DE ORO: Siempre cerrar el browser
            if (browser) {
                console.log(`[VisionScraper] Cerrando instancia de Chromium...`);
                await browser.close().catch(e => console.error('[VisionScraper] Error al cerrar browser:', e.message));
            }
        }
    }
}

export default VisionScraperService;
