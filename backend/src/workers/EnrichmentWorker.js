import { Worker } from 'bullmq';
import { connection } from '../services/QueueService.js';
import ScraperService from '../services/ScraperService.js';
import ParserService from '../services/ParserService.js';
import ProfilerService from '../services/ProfilerService.js';
import AIService from '../services/AIService.js';
import SupabaseService from '../services/SupabaseService.js';
import ragConfig from '../config/rag.config.js';
import Lead from '../models/Lead.js';
import { RENTED_LAND_DOMAINS } from '../services/SpiderEngine.js';

/**
 * Worker para procesar leads asíncronamente (Pipeline de 4 Fases).
 * Concurrencia limitada para evitar bloqueos de IP/WAF.
 * 
 * IMPORTANTE: BullMQ QueueEvents solo emite el evento 'progress' en tiempo real.
 * job.log() NO se transmite via pub/sub. Por ello, usamos job.updateProgress()
 * con objetos estructurados { percent, message, type } como canal único de telemetría.
 */
// Phase 0: Vortex Intelligence Engine (VIE) - Orchestration
const enrichmentWorker = new Worker('enrichmentQueue', async (job) => {
    const { leadId, website, name } = job.data;
    console.log(`[VIE] 🚀 Vortex Intelligence Engine processing lead: ${name} (${website})`);

    const lead = await Lead.findById(leadId);
    if (!lead || !website) {
        console.log(`[EnrichmentWorker] Saltando: Lead no encontrado o sin website.`);
        return;
    }

    await job.updateProgress({ percent: 5, message: `Inicializando pipeline VORTEX Base para ${name}` });

    // PRE-FLIGHT: Rented Land Abort Gate
    const urlLower = website.toLowerCase();
    const isRentedLand = RENTED_LAND_DOMAINS.some(domain => urlLower.includes(domain));
    if (isRentedLand) {
        await job.updateProgress({ percent: 100, message: `🛑 ABORT: "${name}" usa Tierra Alquilada (${website}). Saltando.`, type: 'error' });
        console.log(`[VIE] 🚧 ABORT: "${name}" usa Tierra Alquilada (${website}). Saltando enriquecimiento.`);
        lead.enrichmentStatus = 'skipped_rented_land';
        lead.enrichmentError = `URL de Tierra Alquilada detectada: ${website}`;
        await lead.save();
        return;
    }

    try {
        // FASE 1: Extracción Cruda (WAF Evasion)
        await job.updateProgress({ percent: 10, message: '[FASE 1] Localizando recursos y evadiendo WAF para descargar HTML Base...' });
        console.log(`[EnrichmentWorker] [FASE 1] Extrayendo HTML para ${name}...`);
        const rawHtml = await ScraperService.getRawHtml(website);
        
        await job.updateProgress({ percent: 20, message: `[FASE 1] ✅ Payload HTML descargado: ${(rawHtml.length / 1024).toFixed(2)} KB.` });
        console.log(`[EnrichmentWorker] [FASE 1] Éxito: ${rawHtml.length} bytes.`);

        // FASE 2: Purificación Semántica y Auditoría SEO
        await job.updateProgress({ percent: 25, message: '[FASE 2] Limpiando metadatos. Ejecutando auditoría estructural SEO...' });
        console.log(`[EnrichmentWorker] [FASE 2] Analizando contenido y SEO...`);
        const { seoAudit, markdown } = ParserService.parse(rawHtml);
        
        await job.updateProgress({ percent: 35, message: '[FASE 2] ✅ SEO Audit completado satisfactoriamente.' });
        console.log(`[EnrichmentWorker] [FASE 2] SEO Audit y Markdown finalizados.`);

        // FASE 2.5: Extracción de Contactos (Emails, Teléfonos, Redes Sociales)
        await job.updateProgress({ percent: 40, message: '[FASE 2.5] Explorando código fuente en búsqueda de canales de contacto...' });
        console.log(`[EnrichmentWorker] [FASE 2.5] Extrayendo datos de contacto...`);
        const contacts = ParserService.extractContacts(rawHtml);
        lead.extracted_contacts = {
            emails: contacts.emails,
            phones: contacts.phones,
            social_links: contacts.socialLinks
        };
        // Auto-fill missing contact data
        if (!lead.email && contacts.emails.length > 0) {
            lead.email = contacts.emails[0];
            console.log(`[EnrichmentWorker] [FASE 2.5] Email auto-asignado: ${lead.email}`);
        }
        if (!lead.phoneNumber && contacts.phones.length > 0) {
            lead.phoneNumber = contacts.phones[0];
            console.log(`[EnrichmentWorker] [FASE 2.5] Teléfono auto-asignado: ${lead.phoneNumber}`);
        }
        
        await job.updateProgress({ percent: 50, message: `[FASE 2.5] ✅ Capturados: ${contacts.emails.length} emails, ${contacts.phones.length} teléfonos, ${contacts.socialLinks.length} perfiles sociales.` });
        console.log(`[EnrichmentWorker] [FASE 2.5] Contactos: ${contacts.emails.length} emails, ${contacts.phones.length} phones, ${contacts.socialLinks.length} social.`);

        // FASE 3: Perfilado Empírico (Tech + Performance)
        await job.updateProgress({ percent: 55, message: '[FASE 3] Inyectando Profiler para Stack Tecnológico. Ejecutando Lighthouse Web Vitals...' });
        console.log(`[EnrichmentWorker] [FASE 3] Detectando tecnologías y rendimiento...`);
        const techStack = ProfilerService.detectTechFromHtml(rawHtml);
        const perfMetrics = await ProfilerService.getPerformanceMetrics(website);
        
        await job.updateProgress({ percent: 70, message: `[FASE 3] ✅ Tecnologías subyacentes mapeadas (${techStack.length} detectadas).` });
        console.log(`[EnrichmentWorker] [FASE 3] Perfilado completado (${techStack.length} techs).`);

        // FASE 4: Consolidación y Vectorización Híbrida
        await job.updateProgress({ percent: 80, message: '[FASE 4] Preparando síntesis dimensional y generando Embeddings vectoriales...' });
        console.log(`[EnrichmentWorker] [FASE 4] Consolidando datos y sincronizando vectores...`);

        // 4.1 Actualizar MongoDB
        lead.tech_stack = techStack;
        lead.performance_metrics = {
            ...lead.performance_metrics,
            performanceScore: perfMetrics.performanceScore,
            ttfb: perfMetrics.ttfb,
            lcp: perfMetrics.lcp,
            performance_issue: perfMetrics.performanceScore < 50
        };
        lead.seo_audit = seoAudit;
        lead.markdown_content = markdown;
        lead.enrichmentStatus = 'completed';
        lead.vortex_status = 'base_completed'; // Update Phase 1 state
        lead.enrichmentError = null;
        await lead.save();

        // 4.2 Sincronización Vectorial (pgvector)
        const semanticContent = ragConfig.ingestion.buildSemanticContent(lead);
        const embedding = await AIService.generateEmbedding(semanticContent);

        await SupabaseService.upsertLeadVector({
            lead_id: lead._id.toString(),
            name: lead.name,
            metadata: {
                rating: lead.rating,
                ttfb: lead.performance_metrics?.ttfb,
                score: lead.leadOpportunityScore,
                is_zombie: lead.is_zombie,
                tech: techStack.slice(0, 5),
                performance: perfMetrics.performanceScore
            },
            content: semanticContent
        }, embedding);

        await job.updateProgress({ percent: 100, message: '[FASE 4] ✅ Ingesta de la Base de Datos completada exitosamente.' });
        console.log(`[EnrichmentWorker] ✅ Enriquecimiento total finalizado para ${name}.`);

    } catch (error) {
        await job.updateProgress({ percent: -1, message: `❌ ERROR CRÍTICO: ${error.message}`, type: 'error' });
        console.error(`[EnrichmentWorker] ❌ Error crítico en lead ${name}:`, error.message);

        // Actualizar estado a fallido en MongoDB
        if (lead) {
            lead.enrichmentStatus = 'failed';
            lead.vortex_status = 'failed';
            lead.enrichmentError = error.message;
            await lead.save();
        }

        // Si el error es de DNS (la página no existe) o TimeOut severo, no tiene sentido reintentar en 5 segundos.
        // Cortamos el ciclo de BullMQ para evitar el "loop".
        if (error.message.includes('ENOTFOUND') ||
            error.message.includes('ERR_NAME_NOT_RESOLVED') ||
            error.message.includes('ERR_CONNECTION_REFUSED')) {
            console.error(`[EnrichmentWorker] 🛑 Abortando reintentos para ${name} por fallo de DNS/Red definitivo.`);
            return; // Resolvemos el job silenciosamente para BullMQ, pero queda 'failed' en MongoDB.
        }

        throw error; // Permite re-intento de BullMQ solo para fallos temporales (WAF, timeouts 520, etc).
    }
}, {
    connection,
    concurrency: 3
});

enrichmentWorker.on('completed', (job) => {
    console.log(`[EnrichmentWorker] Trabajo completado exitosamente: ${job.data.name}`);
});

enrichmentWorker.on('failed', (job, err) => {
    console.error(`[EnrichmentWorker] Trabajo fallido definitivamente: ${job?.data?.name}. Error: ${err.message}`);
});

console.log('[EnrichmentWorker] Asynchronous Engine Operational (3 slots).');

export default enrichmentWorker;
