import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import SearchHistory from '../src/models/SearchHistory.js';
import CampaignService from '../src/services/CampaignService.js';

async function syncAll() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const searches = await SearchHistory.find({});
        console.log(`Found ${searches.length} campaigns to evaluate.`);

        for (const search of searches) {
            await CampaignService.evaluateCampaignStatus(search._id);
        }

        console.log('Sync complete!');
        process.exit(0);
    } catch (e) {
        console.error('Fatal error:', e);
        process.exit(1);
    }
}

syncAll();
