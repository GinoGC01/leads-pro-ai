import mongoose from 'mongoose';

const MarioStrategySchema = new mongoose.Schema({
    lead_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true
    },
    strategy_data: {
        type: Object, // Stores the strict JSON object returned by the MARIO V2 War Room
        required: true
    },
    pipeline_metadata: {
        version: { type: String, default: null },           // "V11_MULTI_AGENT" | "V10.4_FALLBACK"
        agents_used: { type: [String], default: [] },       // ["RESEARCHER", "STRATEGIST", "COPYWRITER"]
        total_tokens: { type: Number, default: 0 },
        total_cost_usd: { type: Number, default: 0 },
        agent_timings: { type: Object, default: {} },       // { researcher_ms, strategist_ms, copywriter_ms }
        fallback_reason: { type: String, default: null }    // Populated only if V10.4 fallback was used
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    human_score: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    human_feedback: {
        type: String,
        default: null
    },
    generated_at: {
        type: Date,
        default: Date.now
    }
});

// Index to quickly fetch past strategies for a specific lead, ordered by newest first
MarioStrategySchema.index({ lead_id: 1, generated_at: -1 });

export default mongoose.model('MarioStrategy', MarioStrategySchema);
