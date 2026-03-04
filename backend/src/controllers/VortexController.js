import Lead from '../models/Lead.js';
import * as QueueService from '../services/QueueService.js';
import { enrichmentEvents, visionEvents } from '../services/QueueService.js';

/**
 * Vortex Intelligence Engine Controller (Manual Trigger)
 */
class VortexController {
    /**
     * Manually trigger enrichment for a specific lead
     * POST /api/vortex/enrich/:leadId
     */
    static async enrichLead(req, res) {
        const { leadId } = req.params;

        try {
            const lead = await Lead.findById(leadId);

            // Validation: Do not re-process if already in progress or completed
            if (lead.enrichmentStatus === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Este prospecto ya ha sido analizado por Vortex.',
                    lead
                });
            }

            if (lead.enrichmentStatus === 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Vortex ya está escaneando este prospecto en segundo plano.',
                    lead
                });
            }

            if (!lead.website) {
                return res.status(400).json({
                    success: false,
                    message: 'El prospecto no tiene sitio web para analizar con Vortex.'
                });
            }

            // Reset error if it was a retry
            lead.enrichmentError = null;
            lead.enrichmentStatus = 'pending';
            await lead.save();

            // Enqueue work
            console.log(`[Vortex Controller] Manually triggering enrichment for: ${lead.name}`);
            const jobId = await QueueService.addLeadToEnrichment(lead);

            // Respond immediately (202 Accepted)
            res.status(202).json({
                success: true,
                message: 'Vortex Intelligence Engine activado. Escaneando...',
                status: 'pending',
                leadId: lead._id,
                jobId
            });

        } catch (error) {
            console.error('[Vortex Controller] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error al activar Vortex'
            });
        }
    }

    /**
     * Get specific lead status for polling
     * GET /api/vortex/status/:leadId
     */
    static async getLeadStatus(req, res) {
        try {
            const lead = await Lead.findById(req.params.leadId, { enrichmentStatus: 1, enrichmentError: 1, name: 1, vortex_status: 1 });
            if (!lead) return res.status(404).json({ success: false });
            res.status(200).json({
                status: lead.enrichmentStatus, // Backward compat
                vortex_status: lead.vortex_status,
                error: lead.enrichmentError,
                id: lead._id
            });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }

    /**
     * Trigger Phase 2: Deep Vision Engine
     * POST /api/vortex/deep-vision/:id
     */
    static async triggerDeepVision(req, res) {
        const { id } = req.params;

        try {
            // Atomic update to avoid race conditions
            const lead = await Lead.findOneAndUpdate(
                { _id: id, vortex_status: 'base_completed' },
                { $set: { vortex_status: 'vision_processing' } },
                { returnDocument: 'after' }
            );

            if (!lead) {
                // Determine why the atomic update failed
                const existingLead = await Lead.findById(id);
                if (!existingLead) {
                    return res.status(404).json({ success: false, message: 'Lead no encontrado.' });
                }
                
                // If it exists but didn't match 'base_completed', it's a conflict/race condition
                return res.status(409).json({
                    success: false,
                    message: `Conflicto de estado. El lead no está listo para Deep Vision. Estado actual: ${existingLead.vortex_status}`,
                    lead: existingLead
                });
            }

            // Encolamiento Seguro
            let jobId;
            try {
                console.log(`[Vortex Controller] Triggering Deep Vision for: ${lead.name}`);
                jobId = await QueueService.addLeadToVision(lead);
            } catch (queueError) {
                // ROLLBACK: Si Redis falla, devolvemos el lead a 'base_completed'
                console.error('[Vortex Controller] Error encolando a BullMQ. Revertiendo estado...', queueError);
                await Lead.findByIdAndUpdate(lead._id, { $set: { vortex_status: 'base_completed' } });
                
                return res.status(503).json({
                    success: false,
                    message: 'El servicio de procesamiento está temporalmente saturado. Por favor, intenta de nuevo.'
                });
            }

            res.status(202).json({
                success: true,
                message: 'Deep Vision activado. Procesando...',
                status: 'vision_processing',
                leadId: lead._id,
                jobId
            });

        } catch (error) {
            console.error('[Vortex Controller] Error Deep Vision:', error);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error al activar Deep Vision'
            });
        }
    }

    /**
     * Hard Reset: Purga datos anteriores y reencola el lead desde cero
     * POST /api/vortex/reset/:id
     */
    static async resetAndRescan(req, res) {
        const { id } = req.params;

        try {
            const lead = await Lead.findOneAndUpdate(
                { _id: id },
                {
                    $unset: { base_metrics: "", vision_analysis: "", spider_verdict: "" },
                    $set: { vortex_status: 'pending', enrichmentStatus: 'pending', enrichmentError: null }
                },
                { returnDocument: 'after' }
            );

            if (!lead) {
                return res.status(404).json({ success: false, message: 'Lead no encontrado para reseteo.' });
            }

            console.log(`[Vortex Controller] Hard Reset ejecutado para: ${lead.name}. Iniciando Lead base...`);
            const jobId = await QueueService.addLeadToEnrichment(lead);

            res.status(202).json({
                success: true,
                message: 'Memoria purgada. Iniciando escaneo Vortex desde cero.',
                status: 'pending',
                leadId: lead._id,
                jobId
            });
        } catch (error) {
            console.error('[Vortex Controller] Error en Hard Reset:', error);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error al resetear el lead.'
            });
        }
    }

    /**
     * Server-Sent Events (SSE) stream for real-time progress of a specific job
     * GET /api/vortex/stream/:jobId
     */
    static async streamProgress(req, res) {
        const { jobId } = req.params;

        // Construct SSE Headers (Anti-Buffering)
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Crítico para deshabilitar el buffering del proxy
        });
        res.flushHeaders(); // Flushes headers to establish stream before first message

        // Determine which global event bus to use based on jobId
        const isVisionJob = jobId.endsWith('-vision');
        const queueEventsBus = isVisionJob ? visionEvents : enrichmentEvents;

        const writeEvent = (type, data) => {
            res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
        };

        // CRITICAL: BullMQ QueueEvents only emits 'progress', 'completed', 'failed'.
        // job.log() does NOT trigger a real-time event. We use structured objects in
        // job.updateProgress({ percent, message, type }) and parse them here.
        const onProgress = (args) => {
            if (args.jobId === jobId) {
                const progressData = args.data;
                
                // If the worker sent a structured object, emit both log and progress
                if (progressData && typeof progressData === 'object' && progressData.message) {
                    writeEvent('log', {
                        message: progressData.message,
                        timestamp: Date.now(),
                        type: progressData.type || 'info'
                    });
                    if (progressData.percent >= 0) {
                        writeEvent('progress', { progress: progressData.percent });
                    }
                } else {
                    // Fallback: simple numeric progress
                    writeEvent('progress', { progress: progressData || 0 });
                }
            }
        };

        const onCompleted = (args) => {
            if (args.jobId === jobId) {
                writeEvent('completed', { returnvalue: args.returnvalue });
                cleanup();
                res.end();
            }
        };

        const onFailed = (args) => {
            if (args.jobId === jobId) {
                writeEvent('log', { message: `❌ ${args.failedReason}`, timestamp: Date.now(), type: 'error' });
                writeEvent('failed', { failedReason: args.failedReason });
                cleanup();
                res.end();
            }
        };

        // Attach global listeners
        queueEventsBus.on('progress', onProgress);
        queueEventsBus.on('completed', onCompleted);
        queueEventsBus.on('failed', onFailed);

        // Keep-alive heartbeat (to prevent idle timeouts)
        const keepAliveInterval = setInterval(() => {
            res.write(': heartbeat\n\n');
        }, 15000);

        // Send Initial Connected Event
        writeEvent('connected', { message: 'SSE Stream Connected to VORTEX Engine' });

        // Centralized cleanup function
        const cleanup = () => {
            clearInterval(keepAliveInterval);
            queueEventsBus.off('progress', onProgress);
            queueEventsBus.off('completed', onCompleted);
            queueEventsBus.off('failed', onFailed);
        };

        // CLEANUP: If the client breaks connection, remove listeners and avoid memory leak
        req.on('close', cleanup);
    }
}

export default VortexController;
