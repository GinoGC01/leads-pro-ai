import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

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
        const rawPhoneCandidates = [];

        // 1. tel: and wa.me links
        allHrefs.forEach(href => {
            if (!href) return;
            if (href.startsWith('tel:') || href.includes('wa.me/')) {
                rawPhoneCandidates.push(href);
            }
        });

        // 2. Phone regex in visible text (international formats)
        const phoneRegex = /(?:\+?\d{1,4}[\s\-.]?)?\(?\d{1,5}\)?[\s\-.]?\d{1,5}[\s\-.]?\d{2,6}/g;
        const textPhones = textContent.match(phoneRegex) || [];
        textPhones.forEach(p => rawPhoneCandidates.push(p));

        // 3. Sanitize ALL candidates through libphonenumber-js pipeline
        const validPhones = rawPhoneCandidates
            .map(raw => this._sanitizePhone(raw))
            .filter(Boolean);

        // 4. Deduplicate via Set (E.164 guarantees uniqueness)
        const phoneSet = new Set(validPhones);

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

    /**
     * Sanitizes a raw phone string through a strict pipeline:
     * 1. URI decoding & prefix stripping (tel:, wa.me/, //)
     * 2. Garbage rejection (dates, IPs, version strings, dimensions)
     * 3. Mathematical validation via libphonenumber-js
     * 4. Returns E.164 format or null
     * @param {string} rawString
     * @returns {string|null} E.164 phone number or null
     */
    _sanitizePhone(rawString) {
        try {
            // 1. Decode URI and strip known prefixes
            let cleaned = decodeURIComponent(rawString)
                .replace(/^tel:/i, '')
                .replace(/^\/\//i, '')
                .replace(/wa\.me\//gi, '')
                .replace(/[\s\u00a0]/g, '') // Remove all whitespace including &nbsp;
                .trim();

            // 2. Reject garbage patterns (dates, IPs, version strings, dimensions, CSS values)
            if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) return null;       // Date: 2024-01-15
            if (/\d+\.\d+\.\d+/.test(cleaned)) return null;             // Version/IP: 1.2.3
            if (/^\d{1,4}x\d{1,4}$/i.test(cleaned)) return null;       // Dimensions: 800x600
            if (/^\d{1,3}%$/.test(cleaned)) return null;                // Percentage: 50%
            if (/^#[0-9a-f]{3,8}$/i.test(cleaned)) return null;        // Hex color: #fff
            if (/^\d{1,2}px$/i.test(cleaned)) return null;             // CSS unit: 16px

            // 3. Reject if not enough digit content (at least 7 digits)
            const digitsOnly = cleaned.replace(/\D/g, '');
            if (digitsOnly.length < 7 || digitsOnly.length > 15) return null;

            // 4. Reject all-same-digit sequences (e.g. 99999999)
            if (/^(\d)\1+$/.test(digitsOnly)) return null;

            // 5. Mathematical validation via libphonenumber-js (default region: AR)
            const phoneNumber = parsePhoneNumberFromString(cleaned, 'AR');

            if (phoneNumber && phoneNumber.isValid()) {
                return phoneNumber.format('E.164'); // e.g. +541152355601
            }

            return null;
        } catch (e) {
            return null;
        }
    }
}

export default new ParserService();
