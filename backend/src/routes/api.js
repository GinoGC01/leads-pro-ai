const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/SearchController');
const ExportController = require('../controllers/ExportController');

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
router.patch('/leads/:id/status', SearchController.updateLeadStatus);

// Export Routes
router.get('/export/:searchId/json', ExportController.exportJson);
router.get('/export/:searchId/csv', ExportController.exportCsv);
router.get('/export/:searchId/excel', ExportController.exportExcel);

module.exports = router;
