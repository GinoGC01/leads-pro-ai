import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

/**
 * Servicio de purificación de HTML y síntesis de Markdown.
 * Optimiza el contenido para auditorías SEO y bases de datos vectoriales (RAG).
 */
class ParserService {
    constructor() {
        this.turndown = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
        });
    }

    /**
     * Procesa el HTML crudo para extraer métricas SEO y Markdown limpio.
     * @param {string} html 
     * @returns {Object} { seoAudit, markdown, title }
     */
    parse(html) {
        const $ = cheerio.load(html);

        // 1. Auditoría SEO Básica
        const seoAudit = {
            hasTitle: $('title').length > 0,
            hasMetaDescription: $('meta[name="description"]').length > 0,
            h1Count: $('h1').length,
            titleText: $('title').text().trim(),
            metaDescription: $('meta[name="description"]').attr('content') || ''
        };

        // 2. Poda Semántica (Eliminar ruido)
        $('script, style, noscript, nav, footer, header, iframe, svg, aside').remove();

        // 3. Selección de Contenido Principal
        // Intentamos priorizar <main> o <article>, fallback a <body>
        const mainContent = $('main').length > 0 ? $('main') :
            ($('article').length > 0 ? $('article') : $('body'));

        // 4. Síntesis de Markdown
        const markdown = this.turndown.turndown(mainContent.html() || '');

        return {
            seoAudit,
            markdown: markdown.trim(),
            title: seoAudit.titleText
        };
    }

    /**
     * Extract contact information from raw HTML.
     * Finds emails, phone numbers, and social media links.
     * @param {string} html - Raw HTML string
     * @returns {{ emails: string[], phones: string[], socialLinks: Array<{platform: string, url: string}> }}
     */
    extractContacts(html) {
        const $ = cheerio.load(html);
        const textContent = $('body').text();
        const allHrefs = [];
        $('a[href]').each((_, el) => { allHrefs.push($(el).attr('href')); });

        // === EMAILS ===
        const emailSet = new Set();
        // 1. mailto: links
        allHrefs.forEach(href => {
            if (href && href.startsWith('mailto:')) {
                const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
                if (email && email.includes('@') && !email.includes('example')) emailSet.add(email);
            }
        });
        // 2. Email regex in visible text
        const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
        const textEmails = textContent.match(emailRegex) || [];
        textEmails.forEach(e => {
            const email = e.toLowerCase();
            if (!email.includes('example') && !email.includes('sentry') && !email.includes('webpack')) {
                emailSet.add(email);
            }
        });

        // === PHONES ===
        const phoneSet = new Set();
        // 1. tel: links
        allHrefs.forEach(href => {
            if (href && href.startsWith('tel:')) {
                const phone = href.replace('tel:', '').replace(/\s+/g, '').trim();
                if (phone.length >= 7) phoneSet.add(phone);
            }
        });
        // 2. Phone regex in visible text (international formats)
        const phoneRegex = /(?:\+?\d{1,4}[\s\-.]?)?\(?\d{1,5}\)?[\s\-.]?\d{1,5}[\s\-.]?\d{2,6}/g;
        const textPhones = textContent.match(phoneRegex) || [];
        textPhones.forEach(p => {
            const cleaned = p.replace(/[\s\-().+]/g, '');
            // 7+ digits, not a year, not all same digit (e.g. 99999999), not a simple sequence (12345678)
            if (cleaned.length >= 7 &&
                cleaned.length <= 15 &&
                !/^(19|20)\d{2}$/.test(cleaned) &&
                !/^(\d)\1+$/.test(cleaned) &&
                !/^\d{4,8}$/.test(cleaned) // Reject raw 4-8 digit numbers without any formatting that are likely just IDs/prices
            ) {
                phoneSet.add(p.trim());
            } else if (p.includes('-') || p.includes(' ')) {
                // Si tiene formato explícito, lo toleramos (ej. 444-4444)
                if (cleaned.length >= 7 && cleaned.length <= 15 && !/^(\d)\1+$/.test(cleaned)) {
                    phoneSet.add(p.trim());
                }
            }
        });

        // === SOCIAL LINKS ===
        const socialPlatforms = {
            instagram: /instagram\.com\/[a-zA-Z0-9_.]+/i,
            facebook: /facebook\.com\/[a-zA-Z0-9_.]+/i,
            linkedin: /linkedin\.com\/(company|in)\/[a-zA-Z0-9_\-]+/i,
            twitter: /(twitter\.com|x\.com)\/[a-zA-Z0-9_]+/i,
            tiktok: /tiktok\.com\/@?[a-zA-Z0-9_.]+/i,
            youtube: /youtube\.com\/(channel|c|@)[a-zA-Z0-9_\-]+/i,
        };
        const socialSet = new Map(); // platform -> url (dedup by platform)
        allHrefs.forEach(href => {
            if (!href) return;
            for (const [platform, regex] of Object.entries(socialPlatforms)) {
                if (regex.test(href) && !socialSet.has(platform)) {
                    socialSet.set(platform, href);
                }
            }
        });

        const socialLinks = Array.from(socialSet.entries()).map(([platform, url]) => ({ platform, url }));

        console.log(`[ParserService] Contacts extracted: ${emailSet.size} emails, ${phoneSet.size} phones, ${socialLinks.length} social`);

        return {
            emails: Array.from(emailSet),
            phones: Array.from(phoneSet),
            socialLinks
        };
    }
}

export default new ParserService();
