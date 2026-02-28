import Settings from '../models/Settings.js';
import fs from 'fs';
import path from 'path';
import ragConfig from '../config/rag.config.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SettingsController {
    /**
     * Get the singleton agency context settings
     */
    static async getAgencyContext(req, res) {
        try {
            let settings = await Settings.findOne({ isSingleton: true });
            if (!settings) {
                // Return fallback from the current markdown file if not instantiated in DB yet
                return res.status(200).json({
                    success: true,
                    context: ragConfig.agency.raw
                });
            }

            res.status(200).json({
                success: true,
                context: settings.agencyContext
            });
        } catch (error) {
            console.error('[SettingsController] Error fetching agency context:', error);
            res.status(500).json({ success: false, message: 'Fallo al obtener la configuración de la agencia.' });
        }
    }

    /**
     * Create or update the singleton agency context
     */
    static async updateAgencyContext(req, res) {
        try {
            const { context } = req.body;
            if (typeof context !== 'string') {
                return res.status(400).json({ success: false, message: 'El contexto debe ser un texto válido.' });
            }

            // Upsert the singleton record
            const settings = await Settings.findOneAndUpdate(
                { isSingleton: true },
                { agencyContext: context, updatedAt: Date.now() },
                { new: true, upsert: true }
            );

            // SYNC FACTORY: Physically overwrite the markdown file to feed the python/local scripts instantly
            const agencyPath = path.join(__dirname, '../config/AGENCY_CONTEXT.md');
            fs.writeFileSync(agencyPath, context, 'utf8');

            // Reload the cache in RAM for the dual-RAG Vortex algorithm without Server Restart
            ragConfig.reloadAgencyContext();

            res.status(200).json({
                success: true,
                context: settings.agencyContext
            });
        } catch (error) {
            console.error('[SettingsController] Error updating agency context:', error);
            res.status(500).json({ success: false, message: 'Fallo al actualizar la configuración de la agencia.' });
        }
    }
}

export default SettingsController;
