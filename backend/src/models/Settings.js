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
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Settings", SettingsSchema);
