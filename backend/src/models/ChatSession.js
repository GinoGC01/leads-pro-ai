const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    sources: [{
        name: String,
        id: String,
        similarity: Number
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const ChatSessionSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'Nueva Conversación'
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SearchHistory',
        default: null
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        default: null
    },
    messages: [ChatMessageSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
ChatSessionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
