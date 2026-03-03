import express from 'express';
const router = express.Router();
import SearchController from '../controllers/SearchController.js';
import ExportController from '../controllers/ExportController.js';
import AIController from '../controllers/AIController.js';
import VortexController from '../controllers/VortexController.js';
import SettingsController from '../controllers/SettingsController.js';
import ChatController from '../controllers/ChatController.js';
import ManualLeadController from '../controllers/ManualLeadController.js';
import DataIntelligenceController from '../controllers/DataIntelligenceController.js';

// Search Routes
router.use((req, res, next) => {
    console.log(`[Router] ${req.method} ${req.originalUrl}`);
    next();
});

router.get('/stats', SearchController.getGlobalStats);
router.post('/search', SearchController.startSearch);
router.delete('/history/:id', SearchController.deleteSearch);
router.get('/history/:id', SearchController.getHistoryById);
router.get('/history', SearchController.getHistory);
router.get('/history/:searchId/leads', SearchController.getLeadsBySearch);
router.get('/leads/:id', SearchController.getLeadById);
router.patch('/leads/:id/status', SearchController.updateLeadStatus);
router.delete('/leads', SearchController.bulkDeleteLeads);
router.post('/leads/manual', ManualLeadController.createManualLead);

// Data Intelligence Routes
router.get('/intelligence/usage', DataIntelligenceController.getUsage);
router.get('/intelligence/alerts', DataIntelligenceController.getAlerts);
router.get('/intelligence/config', DataIntelligenceController.getConfig);
router.put('/intelligence/config', DataIntelligenceController.updateConfig);
router.post('/intelligence/sync-stats', DataIntelligenceController.syncRetroactiveStats);

// Vortex Intelligence Engine (On-Demand)
router.post('/vortex/enrich/:leadId', VortexController.enrichLead);
router.get('/vortex/status/:leadId', VortexController.getLeadStatus);

// AI Routes
router.post('/ai/chat', AIController.chat);
router.get('/ai/spider-analysis/:leadId', AIController.spiderAnalysis);

// Chat Sessions Routes
router.get('/chat/sessions', ChatController.getSessions);
router.get('/chat/sessions/:id', ChatController.getSession);
router.patch('/chat/sessions/:id', ChatController.renameSession);
router.delete('/chat/sessions/:id', ChatController.deleteSession);

// Export Routes
router.get('/export/:searchId/json', ExportController.exportJson);
router.get('/export/:searchId/csv', ExportController.exportCsv);
router.get('/export/:searchId/excel', ExportController.exportExcel);

// Settings Routes
router.get('/settings/agency-context', SettingsController.getAgencyContext);
router.post('/settings/agency-context', SettingsController.updateAgencyContext);

export default router;
