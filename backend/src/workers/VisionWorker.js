import { Worker } from 'bullmq';
import { connection } from '../services/QueueService.js';
import Lead from '../models/Lead.js';
import VisionScraperService from '../services/VisionScraperService.js';
import AIService from '../services/AIService.js';

/**
 * Worker para procesar leads mediante Deep Vision (Nivel 2 de VORTEX).
 * 
 * IMPORTANTE: BullMQ QueueEvents solo emite el evento 'progress' en tiempo real.
 * job.log() NO se transmite via pub/sub. Por ello, usamos job.updateProgress()
 * con objetos estructurados { percent, message, type } como canal único de telemetría.
 */
const visionWorker = new Worker('visionQueue', async (job) => {
    const { leadId } = job.data;
    console.log(`[VisionWorker] 👁️ Iniciando análisis Deep Vision para leadId: ${leadId}`);

    const lead = await Lead.findById(leadId);
    if (!lead) {
        console.log(`[VisionWorker] 🛑 Saltando: Lead no encontrado (${leadId}).`);
        return;
    }

    if (!lead.website) {
        throw new Error(`No website URL provided for lead ${leadId}`);
    }

    await job.updateProgress({ percent: 5, message: '🔥 Inicializando VORTEX DEEP VISION Engine...' });

    try {
        await job.updateProgress({ percent: 10, message: '> Inicializando motor de Visión (Puppeteer)...' });

        console.log(`[VisionWorker] 📸 Tomando captura de pantalla de ${lead.website}...`);
        const base64Screenshot = await VisionScraperService.takeMobileScreenshot(lead.website, job);

        await job.updateProgress({ percent: 50, message: '> Captura exitosa. Procesando imagen base64...' });
        await job.updateProgress({ percent: 55, message: '> Transfiriendo datos a red neuronal OpenAI (gpt-4o)...' });

        console.log(`[VisionWorker] 🤖 Analizando UX con OpenAI para ${lead.name}...`);
        const uxAnalysis = await AIService.analyzeUX(base64Screenshot, lead.website);
        
        await job.updateProgress({ percent: 90, message: '> Análisis UX completado. Guardando resultados...' });

        lead.vortex_status = 'vision_completed';
        lead.vision_analysis = {
            analyzedAt: new Date(),
            ...uxAnalysis
        };

        await lead.save();
        await job.updateProgress({ percent: 100, message: '✅ Base de datos actualizada con el reporte visual.' });
        console.log(`[VisionWorker] ✅ Análisis Deep Vision finalizado para: ${lead.name}`);

    } catch (error) {
        await job.updateProgress({ percent: -1, message: `❌ ALERTA CRÍTICA TIER-2: ${error.message}`, type: 'error' });
        console.error(`[VisionWorker] ❌ Error crítico en lead ${lead?.name || leadId}:`, error.message);

        if (lead) {
            lead.vortex_status = 'failed';
            lead.vision_analysis = {
                error: error.message,
                failedAt: new Date()
            };
            await lead.save();
        }

        throw error;
    }
}, {
    connection,
    concurrency: 1
});

visionWorker.on('completed', (job) => {
    console.log(`[VisionWorker] Trabajo completado: ${job.id}`);
});

visionWorker.on('failed', (job, err) => {
    console.error(`[VisionWorker] Trabajo fallido: ${job?.id}. Error: ${err.message}`);
});

console.log('[VisionWorker] Deep Vision Engine Operational (1 slot).');

export default visionWorker;
