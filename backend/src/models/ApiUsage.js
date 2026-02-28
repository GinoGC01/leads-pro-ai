import mongoose from 'mongoose';

const ApiUsageSchema = new mongoose.Schema({
    month: {
        type: String, // Format: YYYY-MM (e.g., "2026-02")
        required: true,
        unique: true
    },
    textSearchCount: {
        type: Number,
        default: 0
    },
    placeDetailsCount: {
        type: Number,
        default: 0
    },
    openaiTokens: {
        type: Number,
        default: 0
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Helper to get or create current month usage
ApiUsageSchema.statics.getCurrentMonth = async function () {
    const currentMonth = new Date().toISOString().slice(0, 7);
    let usage = await this.findOne({ month: currentMonth });
    if (!usage) {
        usage = await this.create({ month: currentMonth });
    }
    return usage;
};

export default mongoose.model('ApiUsage', ApiUsageSchema);
