import mongoose from 'mongoose';

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

export default mongoose.model('Settings', SettingsSchema);
