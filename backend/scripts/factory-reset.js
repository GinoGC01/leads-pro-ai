require('dotenv').config();
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');

const Lead = require('../src/models/Lead');
const SearchHistory = require('../src/models/SearchHistory');

async function factoryReset() {
    console.log('\n[INIT] Empezando el Factory Reset global de Leads Pro AI...');
    console.log('[WARNING] Esta operación destruirá TODOS los datos transaccionales (MongoDB, Supabase, Redis).\n');

    try {
        // 1. MongoDB
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI no está definido en .env');
        }
        console.log('[MONGO] Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('[MONGO] Purgando Leads...');
        await Lead.deleteMany({});

        console.log('[MONGO] Purgando Historial de Campañas...');
        await SearchHistory.deleteMany({});
        console.log('✅ [SUCCESS] Colecciones de MongoDB limpias.\n');

        // 2. Supabase (pgvector)
        if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
            console.log('[SUPABASE] Conectando Client...');
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

            console.log('[SUPABASE] Purgando vectores (business_leads)...');
            // Hack to bypass Supabase's restriction on deleting without filters:
            // Assuming UUID IDs. Filtering out impossible zero UUID to delete everything safely.
            const { error } = await supabase.from('business_leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            if (error) {
                console.error('❌ [SUPABASE] Error al purgar vectores:', error.message);
            } else {
                console.log('✅ [SUCCESS] Supabase (pgvector) limpio.\n');
            }
        } else {
            console.log('⚠️ [SUPABASE] Credenciales no encontradas, ignorando purga vectorial.\n');
        }

        // 3. Redis / BullMQ
        console.log('[REDIS] Conectando a caché en memoria...');
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const redis = new Redis(redisUrl);

        console.log('[REDIS] Vaciando colas y cache residual...');
        await redis.flushall();
        console.log('✅ [SUCCESS] Redis limpio y colas purgadas.\n');

        console.log('[DONE] ♻️  Factory Reset completado con éxito. El sistema es ahora un lienzo en blanco. Saliendo...');

        await mongoose.disconnect();
        await redis.quit();

        process.exit(0);

    } catch (error) {
        console.error('\n❌ [FATAL] Error crítico durante la purga de datos:', error.message);
        process.exit(1);
    }
}

factoryReset();
