import mongoose from 'mongoose';

const SearchHistorySchema = new mongoose.Schema({
    keyword: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    countryCode: {
        type: String,
        default: ''
    },
    radius: {
        type: Number,
        required: true
    },
    resultsCount: {
        type: Number,
        default: 0
    },
    leadsWithWeb: {
        type: Number,
        default: 0
    },
    leadsWithEmail: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    filters: {
        onlyWithWebsite: Boolean,
        onlyWithPhone: Boolean,
        minRating: Number,
        minReviews: Number
    },
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    logs: [{
        timestamp: { type: Date, default: Date.now },
        message: String,
        type: { type: String, default: 'info' }
    }],
    totalCost: {
        type: Number,
        default: 0
    },
    searchMode: {
        type: String,
        enum: ['single', 'grid'],
        default: 'single'
    },
    gridCellsCompleted: {
        type: Number,
        default: 0
    },
    gridCellsTotal: {
        type: Number,
        default: 1
    },
    gridSize: {
        type: Number,
        default: 0 // 3 for 3x3, 5 for 5x5, etc.
    },
    campaignStatus: {
        type: String,
        enum: ['nueva', 'en_proceso', 'en_seguimiento', 'completada', 'archivada'],
        default: 'nueva'
    },
    campaignVolume: {
        type: Number,
        default: 1
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('SearchHistory', SearchHistorySchema);
