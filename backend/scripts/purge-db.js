import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lead from '../src/models/Lead.js';
import SearchHistory from '../src/models/SearchHistory.js';
import ChatSession from '../src/models/ChatSession.js';

dotenv.config();

/**
 * CAUTION: Destructive script to purge the DB.
 */
async function purgeDatabase() {
    try {
        console.log('🔌 Conectando a MongoDB para purgar datos...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leads-pro-ai');
        console.log('✅ Conectado.');

        console.log('🧹 Vaciando colección Leads (Lead)...');
        await Lead.deleteMany({});

        console.log('🧹 Vaciando colección Historial de Búsquedas (SearchHistory)...');
        await SearchHistory.deleteMany({});

        console.log('🧹 Vaciando colección Sesiones de Chat (ChatSession)...');
        await ChatSession.deleteMany({});

        // Settings or ApiUsage are generally left alone, but if you want true zero, we can add them.

        console.log('🔥 Purgación completada con éxito. Base de datos en 0.');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error durante la purga:', error);
        process.exit(1);
    }
}

purgeDatabase();
