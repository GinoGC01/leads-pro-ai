import mongoose from 'mongoose';

const ApiUsageSchema = new mongoose.Schema({
    month: {
        type: String, // Format: YYYY-MM (e.g., "2026-02")
        required: true,
        unique: true
    },
    // Google Places API V1 (Text Search Pro SKU: $0.032/request)
    textSearchCount: {
        type: Number,
        default: 0
    },
    placeDetailsCount: {
        type: Number,
        default: 0
    },
    googlePlacesCostUSD: {
        type: Number,
        default: 0
    },
    // OpenAI API
    openaiCalls: {
        type: Number,
        default: 0
    },
    openaiTokensInput: {
        type: Number,
        default: 0
    },
    openaiTokensOutput: {
        type: Number,
        default: 0
    },
    openaiCostUSD: {
        type: Number,
        default: 0
    },
    // Legacy compat
    openaiTokens: {
        type: Number,
        default: 0
    },
    // Daily granularity for charts
    dailyBreakdown: [{
        date: { type: String }, // YYYY-MM-DD
        googleCalls: { type: Number, default: 0 },
        googleCostUSD: { type: Number, default: 0 },
        openaiCalls: { type: Number, default: 0 },
        openaiTokens: { type: Number, default: 0 },
        openaiCostUSD: { type: Number, default: 0 }
    }],
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

// Track a Google Places API call with V1 Pro pricing ($0.032/req)
ApiUsageSchema.statics.trackGoogleCall = async function (callType = 'textSearch') {
    const COST_PER_REQUEST = 0.032;
    const today = new Date().toISOString().slice(0, 10);
    const usage = await this.getCurrentMonth();

    if (callType === 'textSearch') {
        usage.textSearchCount += 1;
        usage.googlePlacesCostUSD = parseFloat((usage.textSearchCount * COST_PER_REQUEST).toFixed(4));
    } else {
        usage.placeDetailsCount += 1;
    }

    // Daily breakdown
    let dayEntry = usage.dailyBreakdown.find(d => d.date === today);
    if (!dayEntry) {
        usage.dailyBreakdown.push({ date: today, googleCalls: 0, googleCostUSD: 0, openaiCalls: 0, openaiTokens: 0, openaiCostUSD: 0 });
        dayEntry = usage.dailyBreakdown[usage.dailyBreakdown.length - 1];
    }
    dayEntry.googleCalls += 1;
    dayEntry.googleCostUSD = parseFloat((dayEntry.googleCalls * COST_PER_REQUEST).toFixed(4));

    usage.updatedAt = new Date();
    await usage.save();
};

// Track an OpenAI API call with token usage (GPT-4o pricing)
ApiUsageSchema.statics.trackOpenAICall = async function (promptTokens, completionTokens) {
    const INPUT_COST_PER_M = 2.50;   // $/1M input tokens
    const OUTPUT_COST_PER_M = 10.00;  // $/1M output tokens
    const today = new Date().toISOString().slice(0, 10);
    const usage = await this.getCurrentMonth();

    const callCost = (promptTokens / 1_000_000 * INPUT_COST_PER_M) + (completionTokens / 1_000_000 * OUTPUT_COST_PER_M);

    usage.openaiCalls += 1;
    usage.openaiTokensInput += promptTokens;
    usage.openaiTokensOutput += completionTokens;
    usage.openaiTokens += (promptTokens + completionTokens);
    usage.openaiCostUSD = parseFloat((usage.openaiCostUSD + callCost).toFixed(6));

    // Daily breakdown
    let dayEntry = usage.dailyBreakdown.find(d => d.date === today);
    if (!dayEntry) {
        usage.dailyBreakdown.push({ date: today, googleCalls: 0, googleCostUSD: 0, openaiCalls: 0, openaiTokens: 0, openaiCostUSD: 0 });
        dayEntry = usage.dailyBreakdown[usage.dailyBreakdown.length - 1];
    }
    dayEntry.openaiCalls += 1;
    dayEntry.openaiTokens += (promptTokens + completionTokens);
    dayEntry.openaiCostUSD = parseFloat((dayEntry.openaiCostUSD + callCost).toFixed(6));

    usage.updatedAt = new Date();
    await usage.save();
};

export default mongoose.model('ApiUsage', ApiUsageSchema);
