const Lead = require('../models/Lead');
const SearchHistory = require('../models/SearchHistory');
const GooglePlacesService = require('../services/GooglePlacesService');
const EmailScraperService = require('../services/EmailScraperService');
const ScoringService = require('../services/ScoringService');
const TechProfiler = require('../services/TechProfiler');

/**
 * Controller for Lead Generation logic
 */
class SearchController {
    /**
     * Start a new search and process results
     */
    static async startSearch(req, res) {
        const { keyword, location, radius, maxResults, filters, countryCode } = req.body;

        try {
            // 0. Quota Check (Hard-limit 50 High-Qualified leads/week)
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const weeklyHighQualifiedCount = await Lead.countDocuments({
                isHighTicket: true,
                createdAt: { $gte: oneWeekAgo }
            });

            if (weeklyHighQualifiedCount >= 50) {
                return res.status(403).json({
                    success: false,
                    message: "Quota semanal de leads High-Ticket alcanzada (50/50). El sistema se detiene para optimizar costes."
                });
            }

            // 1. Create search history record
            const search = await SearchHistory.create({
                keyword,
                location,
                radius: parseInt(radius),
                countryCode,
                filters,
                status: 'processing',
                logs: [{ message: '🚀 Iniciando motor de búsqueda Leads Pro AI...', type: 'info' }]
            });

            // 2. Return immediately to allow polling
            res.status(200).json({
                success: true,
                searchId: search._id
            });

            // 3. Start processing in background (No await to keep it async)
            SearchController.runProcessing(search, keyword, location, radius, maxResults, countryCode);

        } catch (error) {
            console.error('Search initiation error:', error);
            // Evitar crash si los headers ya fueron enviados por el res.json exitoso
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: error.message });
            }
        }
    }

    /**
     * Intensive background processing for leads
     */
    static async runProcessing(search, keyword, location, radius, maxResults, countryCode) {
        const pushStatus = async (message, type = 'info') => {
            console.log(`[Search: ${search._id}] ${message}`);
            await SearchHistory.findByIdAndUpdate(search._id, {
                $push: { logs: { message, type, timestamp: new Date() } }
            });
        };

        try {
            // 2. Search for places
            await pushStatus(`📡 Conectando con Google Places API (${countryCode || 'Global'}) para localizar profesionales...`);
            const places = await GooglePlacesService.searchPlaces(keyword, location, radius, 20, maxResults || 60, countryCode);

            let totalCost = 0.032; // Initial Search Cost
            await pushStatus(`✅ Google Places devolvió ${places.length} candidatos potenciales.`, 'success');
            await pushStatus('🔍 Iniciando fase de enriquecimiento profundo (Web Scraping + Tech Profiling)...');

            // 3. Process Leads in Parallel
            const leadPromises = places.map(async (place, index) => {
                try {
                    // Check if lead already exists
                    let existingLead = await Lead.findOne({ placeId: place.place_id });
                    if (existingLead) {
                        await pushStatus(`⏭️ Omitiendo duplicado: ${place.name}`, 'info');
                        return existingLead;
                    }

                    await pushStatus(`📎 Procesando: ${place.name}...`, 'info');

                    // Get Details
                    totalCost += 0.017; // Details Cost
                    const details = await GooglePlacesService.getPlaceDetails(place.place_id);
                    if (!details) return null;

                    // Deduplication by domain
                    if (details.website) {
                        const domain = new URL(details.website).hostname.replace('www.', '');
                        const duplicateByDomain = await Lead.findOne({ website: new RegExp(domain, 'i') });
                        if (duplicateByDomain) return duplicateByDomain;
                    }

                    // Zombie Check
                    let isZombie = false;
                    if (details.reviews && details.reviews.length > 0) {
                        const lastReviewTime = Math.max(...details.reviews.map(r => r.time));
                        const twelveMonthsAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
                        isZombie = lastReviewTime < twelveMonthsAgo;
                    }

                    const leadData = {
                        placeId: place.place_id,
                        name: details.name,
                        address: details.formatted_address,
                        phoneNumber: details.formatted_phone_number,
                        website: details.website,
                        rating: details.rating,
                        userRatingsTotal: details.user_ratings_total,
                        location: {
                            lat: details.geometry.location.lat,
                            lng: details.geometry.location.lng
                        },
                        googleMapsUrl: details.url,
                        searchId: search._id,
                        reviews: details.reviews ? details.reviews.slice(0, 3).map(r => r.text) : [],
                        is_zombie: isZombie,
                        is_advertising: !!(place.ad_placed || place.is_promoted)
                    };

                    // Concurrent Tech Profiling & Email Scraping
                    const enrichmentPromises = [];
                    if (leadData.website) {
                        totalCost += 0.007; // 0.002 Profiling + 0.005 Scraping
                        enrichmentPromises.push(TechProfiler.profileWebsite(leadData.website));
                        enrichmentPromises.push(EmailScraperService.findEmail(leadData.website));
                    }

                    const [techResults, emailResult] = await Promise.allSettled(enrichmentPromises);

                    if (techResults?.status === 'fulfilled' && techResults.value) {
                        leadData.tech_stack = techResults.value.tech_stack;
                        leadData.performance_metrics = {
                            ttfb: techResults.value.ttfb,
                            performance_issue: techResults.value.performance_issue
                        };
                    }

                    if (emailResult?.status === 'fulfilled' && emailResult.value) {
                        leadData.email = emailResult.value;
                        leadData.enrichmentStatus = 'completed';
                    } else {
                        leadData.enrichmentStatus = 'not_found';
                    }

                    // Scoring & NLP
                    leadData.leadOpportunityScore = ScoringService.calculateScore(leadData);
                    leadData.opportunityLevel = ScoringService.getOpportunityLevel(leadData.leadOpportunityScore, leadData.sales_angle);
                    leadData.sales_angle = ScoringService.generateRefinedAngle(leadData, leadData.reviews);
                    leadData.isHighTicket = leadData.opportunityLevel === 'Critical';

                    if (leadData.email) {
                        await pushStatus(`📧 Email encontrado para ${details.name}: ${leadData.email}`, 'success');
                    }
                    if (leadData.tech_stack.length > 0) {
                        await pushStatus(`🛠️ Tecnologías detectadas en ${details.name}: ${leadData.tech_stack.join(', ')}`, 'info');
                    }

                    const created = await Lead.create(leadData);
                    return created;
                } catch (err) {
                    console.error(`[SearchController] Error lead:`, err.message);
                    return null;
                }
            });

            const results = await Promise.all(leadPromises);
            const processedLeads = results.filter(l => l !== null);

            await pushStatus(`✅ Enriquecimiento finalizado. Se han guardado ${processedLeads.length} leads.`, 'success');

            // Stats calculation
            let leadsWithWeb = 0;
            let leadsWithEmail = 0;
            let totalRating = 0;
            let ratedLeadsCount = 0;

            processedLeads.forEach(l => {
                if (l.website) leadsWithWeb++;
                if (l.email) leadsWithEmail++;
                if (l.rating) {
                    totalRating += l.rating;
                    ratedLeadsCount++;
                }
            });

            // 6. Update Search History Stats
            await SearchHistory.findByIdAndUpdate(search._id, {
                resultsCount: processedLeads.length,
                leadsWithWeb,
                leadsWithEmail,
                averageRating: ratedLeadsCount > 0 ? totalRating / ratedLeadsCount : 0,
                totalCost,
                status: 'completed'
            });

        } catch (error) {
            console.error('Background search error:', error);
            await SearchHistory.findByIdAndUpdate(search._id, {
                status: 'failed',
                $push: { logs: { message: `❌ Error en el proceso: ${error.message}`, type: 'error' } }
            });
        }
    }

    /**
     * Get a single history item
     */
    static async getHistoryById(req, res) {
        try {
            const history = await SearchHistory.findById(req.params.id);
            if (!history) return res.status(404).json({ success: false, message: 'No encontrado' });
            res.status(200).json(history);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get search history
     */
    static async getHistory(req, res) {
        try {
            const history = await SearchHistory.find().sort({ createdAt: -1 });
            res.status(200).json(history);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get leads for a specific search
     */
    static async getLeadsBySearch(req, res) {
        try {
            const leads = await Lead.find({ searchId: req.params.searchId });
            res.status(200).json(leads);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get aggregate statistics for the dashboard
     */
    static async getGlobalStats(req, res) {
        try {
            const histories = await SearchHistory.find();
            const totalLeads = await Lead.countDocuments();
            const leadsWithWeb = await Lead.countDocuments({ website: { $ne: null, $exists: true } });
            const leadsWithEmail = await Lead.countDocuments({ email: { $ne: null, $exists: true } });

            // Calculate Avg Score across all leads
            const scoreAggregate = await Lead.aggregate([
                { $group: { _id: null, avgScore: { $avg: "$leadOpportunityScore" } } }
            ]);

            const stats = {
                totalSearches: histories.length,
                totalInvested: histories.reduce((sum, h) => sum + (h.totalCost || 0), 0),
                totalLeadsDatabase: totalLeads,
                totalHighTicket: await Lead.countDocuments({ isHighTicket: true }),
                uniqueLocations: [...new Set(histories.map(h => h.location))].length,
                emailCoverage: totalLeads > 0 ? (leadsWithEmail / totalLeads) * 100 : 0,
                webCoverage: totalLeads > 0 ? (leadsWithWeb / totalLeads) * 100 : 0,
                avgScore: scoreAggregate[0]?.avgScore || 0
            };

            res.status(200).json(stats);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update lead CRM status and add interaction log
     */
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

            res.status(200).json(updatedLead);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete a search and its associated leads
     */
    static async deleteSearch(req, res) {
        try {
            const { id: searchId } = req.params;
            console.log(`[SearchController] Attempting to delete search: ${searchId}`);

            // Delete associated leads first
            const leadsDeleted = await Lead.deleteMany({ searchId });
            console.log(`[SearchController] Leads deleted: ${leadsDeleted.deletedCount}`);

            // Delete search history record
            const deletedSearch = await SearchHistory.findByIdAndDelete(searchId);

            if (!deletedSearch) {
                console.warn(`[SearchController] Search history record not found for ID: ${searchId}`);
                return res.status(404).json({ success: false, message: 'Búsqueda no encontrada en el historial' });
            }

            console.log(`[SearchController] Search history record deleted successfully`);
            res.status(200).json({ success: true, message: 'Búsqueda y leads asociados eliminados con éxito' });
        } catch (error) {
            console.error(`[SearchController] Error deleting search:`, error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = SearchController;
