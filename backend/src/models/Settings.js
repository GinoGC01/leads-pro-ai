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
    senderName: {
        type: String,
        default: 'Gino'
    },
    agencyName: {
        type: String,
        default: 'Mariosweb'
    },
    languageTone: {
        type: String,
        enum: ['AUTO_DETECT', 'FORCE_LATAM', 'FORCE_EXPORT'],
        default: 'AUTO_DETECT'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Settings', SettingsSchema);
