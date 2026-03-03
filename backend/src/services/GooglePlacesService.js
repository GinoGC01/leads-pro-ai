import axios from 'axios';
import dotenv from 'dotenv';
import ApiUsage from '../models/ApiUsage.js';
import SystemConfig from '../models/SystemConfig.js';
import { decrypt } from '../utils/encryptionVault.js';

dotenv.config();

/**
 * Resolve Google API key dynamically: vault first, then .env fallback.
 */
async function getGoogleApiKey() {
    try {
        const config = await SystemConfig.getInstance();
        const vaultKey = decrypt(config.api_keys?.google_places_encrypted);
        if (vaultKey) return vaultKey;
    } catch (e) { /* SystemConfig not ready yet, use env */ }
    return process.env.GOOGLE_PLACES_API_KEY;
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
                const apiKey = await getGoogleApiKey();
                if (!apiKey) throw new Error('No hay API Key de Google Places configurada (ni en Vault ni en .env)');
                const headers = {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.types,places.businessStatus,nextPageToken'
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
                        await ApiUsage.trackGoogleCall('textSearch');
                    } catch (usageErr) { }
                    break;
                }

                if (dataIsValid && data) {
                    // Extract new places array
                    const places = data.places || [];

                    // Map the new V1 format to a compatible flat object
                    const mappedResults = places.map(p => ({
                        id: p.id,
                        name: p.displayName?.text || '',
                        formatted_address: p.formattedAddress,
                        nationalPhoneNumber: p.nationalPhoneNumber,
                        internationalPhoneNumber: p.internationalPhoneNumber,
                        websiteUri: p.websiteUri,
                        googleMapsUri: p.googleMapsUri,
                        rating: p.rating,
                        user_ratings_total: p.userRatingCount,
                        types: p.types || [],
                        businessStatus: p.businessStatus
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

}

export default GooglePlacesService;
