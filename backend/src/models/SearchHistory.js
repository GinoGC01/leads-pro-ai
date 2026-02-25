const mongoose = require('mongoose');

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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SearchHistory', SearchHistorySchema);
