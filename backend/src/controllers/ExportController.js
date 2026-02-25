const Lead = require('../models/Lead');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');

/**
 * Controller for Exporting data
 */
class ExportController {
    /**
     * Export leads as JSON
     */
    static async exportJson(req, res) {
        try {
            const leads = await Lead.find({ searchId: req.params.searchId });
            res.status(200).json(leads);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Export leads as CSV
     */
    static async exportCsv(req, res) {
        try {
            const leads = await Lead.find({ searchId: req.params.searchId }).lean();
            const fields = ['name', 'address', 'phoneNumber', 'website', 'email', 'rating', 'userRatingsTotal', 'googleMapsUrl', 'leadOpportunityScore', 'opportunityLevel'];
            const opts = { fields };
            const parser = new Parser(opts);
            const csv = parser.parse(leads);

            res.header('Content-Type', 'text/csv');
            res.attachment(`leads-${req.params.searchId}.csv`);
            return res.send(csv);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Export leads as Excel
     */
    static async exportExcel(req, res) {
        try {
            const leads = await Lead.find({ searchId: req.params.searchId }).lean();

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Leads');

            worksheet.columns = [
                { header: 'Nombre', key: 'name', width: 30 },
                { header: 'Dirección', key: 'address', width: 50 },
                { header: 'Teléfono', key: 'phoneNumber', width: 20 },
                { header: 'Sitio Web', key: 'website', width: 30 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Rating', key: 'rating', width: 10 },
                { header: 'Reseñas', key: 'userRatingsTotal', width: 10 },
                { header: 'Maps URL', key: 'googleMapsUrl', width: 40 },
                { header: 'Score', key: 'leadOpportunityScore', width: 10 },
                { header: 'Oportunidad', key: 'opportunityLevel', width: 15 }
            ];

            leads.forEach(lead => {
                worksheet.addRow(lead);
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=leads-${req.params.searchId}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = ExportController;
