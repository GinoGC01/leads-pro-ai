import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Lead from './src/models/Lead.js';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leads_pro_ai';

async function reset() {
    try {
        await mongoose.connect(uri);
        const result = await Lead.updateMany(
            { enrichmentStatus: 'pending' },
            { $set: { enrichmentStatus: 'unprocessed' } }
        );
        console.log('Reset result:', result);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

reset();
