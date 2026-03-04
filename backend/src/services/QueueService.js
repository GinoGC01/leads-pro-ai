import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Conexión centralizada a Redis
const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null
});

// Eventos Globales (Singleton) para Telemetría SSE
const enrichmentEvents = new QueueEvents('enrichmentQueue', { connection });
const visionEvents = new QueueEvents('visionQueue', { connection });

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

// Inicialización de la cola de visión profunda (Deep Vision)
const visionQueue = new Queue('visionQueue', {
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
 * @returns {string|null} El ID único del trabajo (jobId).
 */
const addLeadToEnrichment = async (leadData) => {
    try {
        const uniqueJobId = `${leadData._id.toString()}-${Date.now()}`;
        await enrichmentQueue.add('enrich_lead', {
            leadId: leadData._id,
            website: leadData.website,
            name: leadData.name
        }, { jobId: uniqueJobId });
        console.log(`[QueueService] Lead encolado: ${leadData.name} (Job: ${uniqueJobId})`);
        return uniqueJobId;
    } catch (error) {
        console.error('[QueueService] Error al encolar lead:', error);
        return null;
    }
};

/**
 * Agrega un lead a la cola de Deep Vision.
 * @param {Object} leadData - Datos del lead.
 * @returns {string|null} El ID único del trabajo (jobId).
 */
const addLeadToVision = async (leadData) => {
    try {
        const uniqueJobId = `${leadData._id.toString()}-${Date.now()}-vision`;
        await visionQueue.add('process_vision', {
            leadId: leadData._id
        }, { jobId: uniqueJobId });
        console.log(`[QueueService] Lead encolado a Deep Vision: (Job: ${uniqueJobId})`);
        return uniqueJobId;
    } catch (error) {
        console.error('[QueueService] Error al encolar lead a Deep Vision:', error);
        return null;
    }
};

export {
    enrichmentQueue,
    enrichmentEvents,
    addLeadToEnrichment,
    visionQueue,
    visionEvents,
    addLeadToVision,
    connection
};
