import Settings from "../models/Settings.js";
import fs from "fs";
import path from "path";
import ragConfig from "../config/rag.config.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SettingsController {
  static async getAgencySettings(req, res) {
    try {
      let settings = await Settings.findOne({ isSingleton: true });
      if (!settings) {
        return res.status(200).json({
          success: true,
          sales_rep_name: "",
          agency_name: "",
          linguistic_behavior: "AUTO",
          value_proposition: "",
          core_services: [],
          rag_predefined_tags: ['abogados', 'clinicas', 'e-commerce', 'inmobiliarias', 'seguros', 'general'],
          mario_objection_mode: "STANDARD",
        });
      }

      res.status(200).json({
        success: true,
        sales_rep_name: settings.sales_rep_name,
        agency_name: settings.agency_name,
        linguistic_behavior: settings.linguistic_behavior,
        value_proposition: settings.value_proposition,
        core_services: settings.core_services || [],
        rag_predefined_tags: settings.rag_predefined_tags || [],
        mario_objection_mode: settings.mario_objection_mode || "STANDARD",
      });
    } catch (error) {
      console.error(
        "[SettingsController] Error fetching agency settings:",
        error,
      );
      res
        .status(500)
        .json({
          success: false,
          message: "Fallo al obtener la configuración de la agencia.",
        });
    }
  }

  static async updateAgencySettings(req, res) {
    try {
      const updateData = { ...req.body };
      delete updateData.isSingleton; // Safety: don't allow changing the singleton flag
      updateData.updatedAt = Date.now();

      const settings = await Settings.findOneAndUpdate(
        { isSingleton: true },
        { $set: updateData },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );

      // Removed physical file writing (Markdown is deleted)

      res.status(200).json({
        success: true,
        sales_rep_name: settings.sales_rep_name,
        agency_name: settings.agency_name,
        linguistic_behavior: settings.linguistic_behavior,
        core_services: settings.core_services,
        value_proposition: settings.value_proposition,
        rag_predefined_tags: settings.rag_predefined_tags || [],
        mario_objection_mode: settings.mario_objection_mode,
      });
    } catch (error) {
      console.error(
        "[SettingsController] Error updating agency settings:",
        error,
      );
      res
        .status(500)
        .json({
          success: false,
          message: "Fallo al actualizar la configuración de la agencia.",
        });
    }
  }
}

export default SettingsController;
