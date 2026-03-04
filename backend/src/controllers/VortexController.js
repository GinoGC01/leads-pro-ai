import Lead from '../models/Lead.js';
import * as QueueService from '../services/QueueService.js';

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
            await QueueService.addLeadToEnrichment(lead);

            // Respond immediately (202 Accepted)
            res.status(202).json({
                success: true,
                message: 'Vortex Intelligence Engine activado. Escaneando...',
                status: 'pending',
                leadId: lead._id
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
                { new: true }
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
            try {
                console.log(`[Vortex Controller] Triggering Deep Vision for: ${lead.name}`);
                await QueueService.addLeadToVision(lead);
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
                leadId: lead._id
            });

        } catch (error) {
            console.error('[Vortex Controller] Error Deep Vision:', error);
            res.status(500).json({
                success: false,
                message: 'Internal Server Error al activar Deep Vision'
            });
        }
    }
}

export default VortexController;
