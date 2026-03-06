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
    core_services: [{
        name: { type: String, required: true },
        description: { type: String, required: true },
        ideal_for: { type: String }
    }],
    value_proposition: {
        type: String,
        default: 'Ayudamos a empresas a escalar con tecnología e inteligencia artificial.'
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
