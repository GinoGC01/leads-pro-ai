const axios = require('axios');

/**
 * Service to profile lead websites and detect inefficiencies
 */
class TechProfiler {
    /**
     * Detects tech stack and measures TTFB
     */
    static async profileWebsite(url) {
        const results = {
            tech_stack: [],
            ttfb: null,
            performance_issue: false,
            error: null
        };

        if (!url) return results;

        try {
            const startTime = Date.now();

            // Use a short timeout of 5s as requested
            const response = await axios.get(url, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Prospector/2.0'
                }
            });

            const ttfb = Date.now() - startTime;
            results.ttfb = ttfb;
            results.performance_issue = ttfb > 1500;

            const html = response.data.toString().toLowerCase();
            const headers = JSON.stringify(response.headers).toLowerCase();

            // Technology Signatures
            const signatures = [
                { name: 'WordPress', pattern: '/wp-content/' },
                { name: 'Wix', pattern: 'wixstatic.com' },
                { name: 'Squarespace', pattern: 'static1.squarespace.com' },
                { name: 'GoDaddy', pattern: 'v-godaddy-site' }
            ];

            signatures.forEach(sig => {
                if (html.includes(sig.pattern.toLowerCase()) || headers.includes(sig.pattern.toLowerCase())) {
                    results.tech_stack.push(sig.name);
                }
            });

            return results;
        } catch (error) {
            results.error = error.message;
            return results;
        }
    }
}

module.exports = TechProfiler;
