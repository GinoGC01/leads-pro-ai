import SearchHistory from '../models/SearchHistory.js';
import Lead from '../models/Lead.js';

/**
 * CampaignService — Automatic Campaign State Machine.
 *
 * Evaluates the campaign status based on the collective state of its leads.
 * Called automatically whenever a lead's status changes.
 *
 * State transitions:
 *   nueva → en_proceso → en_seguimiento → completada
 *                                       → archivada (manual)
 */
class CampaignService {
    /**
     * Evaluate and update campaign status based on lead states.
     * @param {string} searchId - The SearchHistory _id to evaluate.
     */
    static async evaluateCampaignStatus(searchId) {
        if (!searchId) return;

        try {
            const leads = await Lead.find({ searchId }, { status: 1 }).lean();
            if (leads.length === 0) return;

            const total = leads.length;
            const statusCounts = {};
            leads.forEach(l => {
                const s = l.status || 'Nuevo';
                statusCounts[s] = (statusCounts[s] || 0) + 1;
            });

            const nuevos = statusCounts['Nuevo'] || 0;
            const contactados = statusCounts['Contactado'] || 0;
            const citaAgendada = statusCounts['Cita Agendada'] || 0;
            const propuesta = statusCounts['Propuesta Enviada'] || 0;
            const cerradoGanado = statusCounts['Cerrado Ganado'] || 0;
            const cerradoPerdido = statusCounts['Cerrado Perdido'] || 0;
            const descartados = statusCounts['Descartados'] || 0;
            const enEspera = statusCounts['En Espera'] || 0;
            const sinWA = statusCounts['Sin WhatsApp'] || 0;

            const terminados = cerradoGanado + cerradoPerdido + descartados;
            const enSeguimiento = contactados + citaAgendada + propuesta;
            const tocados = total - nuevos; // All non-"Nuevo"

            let newCampaignStatus;

            if (terminados >= total * 0.8) {
                // 80%+ of leads are in terminal state → campaign completed
                newCampaignStatus = 'completada';
            } else if (enSeguimiento >= total * 0.3) {
                // 30%+ leads are in active follow-up
                newCampaignStatus = 'en_seguimiento';
            } else if (tocados > 0) {
                // At least one lead has been touched
                newCampaignStatus = 'en_proceso';
            } else {
                newCampaignStatus = 'nueva';
            }

            // Only update if status changed
            const search = await SearchHistory.findById(searchId);
            if (search && search.campaignStatus !== newCampaignStatus && search.campaignStatus !== 'archivada') {
                search.campaignStatus = newCampaignStatus;
                await search.save();
                console.log(`[CampaignService] Campaña ${searchId}: ${search.campaignStatus} → ${newCampaignStatus} (${tocados}/${total} leads tocados)`);
            }
        } catch (error) {
            console.error(`[CampaignService] Error evaluando campaña ${searchId}:`, error.message);
        }
    }
}

export default CampaignService;
