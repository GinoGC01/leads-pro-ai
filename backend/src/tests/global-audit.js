const { MongoClient } = require('mongodb');

async function run() {
    const url = 'mongodb://127.0.0.1:27017';
    const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000 });

    try {
        await client.connect();
        const admin = client.db().admin();
        const dbsRes = await admin.listDatabases();

        console.log('--- GLOBAL DATABASE SCAN ---');
        for (const dbInfo of dbsRes.databases) {
            if (['admin', 'config', 'local'].includes(dbInfo.name)) continue;

            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();

            console.log(`\nDB: ${dbInfo.name} (${collections.length} collections)`);

            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();

                // Search for "Estetica" or "Dentist" to see where data lives
                const hit = await db.collection(col.name).findOne({
                    $or: [
                        { name: /Estetica|Dentist/i },
                        { keyword: /Estetica|Dentist/i }
                    ]
                });

                console.log(`  - ${col.name}: ${count} docs ${hit ? `[HIT FOUND!]` : ''}`);

                if (hit) {
                    const sample = await db.collection(col.name).find({
                        $or: [
                            { name: /Estetica|Dentist/i },
                            { keyword: /Estetica|Dentist/i }
                        ]
                    }).limit(2).toArray();
                    console.log(`    Sample: ${JSON.stringify(sample.map(d => ({ name: d.name, kw: d.keyword })), null, 2)}`);
                }
            }
        }
    } catch (e) {
        console.error('Audit Error:', e);
    } finally {
        await client.close();
    }
}

run();
