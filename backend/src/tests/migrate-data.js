import { MongoClient } from 'mongodb';

async function migrate() {
    const url = 'mongodb://127.0.0.1:27017';
    const client = new MongoClient(url);

    try {
        await client.connect();
        const sourceDb = client.db('test');
        const targetDb = client.db('leads_pro_ai');

        console.log('--- MIGRATION: test -> leads_pro_ai ---');

        // 1. Migrate SearchHistory
        const histories = await sourceDb.collection('searchhistories').find({
            keyword: /estetica/i
        }).toArray();

        console.log(`Found ${histories.length} history records to migrate.`);
        for (const h of histories) {
            const exists = await targetDb.collection('searchhistories').findOne({ _id: h._id });
            if (!exists) {
                await targetDb.collection('searchhistories').insertOne(h);
                console.log(`  + Migrated History: ${h.keyword} (${h._id})`);
            } else {
                console.log(`  . History already exists: ${h.keyword}`);
            }
        }

        // 2. Migrate Leads
        const leads = await sourceDb.collection('leads').find({
            $or: [{ name: /Estetica/i }, { address: /Madrid|Argentina/i }]
        }).toArray();

        console.log(`\nFound ${leads.length} leads to migrate.`);
        let migratedLeads = 0;
        for (const l of leads) {
            const exists = await targetDb.collection('leads').findOne({ placeId: l.placeId });
            if (!exists) {
                await targetDb.collection('leads').insertOne(l);
                migratedLeads++;
            }
        }
        console.log(`✅ Migrated ${migratedLeads} leads to leads_pro_ai.`);

    } catch (e) {
        console.error('Migration Error:', e);
    } finally {
        await client.close();
    }
}

migrate();
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
