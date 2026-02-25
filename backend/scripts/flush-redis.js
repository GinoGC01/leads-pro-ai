const Redis = require('ioredis');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root .env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function flushRedis() {
    console.log('--- [Vortex Ops] Initiating Redis Queue Sanitization ---');

    // Safety check for production environment
    if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: Cannot flush Redis in PRODUCTION mode.');
        process.exit(1);
    }

    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const redis = new Redis(redisUrl);

    try {
        const dbsizeBefore = await redis.dbsize();
        console.log(`Current keys in Redis: ${dbsizeBefore}`);

        console.log('Executing FLUSHALL...');
        await redis.flushall();

        const dbsizeAfter = await redis.dbsize();
        console.log(`[Vortex Ops] Redis state completely flushed. Queue is zero (DBSize: ${dbsizeAfter}).`);
    } catch (error) {
        console.error('Error flushing Redis:', error.message);
        process.exit(1);
    } finally {
        await redis.quit();
        process.exit(0);
    }
}

flushRedis();
