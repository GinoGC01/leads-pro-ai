import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema({
  placeId: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
  },
  address: String,
  phoneNumber: String,
  website: String,
  rating: Number,
  userRatingsTotal: Number,
  location: {
    lat: Number,
    lng: Number,
  },
  googleMapsUrl: String,
  email: {
    type: String,
    default: null,
  },
  enrichmentStatus: {
    type: String,
    enum: [
      "unprocessed",
      "pending",
      "completed",
      "failed",
      "not_found",
      "skipped_rented_land",
    ],
    default: "unprocessed",
  },
  vortex_status: {
    type: String,
    enum: [
      "pending",
      "base_completed",
      "vision_processing",
      "vision_completed",
      "failed",
      "disqualified",
    ],
    default: "pending",
  },
  enrichmentError: {
    type: String,
    default: null,
  },
  leadOpportunityScore: {
    type: Number,
    default: 0,
  },
  opportunityLevel: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Low",
  },
  status: {
    type: String,
    enum: [
      "Nuevo",
      "Contactado",
      "Cita Agendada",
      "Propuesta Enviada",
      "Cerrado Ganado",
      "Cerrado Perdido",
      "En Espera",
      "Sin WhatsApp",
      "Descartados",
    ],
    default: "Nuevo",
  },
  interactionLogs: [
    {
      timestamp: { type: Date, default: Date.now },
      event: String,
      note: String,
    },
  ],
  reviews: [String],
  tech_stack: [String],
  performance_metrics: {
    ttfb: Number,
    performanceScore: Number,
    lcp: String,
    performance_issue: Boolean,
  },
  seo_audit: {
    hasTitle: Boolean,
    hasMetaDescription: Boolean,
    h1Count: Number,
    titleText: String,
    metaDescription: String,
  },
  markdown_content: String,
  is_zombie: {
    type: Boolean,
    default: false,
  },
  is_advertising: {
    type: Boolean,
    default: false,
  },
  sales_angle: {
    type: String,
    default: null,
  },
  isHighTicket: {
    type: Boolean,
    default: false,
  },
  searchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SearchHistory",
  },
  source: {
    type: String,
    enum: ["google_maps", "manual", "referido", "red_social", "evento", "otro"],
    default: "google_maps",
  },
  sourceLabel: {
    type: String,
    default: null,
  },
  extracted_contacts: {
    emails: [String],
    phones: [String],
    social_links: [
      {
        platform: String,
        url: String,
      },
    ],
  },
  tactical_response: {
    type: String,
    default: null,
  },
  spider_memory: {
    applied_tactic: { type: String, default: null }, // Ej: 'SOFTWARE_MEDIDA_REACT'
    friction_score: {
      type: String,
      enum: ["LOW", "HIGH", "UNKNOWN", "N/A"],
      default: "UNKNOWN",
    },
    historical_confidence: { type: Number, default: 0 }, // Confidence percentage (0-100)
    generated_playbook: { type: String, default: null }, // Almacenamiento del Playbook (String para Markdown, evitar ValidationError por schema array mixto)
    last_analyzed_at: { type: Date, default: null },
  },
  vision_analysis: {
    type: Object,
    default: null,
  },
  spider_verdict: {
    is_disqualified: { type: Boolean, default: false },
    reason: { type: String, enum: ['DISCARD_PERFECT', 'DISCARD_NO_WEB', 'NONE'], default: 'NONE' },
    message: { type: String, default: null },
  },
  spider_context_vector: {
    type: [Number],
    default: null,
    select: false, // Exclude from default queries (1536 floats is heavy)
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Lead", LeadSchema);
