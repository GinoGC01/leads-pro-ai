import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Conexión centralizada a Redis
const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null
});

// Inicialización de la cola de enriquecimiento
const enrichmentQueue = new Queue('enrichmentQueue', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false
    }
});

/**
 * Agrega un lead a la cola de procesamiento asíncrono.
 * @param {Object} leadData - Datos básicos del lead extraídos por Google API.
 */
const addLeadToEnrichment = async (leadData) => {
    try {
        await enrichmentQueue.add('enrich_lead', {
            leadId: leadData._id,
            website: leadData.website,
            name: leadData.name
        });
        console.log(`[QueueService] Lead encolado: ${leadData.name} (${leadData._id})`);
    } catch (error) {
        console.error('[QueueService] Error al encolar lead:', error);
    }
};

export {
    enrichmentQueue,
    addLeadToEnrichment,
    connection
};
