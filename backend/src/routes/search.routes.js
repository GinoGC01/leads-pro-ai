import express from 'express';
import SearchController from '../controllers/SearchController.js';

const router = express.Router();

/**
 * Search Domain Routes
 * 
 * 3-Tier: Route → SearchController → LeadSearchService
 * 
 * These routes handle campaign lifecycle:
 *   - Launching searches (standard + grid)
 *   - Viewing campaign history
 *   - Purging campaigns
 */

// --- Campaign Lifecycle ---
router.post('/search',         SearchController.startSearch);
router.get('/history',         SearchController.getHistory);
router.get('/history/:id',     SearchController.getHistoryById);
router.delete('/history/:id',  SearchController.deleteSearch);

// --- Legacy: Lead-domain routes still served by SearchController ---
// These will be moved to leads.routes.js in Iteration 2
router.get('/history/:searchId/leads',  SearchController.getLeadsBySearch);
router.get('/leads/:id',                SearchController.getLeadById);
router.patch('/leads/:id/status',       SearchController.updateLeadStatus);
router.delete('/leads',                 SearchController.bulkDeleteLeads);

// --- Legacy: Dashboard stats (will move to dashboard.routes.js) ---
router.get('/stats',  SearchController.getGlobalStats);

export default router;
