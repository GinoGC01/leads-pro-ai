import mongoose from 'mongoose';

/**
 * SystemConfig — Singleton Configuration Model.
 * 
 * Stores AI engine parameters and encrypted API keys.
 * Only ONE document exists in this collection (singleton pattern).
 */
const SystemConfigSchema = new mongoose.Schema({
    ai_engine: {
        model_name: { type: String, default: 'gpt-4o-mini' },
        temperature: { type: Number, default: 0.7, min: 0, max: 1 },
        max_tokens: { type: Number, default: 1500 }
    },
    api_keys: {
        openai_key_encrypted: { type: String, default: null },
        google_places_encrypted: { type: String, default: null }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

/**
 * Get or create the singleton config document.
 */
SystemConfigSchema.statics.getInstance = async function () {
    let config = await this.findOne();
    if (!config) {
        config = await this.create({});
        console.log('[SystemConfig] Singleton creado con valores por defecto.');
    }
    return config;
};

export default mongoose.model('SystemConfig', SystemConfigSchema);
