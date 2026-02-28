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
            const lead = await Lead.findById(req.params.leadId, { enrichmentStatus: 1, enrichmentError: 1, name: 1 });
            if (!lead) return res.status(404).json({ success: false });
            res.status(200).json({
                status: lead.enrichmentStatus,
                error: lead.enrichmentError,
                id: lead._id
            });
        } catch (error) {
            res.status(500).json({ success: false });
        }
    }
}

export default VortexController;
