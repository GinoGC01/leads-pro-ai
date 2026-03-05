import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

async function run() {
    const url = 'mongodb://127.0.0.1:27017';
    const client = new MongoClient(url);

    try {
        await client.connect();
        const db = client.db('leads_pro_ai');

        console.log('--- DATABASE AUDIT: leads_pro_ai ---');

        const hCount = await db.collection('searchhistories').countDocuments();
        const lCount = await db.collection('leads').countDocuments();
        console.log(`Total SearchHistories: ${hCount}`);
        console.log(`Total Leads: ${lCount}`);

        // Find leads related to "Estetica"
        const esteticas = await db.collection('leads').find({
            $or: [
                { name: /Estetica/i },
                { keyword: /Estetica/i },
                { address: /Argentina|Madrid/i }
            ]
        }).toArray();

        console.log(`\nFound ${esteticas.length} leads matching "Estetica" or target locations.`);

        if (esteticas.length > 0) {
            const searchIds = [...new Set(esteticas.map(l => l.searchId?.toString()).filter(id => id))];
            console.log(`Associated SearchIDs found in leads: ${searchIds.length}`);

            for (const sId of searchIds) {
                const history = await db.collection('searchhistories').findOne({ _id: sId.length === 24 ? ObjectId.createFromHexString(sId) : sId });
                console.log(`- SearchID ${sId}: ${history ? `FOUND (${history.keyword})` : 'MISSING in SearchHistories'}`);
            }

            // Sample of first 3 esteticas
            console.log('\nSample Estetica Leads:');
            console.log(JSON.stringify(esteticas.slice(0, 3).map(l => ({
                name: l.name,
                address: l.address,
                searchId: l.searchId
            })), null, 2));
        }

        // Check for other potential databases
        const admin = client.db().admin();
        const dbs = await admin.listDatabases();
        console.log('\nAll Databases on Instance:', dbs.databases.map(d => d.name));

    } catch (e) {
        console.error('Error during audit:', e);
    } finally {
        await client.close();
    }
}

run();
