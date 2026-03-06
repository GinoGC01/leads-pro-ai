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
