import LeadSearchService from '../services/LeadSearchService.js';

// =====================================================================
// TEMPORARY DOMAIN IMPORTS (will be extracted in future iterations)
// These imports exist ONLY for methods that belong to other domains
// (Leads, Dashboard, CRM) but still live here pending their refactoring.
// =====================================================================
import Lead from '../models/Lead.js';
import SearchHistory from '../models/SearchHistory.js';
import ApiUsage from '../models/ApiUsage.js';
import ScoringService from '../services/ScoringService.js';
import VectorStoreService, { COLLECTIONS } from '../services/VectorStoreService.js';
import CampaignService from '../services/CampaignService.js';
import MarioStrategy from '../models/MarioStrategy.js';

/**
 * SearchController — The Bouncer (Search Domain).
 * 
 * REFACTORED METHODS (3-Tier Clean):
 *   startSearch, getHistory, getHistoryById, deleteSearch
 *   → Zero model imports, pure delegation to LeadSearchService.
 * 
 * LEGACY METHODS (Pending future iteration):
 *   getGlobalStats, getLeadsBySearch, getLeadById, updateLeadStatus, bulkDeleteLeads
 *   → Still contain direct model access. Will be extracted to
 *     LeadController + DashboardController in Iteration 2.
 */
class SearchController {

    // =================================================================
    // REFACTORED METHODS (3-Tier: Router → Controller → Service)
    // =================================================================

    /** POST /api/search — Launch a new search campaign */
    static async startSearch(req, res) {
        try {
            const result = await LeadSearchService.initiate(req.body);
            res.status(200).json({ success: true, searchId: result.searchId });
        } catch (error) {
            const status = error.statusCode || 500;
            if (!res.headersSent) {
                res.status(status).json({ success: false, message: error.message });
            }
        }
    }

    /** GET /api/history — Get all campaign history */
    static async getHistory(req, res) {
        try {
            const history = await LeadSearchService.getHistory();
            res.status(200).json(history);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /** GET /api/history/:id — Get single campaign details */
    static async getHistoryById(req, res) {
        try {
            const history = await LeadSearchService.getHistoryById(req.params.id);
            res.status(200).json(history);
        } catch (error) {
            const status = error.statusCode || 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** DELETE /api/history/:id — Purge a campaign and its leads */
    static async deleteSearch(req, res) {
        try {
            const result = await LeadSearchService.deleteCampaign(req.params.id);
            res.status(200).json({ success: true, message: 'Búsqueda y leads asociados eliminados con éxito', ...result });
        } catch (error) {
            const status = error.statusCode || 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    // =================================================================
    // LEGACY METHODS — Pending Iteration 2 (Lead + Dashboard domains)
    // DO NOT add new logic here. These will be moved out.
    // =================================================================

    /** GET /api/history/:searchId/leads */
    static async getLeadsBySearch(req, res) {
        try {
            const leads = await Lead.find({ searchId: req.params.searchId });
            res.status(200).json(leads);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /** GET /api/leads/:id */
    static async getLeadById(req, res) {
        try {
            const lead = await Lead.findById(req.params.id);
            if (!lead) return res.status(404).json({ success: false, message: 'Lead no encontrado' });
            res.status(200).json(lead);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /** PATCH /api/leads/:id/status */
    static async updateLeadStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, note } = req.body;

            const updateData = { status };
            const logEntry = {
                event: `Estado cambiado a ${status}`,
                note: note || '',
                timestamp: new Date()
            };

            const updatedLead = await Lead.findByIdAndUpdate(
                id,
                {
                    $set: updateData,
                    $push: { interactionLogs: logEntry }
                },
                { new: true }
            );

            if (!updatedLead) return res.status(404).json({ success: false, message: 'Lead no encontrado' });

            // Trigger campaign state machine evaluation
            if (updatedLead.searchId) {
                CampaignService.evaluateCampaignStatus(updatedLead.searchId).catch(err =>
                    console.error('[CampaignService] Async eval error:', err.message)
                );
            }

            // 🧠 MARIO AI: Automated Engagement-Based Scoring (KPI Decoupling)
            // Success States: Positive Response or Appointment
            const engagementSuccess = ['Respuesta Positiva', 'Cita Agendada', 'Propuesta Enviada'].includes(status);
            // Failure States: Silence or Discard (without previous engagement)
            const engagementFailure = ['Ignorado', 'Descartados'].includes(status);

            if (engagementSuccess) {
                SearchController._autoScoreAI(id, 5).catch(err => 
                    console.error('[MARIO RLHF] Auto-score (WON) error:', err.message)
                );
                SearchController._ingestAIWinningPattern(id, 'WON').catch(err =>
                    console.error('[SPIDER V2] Qdrant Winning Pattern error:', err.message)
                );
            } else if (engagementFailure) {
                SearchController._autoScoreAI(id, 1).catch(err => 
                    console.error('[MARIO RLHF] Auto-score (LOST) error:', err.message)
                );
                SearchController._ingestAIWinningPattern(id, 'LOST').catch(err =>
                    console.error('[SPIDER V2] Qdrant Failure Pattern error:', err.message)
                );
            }

            res.status(200).json(updatedLead);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * RLHF: Internal automation to score the last strategy based on lead engagement.
     * @private
     */
    static async _autoScoreAI(leadId, score) {
        // Find latest strategy for this lead
        const strategy = await MarioStrategy.findOne({ lead_id: leadId }).sort({ generated_at: -1 });
        if (!strategy) return;

        // Resurrection Logic: If it was already scored as failure but now we have success, overwrite.
        if (strategy.human_score === score) return; 

        strategy.human_score = score;
        strategy.status = score >= 3 ? 'APPROVED' : 'REJECTED';
        strategy.human_feedback = score === 5 ? 'Automated success via client engagement.' : 'Automated failure via client silence/discard.';
        
        await strategy.save();
        console.log(`[MARIO RLHF] Auto-Score applied to lead ${leadId}: ${score} stars. Status: ${strategy.status}`);
    }

    /**
     * SPIDER V2: Ingest the tactical "Winning" or "Losing" pattern to Qdrant.
     * Use this to help Mario learn from what actually gets replies.
     * @private
     */
    static async _ingestAIWinningPattern(leadId, outcome = 'WON') {
        const lead = await Lead.findById(leadId).select('+spider_context_vector');
        if (!lead || !lead.spider_context_vector || lead.spider_context_vector.length === 0) {
            console.log(`[SPIDER V2] ⚠️ Lead ${leadId} has no spider_context_vector. Skipping Qdrant.`);
            return;
        }

        const { default: VectorStoreService } = await import('../services/VectorStoreService.js');
        
        // Metadata focused on pattern learning (DNA del Lead + Tactic)
        const payload = {
            lead_id: lead._id.toString(),
            outcome: outcome, // 'WON' (Reply/Meeting) or 'LOST' (Ignored)
            tactic: lead.spider_memory?.applied_tactic || 'UNKNOWN',
            niche: lead.category || 'General',
            tech_stack: (lead.tech_stack || []).slice(0, 5),
            friction_score: lead.spider_memory?.friction_score || 'UNKNOWN',
            opportunity_score: lead.leadOpportunityScore || 0
        };

        await VectorStoreService.upsertLeadVector(
            leadId,
            lead.spider_context_vector,
            payload
        );
        console.log(`[SPIDER V2] ✅ Lead "${lead.name}" ingested into Qdrant as ${outcome} tactic pattern.`);
    }

    /** DELETE /api/leads — Bulk delete */
    static async bulkDeleteLeads(req, res) {
        try {
            const { leadIds } = req.body;

            if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
                return res.status(400).json({ success: false, message: 'Se requiere un array de leadIds.' });
            }

            console.log(`[SearchController] Iniciando borrado masivo de ${leadIds.length} leads.`);

            try {
                await VectorStoreService.deleteVectors(COLLECTIONS.MARIO_KNOWLEDGE, leadIds);
                await VectorStoreService.deleteVectors(COLLECTIONS.SPIDER_MEMORY, leadIds);
                console.log(`[SearchController] Vectores eliminados en Qdrant (mario_knowledge + spider_memory).`);
            } catch (vdbError) {
                console.warn(`[SearchController] Advertencia: Error borrando vectores en Qdrant:`, vdbError.message);
            }

            const mongoResult = await Lead.deleteMany({ _id: { $in: leadIds } });
            console.log(`[SearchController] Leads eliminados en MongoDB: ${mongoResult.deletedCount}`);

            res.status(200).json({
                success: true,
                message: `${mongoResult.deletedCount} leads eliminados permanentemente.`,
                deletedCount: mongoResult.deletedCount
            });
        } catch (error) {
            console.error(`[SearchController] Error en bulkDeleteLeads:`, error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /** GET /api/stats — Dashboard global stats */
    static async getGlobalStats(req, res) {
        try {
            const histories = await SearchHistory.find();
            const totalLeads = await Lead.countDocuments();
            const leadsWithWeb = await Lead.countDocuments({ website: { $ne: null, $exists: true } });
            const leadsWithEmail = await Lead.countDocuments({ email: { $ne: null, $exists: true } });
            const highTicketLeads = await Lead.countDocuments({ isHighTicket: true });

            const scoreAggregate = await Lead.aggregate([
                { $group: { _id: null, avgScore: { $avg: "$leadOpportunityScore" } } }
            ]);

            const currentYear = new Date().getFullYear();
            const acquisitionVelocityData = await Lead.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                            $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`)
                        }
                    }
                },
                { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } }
            ]);

            const monthlyLeads = new Array(12).fill(0);
            acquisitionVelocityData.forEach(item => {
                if (item._id >= 1 && item._id <= 12) {
                    monthlyLeads[item._id - 1] = item.count;
                }
            });

            const statusDistributionData = await Lead.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]);

            const statusDistribution = {
                new: 0, contacted: 0, in_progress: 0,
                closed: 0, en_espera: 0, descartados: 0
            };
            statusDistributionData.forEach(item => {
                const normalizedId = String(item._id || '').toLowerCase().trim();
                if (['nuevo', 'new'].includes(normalizedId)) statusDistribution.new += item.count;
                else if (['contactado', 'contacted'].includes(normalizedId)) statusDistribution.contacted += item.count;
                else if (['en espera'].includes(normalizedId)) statusDistribution.en_espera += item.count;
                else if (['cita agendada', 'propuesta enviada', 'in_progress'].includes(normalizedId)) statusDistribution.in_progress += item.count;
                else if (['cerrado ganado', 'cerrado perdido', 'closed', 'sin whatsapp'].includes(normalizedId)) statusDistribution.closed += item.count;
                else if (['descartados'].includes(normalizedId)) statusDistribution.descartados += item.count;
                else statusDistribution.new += item.count;
            });

            const currentUsage = await ApiUsage.getCurrentMonth();

            const TEXT_SEARCH_FREE_TIER = 5000;
            const DETAILS_FREE_TIER = 1000;
            const TEXT_SEARCH_PRICE = 0.032;
            const DETAILS_PRICE = 0.025;

            const billableTextSearch = Math.max(0, currentUsage.textSearchCount - TEXT_SEARCH_FREE_TIER);
            const billableDetails = Math.max(0, currentUsage.placeDetailsCount - DETAILS_FREE_TIER);
            const realBillableCost = (billableTextSearch * TEXT_SEARCH_PRICE) + (billableDetails * DETAILS_PRICE);
            const theoreticalSavings = (currentUsage.textSearchCount * TEXT_SEARCH_PRICE) + (currentUsage.placeDetailsCount * DETAILS_PRICE) - realBillableCost;

            const billingMetrics = {
                textSearchUsage: currentUsage.textSearchCount,
                detailsUsage: currentUsage.placeDetailsCount,
                textSearchLimit: TEXT_SEARCH_FREE_TIER,
                detailsLimit: DETAILS_FREE_TIER,
                realBillableCost,
                theoreticalSavings,
                totalEstimatedSnapshot: histories.reduce((sum, h) => sum + (h.totalCost || 0), 0)
            };

            const categories = await SearchHistory.aggregate([
                { $group: { _id: "$keyword", count: { $sum: "$resultsCount" } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);

            const efficiency = {
                costPerLead: totalLeads > 0 ? billingMetrics.realBillableCost / totalLeads : 0,
                costPerEmail: leadsWithEmail > 0 ? billingMetrics.realBillableCost / leadsWithEmail : 0,
                roiPotential: highTicketLeads * 500
            };

            const stats = {
                summary: {
                    totalSearches: histories.length,
                    totalInvested: billingMetrics.realBillableCost,
                    totalLeads,
                    totalHighTicket: highTicketLeads,
                    uniqueLocations: [...new Set(histories.map(h => h.location))].length,
                    avgScore: scoreAggregate[0]?.avgScore || 0
                },
                charts: { monthlyAcquisition: monthlyLeads, pipelineStatus: statusDistribution },
                coverage: {
                    email: totalLeads > 0 ? (leadsWithEmail / totalLeads) * 100 : 0,
                    web: totalLeads > 0 ? (leadsWithWeb / totalLeads) * 100 : 0
                },
                billing: billingMetrics,
                categories: categories.map(c => ({ name: c._id, count: c.count })),
                efficiency,
                projection: {
                    monthlyEstimated: (billingMetrics.totalEstimatedSnapshot / Math.max(1, histories.length)) * 30
                }
            };

            res.status(200).json(stats);
        } catch (error) {
            console.error('[Stats] Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default SearchController;
