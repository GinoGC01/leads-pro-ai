import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const testGoogleApi = async () => {
    const key = process.env.GOOGLE_PLACES_API_KEY;
    console.log('\n--- Diagnóstico de Google Places API ---');

    if (!key || key === 'TU_API_KEY_AQUI' || key.length < 10) {
        console.error('❌ Error: No se detectó una API Key válida en el archivo .env');
        console.log('Asegúrate de configurar GOOGLE_PLACES_API_KEY en backend/.env');
        process.exit(1);
    }

    console.log(`🔑 Validando API Key: ${key.substring(0, 5)}...${key.substring(key.length - 4)}`);

    try {
        // Simple search for "Cafe" in a generic location
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=cafe&key=${key}`;
        const response = await axios.get(url);

        if (response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS') {
            console.log('✅ ¡Éxito! La conexión con Google Places API funciona correctamente.');
            console.log(`- Estado devuelto: ${response.data.status}`);
            if (response.data.results) {
                console.log(`- Ejemplo de resultados recibidos: ${response.data.results.length}`);
            }
            process.exit(0);
        } else {
            console.error(`❌ Error de Google API: ${response.data.status}`);
            if (response.data.error_message) {
                console.error(`- Mensaje detallado: ${response.data.error_message}`);
            }
            if (response.data.status === 'REQUEST_DENIED') {
                console.log('- Tip: Revisa que la "Places API" esté habilitada en tu Google Cloud Console y que la facturación esté activa.');
            }
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error de conexión de red:', error.message);
        process.exit(1);
    }
};

testGoogleApi();
