import express from 'express';
const router = express.Router();
import SearchController from '../controllers/SearchController.js';
import ExportController from '../controllers/ExportController.js';
import AIController from '../controllers/AIController.js';
import VortexController from '../controllers/VortexController.js';
import SettingsController from '../controllers/SettingsController.js';
import ChatController from '../controllers/ChatController.js';

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
