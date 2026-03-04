import { Worker } from 'bullmq';
import { connection } from '../services/QueueService.js';
import Lead from '../models/Lead.js';
import VisionScraperService from '../services/VisionScraperService.js';
import AIService from '../services/AIService.js';

/**
 * Worker para procesar leads mediante Deep Vision (Nivel 2 de VORTEX).
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

    try {
        console.log(`[VisionWorker] 📸 Tomando captura de pantalla de ${lead.website}...`);
        const base64Screenshot = await VisionScraperService.takeMobileScreenshot(lead.website);

        console.log(`[VisionWorker] 🤖 Analizando UX con OpenAI para ${lead.name}...`);
        const uxAnalysis = await AIService.analyzeUX(base64Screenshot, lead.website);
        
        // Simulación de éxito
        lead.vortex_status = 'vision_completed';
        lead.vision_analysis = {
            analyzedAt: new Date(),
            ...uxAnalysis
        };

        await lead.save();
        console.log(`[VisionWorker] ✅ Análisis Deep Vision finalizado para: ${lead.name}`);

    } catch (error) {
        console.error(`[VisionWorker] ❌ Error crítico en lead ${lead?.name || leadId}:`, error.message);

        // Actualizar estado a fallido en MongoDB garantizando que el sistema no se quede "colgado"
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

console.log('[VisionWorker] Deep Vision Engine Operational (2 slots).');

export default visionWorker;
