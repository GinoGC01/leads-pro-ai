const axios = require('axios');
require('dotenv').config();

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

async function diagnose(keyword, location) {
    console.log(`\n--- DIAGNOSING: ${keyword} | ${location} ---`);
    try {
        const params = {
            query: `${keyword} ${location}`,
            key: GOOGLE_API_KEY
        };
        const response1 = await axios.get(BASE_URL, { params });
        console.log('Initial Status:', response1.data.status);
        const token = response1.data.next_page_token;
        if (!token) {
            console.log('No token returned.');
            return;
        }

        const testCases = [
            { name: 'Standard (Token + Key)', wait: 5000, includeQuery: false },
            { name: 'Legacy (Token + Key + Query)', wait: 5000, includeQuery: true }
        ];

        for (const tc of testCases) {
            console.log(`\nStrategy: ${tc.name}`);
            console.log(`Waiting ${tc.wait}ms...`);
            await new Promise(r => setTimeout(r, tc.wait));

            const pagParams = { pagetoken: token, key: GOOGLE_API_KEY };
            if (tc.includeQuery) pagParams.query = `${keyword} ${location}`;

            try {
                const res = await axios.get(BASE_URL, { params: pagParams });
                console.log('Result Status:', res.data.status);
                if (res.data.status !== 'OK') {
                    console.log('Error:', res.data.error_message || 'N/A');
                    console.log('Full JSON Response:', JSON.stringify(res.data, null, 2));
                } else {
                    console.log('SUCCESS! Leads on page 2:', res.data.results?.length);
                }
            } catch (err) {
                console.log('Request Error:', err.message);
            }
        }
    } catch (err) {
        console.error('Err:', err.message);
    }
}

async function run() {
    if (!GOOGLE_API_KEY) {
        console.error('ERROR: GOOGLE_PLACES_API_KEY not found in env');
        return;
    }
    await diagnose('farmacia', 'Jose C paz');
    await diagnose('cafe', 'miami');
}

run();
