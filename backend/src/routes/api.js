import express from "express";
const router = express.Router();

// --- Domain Route Modules ---
import searchRoutes from "./search.routes.js";

// --- Legacy Controllers (pending future domain extraction) ---
import ExportController from "../controllers/ExportController.js";
import AIController from "../controllers/AIController.js";
import VortexController from "../controllers/VortexController.js";
import SettingsController from "../controllers/SettingsController.js";
import ChatController from "../controllers/ChatController.js";
import ManualLeadController from "../controllers/ManualLeadController.js";
import DataIntelligenceController from "../controllers/DataIntelligenceController.js";
import KnowledgeController from "../controllers/KnowledgeController.js";

// Global request logger
router.use((req, res, next) => {
  console.log(`[Router] ${req.method} ${req.originalUrl}`);
  next();
});

// =====================================================
// SEARCH DOMAIN (Refactored to 3-Tier Modular Monolith)
// =====================================================
router.use("/", searchRoutes);

// Manual Lead Creation (will move to leads.routes.js in Iteration 2)
router.post("/leads/manual", ManualLeadController.createManualLead);

// =====================================================
// LEGACY DOMAINS (Pending future iterations)
// =====================================================

// Data Intelligence Routes
router.get("/intelligence/usage", DataIntelligenceController.getUsage);
router.get("/intelligence/alerts", DataIntelligenceController.getAlerts);
router.get("/intelligence/config", DataIntelligenceController.getConfig);
router.put("/intelligence/config", DataIntelligenceController.updateConfig);
router.post(
  "/intelligence/sync-stats",
  DataIntelligenceController.syncRetroactiveStats,
);

// Vortex Intelligence Engine (On-Demand)
router.post("/vortex/enrich/:leadId", VortexController.enrichLead);
router.get("/vortex/status/:leadId", VortexController.getLeadStatus);
router.post("/vortex/deep-vision/:id", VortexController.triggerDeepVision);
router.post("/vortex/reset/:id", VortexController.resetAndRescan);
router.get("/vortex/stream/:jobId", VortexController.streamProgress);

// AI Routes
router.post("/ai/chat", AIController.chat);
router.get("/ai/spider-analysis/:leadId", AIController.spiderAnalysis);
router.post("/ai/mario/regenerate/:leadId", AIController.regenerateStrategy);
router.patch("/ai/mario/feedback/:strategyId", AIController.scoreStrategy);
router.get("/ai/pipeline-status/:leadId", AIController.pipelineStatus);

// Chat Sessions Routes
router.get("/chat/sessions", ChatController.getSessions);
router.get("/chat/sessions/:id", ChatController.getSession);
router.patch("/chat/sessions/:id", ChatController.renameSession);
router.delete("/chat/sessions/:id", ChatController.deleteSession);

// Export Routes
router.get("/export/:searchId/json", ExportController.exportJson);
router.get("/export/:searchId/csv", ExportController.exportCsv);
router.get("/export/:searchId/excel", ExportController.exportExcel);

// Settings Routes
router.get("/settings/agency", SettingsController.getAgencySettings);
router.put("/settings/agency", SettingsController.updateAgencySettings);

// Knowledge Ingestion Routes (Dynamic RAG)
router.post(
  "/knowledge/upload",
  KnowledgeController.uploadMiddleware,
  KnowledgeController.uploadDocument,
);
router.get("/knowledge/documents", KnowledgeController.listDocuments);
router.delete("/knowledge/documents/:id", KnowledgeController.deleteDocument);
router.delete("/knowledge/flush", KnowledgeController.flushDocuments);

export default router;
