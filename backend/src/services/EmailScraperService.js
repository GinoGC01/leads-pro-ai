const axios = require('axios');
const cheerio = require('cheerio');

class EmailScraperService {
    /**
     * Attempts to find an email address on a website
     */
    static async findEmail(url) {
        if (!url) return null;

        try {
            // Basic URL cleanup
            if (!url.startsWith('http')) url = `https://${url}`;

            const response = await axios.get(url, {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
            });
            const $ = cheerio.load(response.data);

            // 1. Search in text using regex
            const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
            const bodyText = $('body').text();
            let emails = bodyText.match(emailRegex);

            if (emails && emails.length > 0) {
                // Return the first unique email that doesn't look like an image or common false positive
                const filteredEmails = emails.filter(e => !e.match(/\.(png|jpg|jpeg|gif|svg)$/i));
                if (filteredEmails.length > 0) return [...new Set(filteredEmails)][0].toLowerCase();
            }

            // 2. Search in "mailto:" links
            const mailtoLinks = $('a[href^="mailto:"]');
            if (mailtoLinks.length > 0) {
                const mailtoEmail = mailtoLinks.attr('href').replace('mailto:', '').split('?')[0];
                return mailtoEmail.toLowerCase();
            }

            // 3. Optional: check "Contact" page (simplified here for brevity)
            // ... logic to follow links like /contact or /contacto

            return null;
        } catch (error) {
            console.error(`Scraping error for ${url}:`, error.message);
            return null;
        }
    }
}

module.exports = EmailScraperService;
