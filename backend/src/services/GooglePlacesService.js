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
                let requestUrl = `${BASE_URL}/textsearch/json`;
                let isPagination = !!nextPageToken;

                // Definir parámetros base (usados tanto en búsqueda inicial como en paginación)
                const baseQuery = (location && !/^-?\d/.test(location)) ? `${keyword} ${location}` : keyword;

                if (isPagination) {
                    // FIX ROTUNDO: Google, contra su propia documentación oficial en muchos casos, 
                    // REQUIRES que el 'query' original esté presente junto al 'pagetoken' 
                    // para evitar INVALID_REQUEST en ciertas regiones o tipos de búsqueda.
                    const safeParams = new URLSearchParams();
                    safeParams.append('pagetoken', nextPageToken.trim());
                    safeParams.append('key', GOOGLE_API_KEY);

                    // Re-inyectamos el contexto inicial
                    safeParams.append('query', baseQuery);
                    if (region) safeParams.append('region', region.toLowerCase());

                    const isCoords = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(location);
                    if (isCoords) {
                        safeParams.append('location', location.replace(/\s/g, ''));
                        const r = parseInt(radius);
                        if (!isNaN(r)) safeParams.append('radius', r.toString());
                    }

                    requestUrl = `${requestUrl}?${safeParams.toString()}`;
                    console.log(`[GooglePlaces] Paginación con persistencia de query. Token: ${nextPageToken.substring(0, 15)}...`);
                } else {
                    // Construcción inicial
                    const safeParams = new URLSearchParams({
                        query: baseQuery,
                        key: GOOGLE_API_KEY
                    });

                    if (region) safeParams.append('region', region.toLowerCase());

                    const isCoords = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(location);
                    if (isCoords) {
                        safeParams.append('location', location.replace(/\s/g, ''));
                        const r = parseInt(radius);
                        if (!isNaN(r)) safeParams.append('radius', r.toString());
                    }
                    requestUrl = `${requestUrl}?${safeParams.toString()}`;
                    console.log(`[GooglePlaces] Búsqueda inicial configurada. Query: ${baseQuery}`);
                }

                let response;
                let data;

                // Ajuste estadístico de maduración
                let retries = isPagination ? 3 : 1;
                let attempt = 0;
                let dataIsValid = false;

                while (attempt < retries) {
                    attempt++;

                    if (isPagination) {
                        // Latencia matemática razonable: 2s, 4s, 6s. 
                        const delay = attempt * 2000;
                        console.log(`[GooglePlaces] Maduración de Token: Intento ${attempt}/${retries} (${delay}ms)...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }

                    try {
                        // Ejecución estéril: pasamos la URL absoluta pre-computada. Axios solo ejecuta la red.
                        response = await axios.get(requestUrl);
                        data = response.data;
                    } catch (err) {
                        console.error('[GooglePlaces] Fallo de red a nivel TCP/TLS:', err.message);
                        throw err; // Un error aquí es infraestructural, lo propagamos.
                    }

                    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
                        dataIsValid = true;
                        // Track SKU Usage (Text Search)
                        try {
                            const usage = await ApiUsage.getCurrentMonth();
                            usage.textSearchCount += 1;
                            await usage.save();
                        } catch (usageErr) {
                            console.error('[Billing] Error tracking Text Search SKU:', usageErr.message);
                        }
                        break; // Salimos del bucle de reintentos, tenemos datos útiles.
                    } else if (data.status === 'INVALID_REQUEST') {
                        if (isPagination && attempt < retries) {
                            console.warn(`[GooglePlaces] INVALID_REQUEST. Esperando replicación del clúster de Google...`);
                            continue;
                        }

                        console.error('[GooglePlaces] Colapso de integridad del token o fin de paginación forzada por Google.');
                        nextPageToken = null; // Forzamos la salida del bucle principal
                        break;
                    } else {
                        console.error(`[GooglePlaces] Error terminal de API: ${data.status}`);
                        nextPageToken = null;
                        break;
                    }
                }

                // Lógica de procesamiento de negocio: solo actuamos si los datos sobrevivieron al escrutinio
                if (dataIsValid && data && data.status === 'OK') {
                    const filteredResults = (data.results || []).filter(place =>
                        this.validateRelevance(keyword, place.types || [], place.name)
                    );

                    results = [...results, ...filteredResults];

                    // Solo asignamos un nuevo token si existe, de lo contrario lo anulamos para romper el do-while
                    nextPageToken = data.next_page_token || null;
                    console.log(`[GooglePlaces] Leads relevantes en este lote: ${filteredResults.length}. Total acumulado: ${results.length}.`);
                } else if (dataIsValid && data && data.status === 'ZERO_RESULTS') {
                    console.log(`[GooglePlaces] ZERO_RESULTS devuelto. Límite del sector alcanzado naturalemente.`);
                    nextPageToken = null;
                }

                if (results.length >= maxResults) {
                    console.log(`[GooglePlaces] Límite de ${maxResults} resultados alcanzado. Terminando búsqueda.`);
                    break;
                }

            } while (nextPageToken && results.length < maxResults);

            // Retornamos cortando exactamente en maxResults para evitar desbordamientos
            return results.slice(0, maxResults);

        } catch (error) {
            console.error('[GooglePlaces] Error crítico en searchPlaces:', error.message);
            // Principio de preservación: Si el sistema colapsa pero ya habíamos recolectado datos,
            // devolvemos los datos en lugar de estrellar el pipeline entero.
            if (results.length > 0) {
                console.warn(`[GooglePlaces] Retornando ${results.length} leads parciales tras el colapso.`);
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
