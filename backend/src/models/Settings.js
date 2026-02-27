const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    // We only need one settings document acting as a singleton
    isSingleton: {
        type: Boolean,
        default: true,
        unique: true
    },
    agencyContext: {
        type: String,
        default: '# Agency Context\nModify this to define your business rules for the AI.',
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Settings', SettingsSchema);
