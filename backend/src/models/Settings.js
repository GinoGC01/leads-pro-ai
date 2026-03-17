import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  isSingleton: {
    type: Boolean,
    default: true,
    unique: true,
  },
  sales_rep_name: { type: String, default: "" },
  agency_name: { type: String, default: "" },
  linguistic_behavior: {
    type: String,
    enum: ["AUTO", "LATAM", "EXPORT"],
    default: "AUTO",
  },
  value_proposition: { type: String, default: "" },
  core_services: [
    {
      name: String,
      description: String,
      ideal_for: String,
    },
  ],
  rag_predefined_tags: {
    type: [String],
    default: ['abogados', 'clinicas', 'e-commerce', 'inmobiliarias', 'seguros', 'general'],
  },
  mario_core_settings: {
    default_tone: {
      type: String,
      enum: ["CHALLENGER", "CONSULTIVO", "VISIONARIO"],
      default: "CHALLENGER",
    },
    statistical_override_enabled: {
      type: Boolean,
      default: true,
    },
    circuit_breaker_threshold: {
      type: Number,
      min: 0,
      max: 100,
      default: 40,
    },
  },
  mario_objection_mode: {
    type: String,
    enum: ["STANDARD", "CUSTOM"],
    default: "STANDARD",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Settings", SettingsSchema);
