const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
    placeId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    address: String,
    phoneNumber: String,
    website: String,
    rating: Number,
    userRatingsTotal: Number,
    location: {
        lat: Number,
        lng: Number
    },
    googleMapsUrl: String,
    email: {
        type: String,
        default: null
    },
    enrichmentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'not_found'],
        default: 'pending'
    },
    leadOpportunityScore: {
        type: Number,
        default: 0
    },
    opportunityLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Low'
    },
    status: {
        type: String,
        enum: ['Nuevo', 'Contactado', 'Cita Agendada', 'Propuesta Enviada', 'Cerrado Ganado', 'Cerrado Perdido'],
        default: 'Nuevo'
    },
    interactionLogs: [{
        timestamp: { type: Date, default: Date.now },
        event: String,
        note: String
    }],
    reviews: [String],
    tech_stack: [String],
    performance_metrics: {
        ttfb: Number,
        performance_issue: Boolean
    },
    is_zombie: {
        type: Boolean,
        default: false
    },
    is_advertising: {
        type: Boolean,
        default: false
    },
    sales_angle: {
        type: String,
        default: null
    },
    isHighTicket: {
        type: Boolean,
        default: false
    },
    searchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SearchHistory'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Lead', LeadSchema);
