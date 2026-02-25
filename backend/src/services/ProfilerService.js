const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Servicio de perfilado técnico y rendimiento.
 * Utiliza detección heurística para mayor estabilidad y PSI para métricas.
 */
class ProfilerService {
    /**
     * Detecta tecnologías mediante patrones en el HTML.
     * @param {string} html 
     * @returns {string[]} Array de tecnologías detectadas.
     */
    detectTechFromHtml(html) {
        if (!html) return [];
        const techs = new Set();
        const $ = cheerio.load(html.toLowerCase());

        // Patrones comunes
        const patterns = {
            'WordPress': ['wp-content', 'wp-includes', 'wp-json'],
            'Shopify': ['shopify.com', 'cdn.shopify.com', 'shopify-pay'],
            'HubSpot': ['js.hs-scripts.com', 'hubspot.com'],
            'React': ['_reactroot', 'react-dom'],
            'Wix': ['wix.com', 'wix-static'],
            'Squarespace': ['squarespace.com', 'sqsp.net'],
            'Google Analytics': ['google-analytics.com', 'googletagmanager.com/gtag/js'],
            'Tailwind CSS': ['tailwind.min.css', 'tailwindcss'],
            'Elementor': ['elementor-settings', 'elementor-pro'],
            'WooCommerce': ['woocommerce', 'wc-ajax'],
            'Calendly': ['calendly.com/assets'],
            'Hotjar': ['static.hotjar.com'],
            'Intercom': ['widget.intercom.io']
        };

        const htmlStr = html.toLowerCase();

        // 1. Detección por strings en el HTML
        for (const [name, markers] of Object.entries(patterns)) {
            if (markers.some(marker => htmlStr.includes(marker))) {
                techs.add(name);
            }
        }

        // 2. Detección específica en etiquetas <script> y <link>
        $('script, link').each((_, el) => {
            const src = $(el).attr('src') || $(el).attr('href') || '';
            if (src.includes('wp-')) techs.add('WordPress');
            if (src.includes('gtm.js') || src.includes('gtag')) techs.add('Google Tag Manager');
            if (src.includes('next/static')) techs.add('Next.js');
        });

        // 3. Detección por meta tags (generator)
        const generator = $('meta[name="generator"]').attr('content') || '';
        if (generator.includes('WordPress')) techs.add('WordPress');
        if (generator.includes('Wix')) techs.add('Wix');

        return Array.from(techs);
    }

    /**
     * Obtiene métricas de rendimiento vía Google PageSpeed Insights API.
     * @param {string} url 
     */
    async getPerformanceMetrics(url) {
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=PERFORMANCE${apiKey ? `&key=${apiKey}` : ''}`;

        try {
            const response = await axios.get(psiUrl, { timeout: 60000 });
            const lighthouse = response.data.lighthouseResult;

            return {
                performanceScore: (lighthouse.categories.performance.score * 100) || 0,
                lcp: lighthouse.audits['largest-contentful-paint']?.displayValue || 'N/A',
                ttfb: Math.round(lighthouse.audits['server-response-time']?.numericValue) || 0,
                isOptimized: lighthouse.categories.performance.score > 0.8
            };
        } catch (error) {
            console.warn(`[ProfilerService] PSI Error for ${url}:`, (error.response?.data?.error?.message || error.message));
            return { performanceScore: 0, lcp: 'N/A', error: true };
        }
    }
}

module.exports = new ProfilerService();
