const cheerio = require('cheerio');
const TurndownService = require('turndown');

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
}

module.exports = new ParserService();
