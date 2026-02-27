const axios = require('axios');
const dotenv = require('dotenv');
const ApiUsage = require('../models/ApiUsage');

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!GOOGLE_API_KEY || GOOGLE_API_KEY.length < 10) {
    console.error('CRITICAL: GOOGLE_PLACES_API_KEY is missing or invalid in .env file!');
}

const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Service to interact with Google Places API
 */
class GooglePlacesService {
    /**
     * Search for places based on keyword and location
     */
    static async searchPlaces(keyword, location, radius, minResults = 20, maxResults = 60, region = '') {
        let results = [];
        let nextPageToken = '';

        try {
            do {
                const requestUrl = 'https://places.googleapis.com/v1/places:searchText';
                const baseQuery = (location && !/^-?\d/.test(location)) ? `${keyword} ${location}` : keyword;

                const requestBody = {
                    textQuery: baseQuery,
                    pageSize: 20,
                    languageCode: 'es'
                };

                if (region) {
                    requestBody.regionCode = region.toUpperCase();
                }

                if (nextPageToken) {
                    requestBody.pageToken = nextPageToken;
                    console.log(`[GooglePlaces] Paginación API V1. Token: ${nextPageToken.substring(0, 15)}...`);
                } else {
                    console.log(`[GooglePlaces] Búsqueda inicial API V1. Query: ${baseQuery}`);
                }

                const isCoords = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(location);
                if (isCoords) {
                    const [lat, lng] = location.split(',').map(Number);
                    requestBody.locationBias = {
                        circle: {
                            center: { latitude: lat, longitude: lng },
                            radius: parseInt(radius) || 50000.0
                        }
                    };
                }

                // FASE 1: Inyección del FieldMask Correcto
                const headers = {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_API_KEY,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types,nextPageToken'
                };

                let response;
                let data;

                let retries = nextPageToken ? 3 : 1;
                let attempt = 0;
                let dataIsValid = false;

                while (attempt < retries) {
                    attempt++;

                    if (nextPageToken) {
                        const delay = attempt * 2000;
                        console.log(`[GooglePlaces] Maduración de Token V1: Intento ${attempt}/${retries} (${delay}ms)...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }

                    try {
                        response = await axios.post(requestUrl, requestBody, { headers });
                        data = response.data;
                    } catch (err) {
                        console.error('[GooglePlaces] Fallo de red API V1:', err.response?.data?.error?.message || err.message);
                        if (nextPageToken && attempt < retries) continue;
                        throw err;
                    }

                    dataIsValid = true;
                    try {
                        const usage = await ApiUsage.getCurrentMonth();
                        usage.textSearchCount += 1;
                        await usage.save();
                    } catch (usageErr) { }
                    break;
                }

                if (dataIsValid && data) {
                    // Extract new places array
                    const places = data.places || [];

                    // Map the new V1 format to a compatible flat object
                    const mappedResults = places.map(p => ({
                        place_id: p.id,
                        name: p.displayName?.text || '',
                        formatted_address: p.formattedAddress,
                        nationalPhoneNumber: p.nationalPhoneNumber,
                        internationalPhoneNumber: p.internationalPhoneNumber,
                        websiteUri: p.websiteUri,
                        rating: p.rating,
                        user_ratings_total: p.userRatingCount,
                        types: p.types || []
                    }));

                    const filteredResults = mappedResults.filter(place =>
                        this.validateRelevance(keyword, place.types, place.name)
                    );

                    results = [...results, ...filteredResults];
                    nextPageToken = data.nextPageToken || null;
                    console.log(`[GooglePlaces] Leads en lote: ${filteredResults.length}. Total acumulado: ${results.length}.`);
                } else if (!data || (!data.places && !data.nextPageToken)) {
                    console.log(`[GooglePlaces] Búsqueda finalizada o ZERO_RESULTS.`);
                    nextPageToken = null;
                }

                if (results.length >= maxResults) {
                    console.log(`[GooglePlaces] Límite de ${maxResults} resultados alcanzado.`);
                    break;
                }

            } while (nextPageToken && results.length < maxResults);

            return results.slice(0, maxResults);

        } catch (error) {
            console.error('[GooglePlaces] Error crítico API V1:', error.message);
            if (results.length > 0) {
                console.warn(`[GooglePlaces] Salvando ${results.length} leads parciales.`);
                return results.slice(0, maxResults);
            }
            throw error;
        }
    }

    /**
     * Helper to validate if a result is relevant to the keyword
     */
    static validateRelevance(keyword, types, name) {
        const kw = keyword.toLowerCase();
        const n = name.toLowerCase();

        // 1. Cross-industry safety: If looking for health/doctor, don't return lawyer
        const isMedicalQuery = kw.includes('medico') || kw.includes('doctor') || kw.includes('consultorio') || kw.includes('salud') || kw.includes('clinica');
        const isLawyerType = types.includes('lawyer') || n.includes('abogado') || n.includes('juridico') || n.includes('legal');

        if (isMedicalQuery && isLawyerType) {
            console.warn(`[Relevance] Filtrado automático: ${name} (Lawyer) en búsqueda Médica.`);
            return false;
        }

        // 2. Add more domain-specific filters as needed
        return true;
    }

    /**
     * Get detailed information for a specific place
     */
    static async getPlaceDetails(placeId) {
        const url = `${BASE_URL}/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,geometry,url,reviews&key=${GOOGLE_API_KEY}`;

        try {
            const response = await axios.get(url);
            const data = response.data;

            if (data.status !== 'OK') {
                throw new Error(`Google API Details Error: ${data.status}`);
            }

            // Track SKU Usage (Place Details)
            try {
                const usage = await ApiUsage.getCurrentMonth();
                usage.placeDetailsCount += 1;
                await usage.save();
            } catch (usageErr) {
                console.error('[Billing] Error tracking Place Details SKU:', usageErr.message);
            }

            return data.result;
        } catch (error) {
            console.error(`Error in getPlaceDetails for ${placeId}:`, error.message);
            return null;
        }
    }
}

module.exports = GooglePlacesService;
