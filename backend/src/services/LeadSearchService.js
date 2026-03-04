import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import SearchHistory from '../models/SearchHistory.js';
import ApiUsage from '../models/ApiUsage.js';
import GooglePlacesService from './GooglePlacesService.js';
import ScoringService from './ScoringService.js';
import GridService from './GridService.js';
import CampaignService from './CampaignService.js';
import SupabaseService from './SupabaseService.js';
import { RENTED_LAND_DOMAINS } from './SpiderEngine.js';

/**
 * LeadSearchService — The Brain of the Search Domain.
 * 
 * Owns ALL business logic for:
 * - Launching a new search (standard or grid mode)
 * - Background processing of raw Google results
 * - Acquisition filtering, zombie/sinkhole detection, domain dedup
 * - Lead scoring and persistence
 * - Transaction safety (rollback on failure)
 * 
 * The Controller NEVER touches this logic directly.
 */
class LeadSearchService {

    // ================================================================
    // PUBLIC API
    // ================================================================

    /**
     * Initiates a new lead search campaign.
     * Creates the SearchHistory record and kicks off background processing.
     * 
     * @param {Object} params - Search parameters from the controller
     * @returns {{ searchId: string }} The created search ID for polling
     * @throws {Error} If weekly quota is exceeded or creation fails
     */
    static async initiate(params) {
        const { keyword, location, radius, maxResults, countryCode, gridMode, gridSize } = params;

        // Quota Check: Hard-limit 50 High-Qualified leads/week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyHighQualifiedCount = await Lead.countDocuments({
            isHighTicket: true,
            createdAt: { $gte: oneWeekAgo }
        });

        if (weeklyHighQualifiedCount >= 50) {
            const error = new Error("Quota semanal de leads High-Ticket alcanzada (50/50). El sistema se detiene para optimizar costes.");
            error.statusCode = 403;
            throw error;
        }

        // Create search history record
        const search = await SearchHistory.create({
            keyword,
            location,
            radius: parseInt(radius),
            countryCode,
            status: 'processing',
            searchMode: gridMode ? 'grid' : 'single',
            gridSize: gridMode ? (gridSize || 3) : 0,
            gridCellsTotal: gridMode ? ((gridSize || 3) * (gridSize || 3)) : 1,
            gridCellsCompleted: 0,
            logs: [{
                message: gridMode
                    ? `🗺️ Iniciando Grid Search ${gridSize || 3}×${gridSize || 3} — Expansión Geográfica...`
                    : '🚀 Iniciando motor de búsqueda Leads Pro AI...',
                type: 'info'
            }]
        });

        // Fire-and-forget: background processing
        LeadSearchService._runProcessing(search, params).catch(err => {
            console.error(`[LeadSearchService] Fatal background error for search ${search._id}:`, err);
        });

        return { searchId: search._id };
    }

    /**
     * Get all search history records, sorted by newest first.
     */
    static async getHistory() {
        return SearchHistory.find().sort({ createdAt: -1 });
    }

    /**
     * Get a single search history record by ID.
     */
    static async getHistoryById(id) {
        const history = await SearchHistory.findById(id);
        if (!history) {
            const error = new Error('No encontrado');
            error.statusCode = 404;
            throw error;
        }
        return history;
    }

    /**
     * Delete a campaign and all its associated leads.
     */
    static async deleteCampaign(searchId) {
        const session = await LeadSearchService._startSession();

        try {
            if (session) await session.startTransaction();

            const opts = session ? { session } : {};

            const leadsDeleted = await Lead.deleteMany({ searchId }, opts);
            console.log(`[LeadSearchService] Leads deleted: ${leadsDeleted.deletedCount}`);

            const deletedSearch = await SearchHistory.findByIdAndDelete(searchId, opts);

            if (!deletedSearch) {
                if (session) await session.abortTransaction();
                const error = new Error('Búsqueda no encontrada en el historial');
                error.statusCode = 404;
                throw error;
            }

            if (session) await session.commitTransaction();

            console.log(`[LeadSearchService] Campaign ${searchId} purged successfully.`);
            return { deletedLeads: leadsDeleted.deletedCount };

        } catch (error) {
            if (session && session.inTransaction()) await session.abortTransaction();
            throw error;
        } finally {
            if (session) await session.endSession();
        }
    }

    // ================================================================
    // PRIVATE: Background Processing Pipeline
    // ================================================================

    /**
     * Intensive background processing for a search campaign.
     * Handles: Google API calls, Grid expansion, dedup, scoring, persistence.
     * Wrapped in a Mongoose transaction for data integrity.
     */
    static async _runProcessing(search, params) {
        const { keyword, location, radius, maxResults, countryCode, gridMode = false, gridSize = 3 } = params;

        const pushStatus = async (message, type = 'info') => {
            console.log(`[Search: ${search._id}] ${message}`);
            await SearchHistory.findByIdAndUpdate(search._id, {
                $push: { logs: { message, type, timestamp: new Date() } }
            });
        };

        try {
            // === PHASE 0: Google Places Data Acquisition ===
            const rawGoogleResults = await LeadSearchService._acquireGoogleData(
                { keyword, location, radius, maxResults, countryCode, gridMode, gridSize },
                search,
                pushStatus
            );

            if (rawGoogleResults.length > 0) {
                console.log("=== RAW GOOGLE PLACE OBJECT (SAMPLE) ===");
                console.log(JSON.stringify(rawGoogleResults[0], null, 2));
                console.log("========================================");
            }

            // === PHASE 1: Acquisition Filter (Data Hygiene) ===
            const validLeads = rawGoogleResults.filter(place => {
                const hasPhone = !!(place.nationalPhoneNumber || place.internationalPhoneNumber || place.formatted_phone_number);
                const hasWebsite = !!(place.website || place.websiteUri);
                return hasPhone || hasWebsite;
            });

            console.log(`[Vortex Ops] Filtro aplicado: Pasaron ${validLeads.length} de ${rawGoogleResults.length} leads.`);

            if (validLeads.length === 0) {
                await pushStatus(`❌ Se encontraron ${rawGoogleResults.length} negocios, pero ninguno poseía vías de contacto (web o teléfono). Búsqueda descartada.`, 'error');
                await SearchHistory.findByIdAndUpdate(search._id, {
                    status: 'failed',
                    resultsCount: 0,
                    totalCost: 0.032
                });
                return;
            }

            // === PHASE 2: Lead Processing with Transaction Safety ===
            await pushStatus(`✅ Google API V1 devolvió ${rawGoogleResults.length} entidades a $0 costo. Filtro Heurístico aprobó ${validLeads.length} candidatos viables.`, 'success');
            await pushStatus('🔍 Validando y depurando Base de Datos de Leads locales...');

            const processedLeads = await LeadSearchService._processAndPersistLeads(
                validLeads, search, pushStatus
            );

            await pushStatus(`✅ Enriquecimiento finalizado. Se han guardado ${processedLeads.length} leads.`, 'success');

            // === PHASE 3: Stats Calculation & Campaign Finalization ===
            const stats = LeadSearchService._calculateStats(processedLeads);

            await SearchHistory.findByIdAndUpdate(search._id, {
                resultsCount: processedLeads.length,
                leadsWithWeb: stats.leadsWithWeb,
                leadsWithEmail: stats.leadsWithEmail,
                averageRating: stats.averageRating,
                totalCost: 0,
                status: 'completed'
            });

        } catch (error) {
            console.error('[LeadSearchService] Background search error:', error);
            await SearchHistory.findByIdAndUpdate(search._id, {
                status: 'failed',
                $push: { logs: { message: `❌ Error en el proceso: ${error.message}`, type: 'error' } }
            });
        }
    }

    // ================================================================
    // PRIVATE: Sub-pipelines
    // ================================================================

    /**
     * Acquires raw data from Google Places API (standard or grid mode).
     */
    static async _acquireGoogleData(params, search, pushStatus) {
        const { keyword, location, radius, maxResults, countryCode, gridMode, gridSize } = params;
        let rawGoogleResults = [];

        if (gridMode) {
            const isCoords = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(location);
            if (!isCoords) {
                await pushStatus('⚠️ Grid Search requiere coordenadas (lat,lng). Ejecutando búsqueda estándar...', 'warn');
                rawGoogleResults = await GooglePlacesService.searchPlaces(keyword, location, radius, 20, maxResults || 60, countryCode);
            } else {
                const [lat, lng] = location.split(',').map(Number);
                const cells = GridService.generateGrid(lat, lng, parseInt(radius) || 50000, gridSize);
                const costEstimate = GridService.estimateCost(gridSize);
                await pushStatus(`🗺️ Grid ${gridSize}×${gridSize} generado: ${cells.length} celdas, radio/celda: ${cells[0].cellRadius}m. Costo máx estimado: $${costEstimate.maxCostUSD} USD`);

                const seenPlaceIds = new Set();
                const existingLeads = await Lead.find({ searchId: { $exists: true } }, { placeId: 1 }).lean();
                existingLeads.forEach(l => { if (l.placeId) seenPlaceIds.add(l.placeId); });

                for (let i = 0; i < cells.length; i++) {
                    const cell = cells[i];
                    await pushStatus(`📡 ${cell.label} (${i + 1}/${cells.length}) — Centro: ${cell.lat}, ${cell.lng} — Radio: ${cell.cellRadius}m`);

                    try {
                        const cellResults = await GooglePlacesService.searchPlaces(
                            keyword, `${cell.lat},${cell.lng}`, cell.cellRadius, 20, 60, countryCode
                        );

                        let newInCell = 0;
                        for (const place of cellResults) {
                            if (!seenPlaceIds.has(place.id)) {
                                seenPlaceIds.add(place.id);
                                rawGoogleResults.push(place);
                                newInCell++;
                            }
                        }

                        await pushStatus(`✅ ${cell.label} completada: ${cellResults.length} encontrados, ${newInCell} nuevos (${cellResults.length - newInCell} duplicados filtrados)`);
                        await SearchHistory.findByIdAndUpdate(search._id, { gridCellsCompleted: i + 1 });

                    } catch (cellErr) {
                        await pushStatus(`⚠️ Error en ${cell.label}: ${cellErr.message}`, 'error');
                    }
                }

                await pushStatus(`🏁 Grid Search completado: ${rawGoogleResults.length} leads únicos encontrados en ${cells.length} celdas.`);
            }
        } else {
            await pushStatus(`📡 Conectando con Google Places API (${countryCode || 'Global'}) para localizar profesionales...`);
            rawGoogleResults = await GooglePlacesService.searchPlaces(keyword, location, radius, 20, maxResults || 60, countryCode);
        }

        return rawGoogleResults;
    }

    /**
     * Processes raw Google results into Lead documents.
     * Uses a Mongoose transaction to ensure atomicity: if any lead fails
     * catastrophically, the entire batch rolls back.
     */
    static async _processAndPersistLeads(validLeads, search, pushStatus) {
        const session = await LeadSearchService._startSession();

        try {
            if (session) await session.startTransaction();

            const opts = session ? { session } : {};
            const processedLeads = [];

            for (const place of validLeads) {
                try {
                    const lead = await LeadSearchService._processSingleLead(place, search, pushStatus, opts);
                    if (lead) processedLeads.push(lead);
                } catch (err) {
                    console.error(`[LeadSearchService] Error processing lead ${place.name}:`, err.message);
                    // Individual lead failure does NOT abort the batch
                }
            }

            if (session) await session.commitTransaction();
            return processedLeads;

        } catch (error) {
            if (session && session.inTransaction()) await session.abortTransaction();
            console.error('[LeadSearchService] Transaction aborted:', error.message);
            throw error;
        } finally {
            if (session) await session.endSession();
        }
    }

    /**
     * Processes a single Google Place result into a Lead document.
     * Handles: duplicate check, zombie filter, sinkhole detection, domain dedup, scoring.
     */
    static async _processSingleLead(place, search, pushStatus, opts = {}) {
        // 1. Duplicate check by placeId
        const existingLead = await Lead.findOne({ placeId: place.id }, null, opts);
        if (existingLead) {
            await pushStatus(`⏭️ Omitiendo duplicado: ${place.name}`, 'info');
            return existingLead;
        }

        await pushStatus(`📎 Procesando: ${place.name}...`, 'info');

        // 2. Zombie Filter: Ignore non-operational businesses
        if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') {
            await pushStatus(`⏭️ Omitiendo negocio inactivo (Zombie): ${place.name}`, 'info');
            return null;
        }

        // 3. Website Hygiene: Sinkhole Detection + Rented Land Filter + Domain Dedup
        if (place.websiteUri) {
            const domain = new URL(place.websiteUri).hostname.replace('www.', '');
            const urlLower = place.websiteUri.toLowerCase();

            // 3a. Domain Parking / For-Sale Sinkhole
            const sinkholes = ['hugedomains.com', 'dan.com', 'sedo.com', 'afternic.com', 'domainmarket.com', 'godaddy.com/forsale'];
            if (sinkholes.some(sink => domain.toLowerCase().includes(sink) || urlLower.includes(sink))) {
                await pushStatus(`🚧 Dominio en venta detectado (${domain}). Removiendo URL fantasma...`, 'info');
                place.websiteUri = null;
            } else if (RENTED_LAND_DOMAINS.some(rl => urlLower.includes(rl))) {
                await pushStatus(`🏚️ Tierra Alquilada detectada (${domain}). Marcando como sin web propia...`, 'info');
                // Keep websiteUri for Spider to classify, but flag it
            } else {
                const duplicateByDomain = await Lead.findOne({ website: new RegExp(domain, 'i') }, null, opts);
                if (duplicateByDomain) return duplicateByDomain;
            }
        }

        // 4. Direct Mapping from V1 FieldMask
        const leadData = {
            placeId: place.id,
            name: place.name,
            address: place.formatted_address,
            phoneNumber: place.nationalPhoneNumber,
            website: place.websiteUri,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            location: {
                lat: place.location?.latitude || 0,
                lng: place.location?.longitude || 0
            },
            googleMapsUrl: place.googleMapsUri,
            searchId: search._id,
            reviews: [],
            is_zombie: false,
            is_advertising: false,
            status: (!place.nationalPhoneNumber && !place.websiteUri) ? 'En Espera' : 'Nuevo',
            source: 'google_maps',
            enrichmentStatus: 'unprocessed'
        };

        // 5. Scoring & NLP (Fail-Safe)
        try {
            console.log(`[INGESTION] Iniciando scoring para: ${leadData.name}`);
            leadData.leadOpportunityScore = ScoringService.calculateScore(leadData) || 0;
            leadData.opportunityLevel = ScoringService.getOpportunityLevel(leadData.leadOpportunityScore, leadData) || 'Low';
            leadData.sales_angle = ScoringService.generateRefinedAngle(leadData, leadData.reviews) || 'Análisis estándar';
            leadData.isHighTicket = leadData.opportunityLevel === 'Critical';
        } catch (scoringErr) {
            console.error(`[CRITICAL] Error en scoring para ${leadData.name}:`, scoringErr.message);
            leadData.leadOpportunityScore = 0;
            leadData.opportunityLevel = 'Low';
            leadData.sales_angle = 'Error en procesador de inteligencia';
        }

        // 6. Persist to MongoDB
        const created = await Lead.create([leadData], opts);
        return Array.isArray(created) ? created[0] : created;
    }

    /**
     * Calculates summary statistics from processed leads.
     */
    static _calculateStats(processedLeads) {
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

        return {
            leadsWithWeb,
            leadsWithEmail,
            averageRating: ratedLeadsCount > 0 ? totalRating / ratedLeadsCount : 0
        };
    }

    /**
     * Safely starts a Mongoose session for transactions.
     * Returns null if the MongoDB deployment doesn't support transactions
     * (e.g. standalone mode without a replica set).
     */
    static async _startSession() {
        try {
            const session = await mongoose.startSession();
            return session;
        } catch (err) {
            console.warn('[LeadSearchService] Mongoose sessions not supported (standalone mode). Proceeding without transactions.');
            return null;
        }
    }
}

export default LeadSearchService;
