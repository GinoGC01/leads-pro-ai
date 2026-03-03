import Lead from '../models/Lead.js';
import ScoringService from '../services/ScoringService.js';

/**
 * Controller for manually adding leads from external sources (non-Google Maps).
 */
class ManualLeadController {
    /**
     * Create a lead manually
     */
    static async createManualLead(req, res) {
        try {
            const { name, phoneNumber, website, email, address, notes, source, sourceLabel } = req.body;

            if (!name) {
                return res.status(400).json({ success: false, message: 'El nombre del lead es obligatorio.' });
            }

            if (!phoneNumber && !website && !email) {
                return res.status(400).json({ success: false, message: 'Se requiere al menos un dato de contacto (teléfono, web o email).' });
            }

            // Generate synthetic placeId for manual leads
            const syntheticPlaceId = `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            const leadData = {
                placeId: syntheticPlaceId,
                name,
                address: address || null,
                phoneNumber: phoneNumber || null,
                website: website || null,
                email: email || null,
                source: source || 'manual',
                sourceLabel: sourceLabel || null,
                status: 'Nuevo',
                enrichmentStatus: website ? 'unprocessed' : 'not_found',
                is_zombie: false,
                is_advertising: false,
            };

            // Auto-scoring
            try {
                leadData.leadOpportunityScore = ScoringService.calculateScore(leadData) || 0;
                leadData.opportunityLevel = ScoringService.getOpportunityLevel(leadData.leadOpportunityScore, leadData) || 'Low';
                leadData.sales_angle = ScoringService.generateRefinedAngle(leadData, []) || 'Lead manual — análisis pendiente';
                leadData.isHighTicket = leadData.opportunityLevel === 'Critical';
            } catch (scoringErr) {
                console.error('[ManualLead] Scoring error:', scoringErr.message);
                leadData.leadOpportunityScore = 0;
                leadData.opportunityLevel = 'Low';
            }

            // Add initial interaction log
            leadData.interactionLogs = [{
                event: `Lead agregado manualmente (Fuente: ${source || 'manual'}${sourceLabel ? ' — ' + sourceLabel : ''})`,
                note: notes || '',
                timestamp: new Date()
            }];

            const lead = await Lead.create(leadData);

            console.log(`[ManualLead] ✅ Lead creado: ${name} (source: ${lead.source})`);

            res.status(201).json({
                success: true,
                message: `Lead "${name}" agregado exitosamente.`,
                lead
            });

        } catch (error) {
            console.error('[ManualLead] Error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default ManualLeadController;
