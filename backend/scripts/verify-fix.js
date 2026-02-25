const GooglePlacesService = require('../src/services/GooglePlacesService');
require('dotenv').config();

async function verifyFix() {
    console.log('--- VERIFYING FINAL FIX IN SITU ---');
    try {
        const keyword = 'farmacia';
        const location = 'Jose C paz';
        const results = await GooglePlacesService.searchPlaces(keyword, location, 5000, 20, 40, 'AR');

        console.log('\nSearch Results:');
        console.log('Total Leads Received:', results.length);

        if (results.length > 20) {
            console.log('SUCCESS: Pagination worked! (Found more than 20 results)');
        } else {
            console.log('FAILURE: Still capped at 20 or less.');
        }

    } catch (err) {
        console.error('Verification failed:', err.message);
    }
}

verifyFix();
