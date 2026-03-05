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
import SupabaseService from '../services/SupabaseService.js';
import CampaignService from '../services/CampaignService.js';

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

            // 🧠 SPIDER V2: Qdrant Vector Learning (ONLY authorized write path)
            // When a lead is marked as "Cerrado Ganado", ingest its vector into Qdrant
            // so SPIDER can predict tactics for similar future leads.
            if (status === 'Cerrado Ganado') {
                SearchController._ingestWonLeadToQdrant(id).catch(err =>
                    console.error('[SPIDER V2] Qdrant ingestion error (non-blocking):', err.message)
                );
            }

            res.status(200).json(updatedLead);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * SPIDER V2: Deferred Qdrant Ingestion (markLeadAsWon).
     * Reads the spider_context_vector from MongoDB and upserts to Qdrant.
     * This is the ONLY function authorized to write to Qdrant.
     * @private
     */
    static async _ingestWonLeadToQdrant(leadId) {
        const lead = await Lead.findById(leadId).select('+spider_context_vector');
        if (!lead || !lead.spider_context_vector || lead.spider_context_vector.length === 0) {
            console.log(`[SPIDER V2] ⚠️ Lead ${leadId} has no spider_context_vector. Skipping Qdrant ingestion.`);
            return;
        }

        const { default: VectorStoreService } = await import('../services/VectorStoreService.js');
        
        await VectorStoreService.upsertLeadVector(
            leadId,
            lead.spider_context_vector,
            {
                status: 'WON',
                tactic: lead.spider_memory?.applied_tactic || 'UNKNOWN',
                niche: lead.category || 'General',
                tech_stack: (lead.tech_stack || []).slice(0, 5),
                friction_score: lead.spider_memory?.friction_score || 'UNKNOWN',
                performance_score: lead.performance_metrics?.performanceScore || null
            }
        );
        console.log(`[SPIDER V2] ✅ Lead "${lead.name}" ingested into Qdrant as WON vector.`);
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
                await SupabaseService.deleteLeadVectors(leadIds);
                console.log(`[SearchController] Vectores eliminados en Supabase.`);
            } catch (vdbError) {
                console.warn(`[SearchController] Advertencia: Error borrando vectores en Supabase:`, vdbError.message);
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
