import { SPIDER_CODEX } from '../config/spider_codex.js';
import Lead from '../models/Lead.js';

const HIGH_COST_TECH = ['React', 'Next.js', 'Vue.js', 'Angular', 'AWS', 'Shopify Plus', 'Magento', 'Laravel'];
const LOW_COST_TECH = ['Wix', 'Weebly', 'Squarespace', 'WordPress', 'Blogger', 'Joomla'];
const RENTED_LAND_DOMAINS = [
    'agendapro.com', 'linktr.ee', 'instagram.com', 'facebook.com',
    'wa.me', 'calendly.com', 'sites.google.com', 'wixsite.com',
    'wordpress.com', 'canva.site', 'beacons.ai', 'fresha.com', 'booksy.com', 'tiktok.com'
];

class SpiderEngine {
    /**
     * FASE 1: Friction Scoring
     * Calcula el costo hundido tecnológico del prospecto.
     */
    static calculateFriction(techStackArray) {
        if (!techStackArray || !Array.isArray(techStackArray)) {
            return { score: 'LOW', angle: 'REEMPLAZO_TOTAL' };
        }

        const hasHighCost = techStackArray.some(tech =>
            HIGH_COST_TECH.some(highTech => tech.toLowerCase().includes(highTech.toLowerCase()))
        );

        if (hasHighCost) {
            return { score: 'HIGH', angle: 'REPARAR_FERRARI' };
        }

        return { score: 'LOW', angle: 'REEMPLAZO_TOTAL' };
    }

    /**
     * FASE 2: Deterministic + ML Heuristics
     */
    static async analyzeLead(lead) {
        // 1. CORTAFUEGOS DE EXISTENCIA WEB
        const hasWebsite = !!(lead.website || lead.websiteUri);

        if (!hasWebsite) {
            return {
                status: "GO",
                isRentable: true,
                tier: 2,
                pain: "Invisibilidad digital absoluta. La competencia se lleva todo por Google Maps.",
                service: "Creación de Identidad Digital (Web + SEO Local)",
                tactic_name: "NO_WEB_FOMO",
                cadence: [
                    { step: 1, channel: "WhatsApp", intent: "Ruptura de patrón: 'Vi tus excelentes reviews en Google pero no tienes página web para atrapar a los clientes que te buscan'." },
                    { step: 2, channel: "Email", intent: "Mockup de cómo luciría su web frente a su competencia directa." },
                    { step: 3, channel: "WhatsApp", intent: "Takeaway/Breakup: 'Asumo que estás a reventar de clientes en el local y no necesitas presencia digital'." }
                ],
                technical_flaw: "No poseen dominio web ni infraestructura detectable.",
                friction_score: "N/A",
                friction_angle: "No tienen web. Cero costo hundido. Es un lienzo en blanco.",
                historical_confidence: 90,
                has_website_flag: false
            };
        }

        // 2. CORTAFUEGOS "TIERRA ALQUILADA" (SaaS / Redes)
        const urlString = (lead.website || lead.websiteUri).toLowerCase();
        const isRentedLand = RENTED_LAND_DOMAINS.some(domain => urlString.includes(domain));

        if (isRentedLand) {
            return {
                status: "GO",
                isRentable: true,
                tier: 1, // Mantén la lógica de asignar el tier correcto o déjalo en 1 temporalmente para priorizar la migración
                pain: "Inestabilidad de marca. Construir un negocio sobre un dominio prestado (SaaS/Redes) destruye la autoridad frente a clientes premium y mata el SEO Local.",
                service: "Web Propia de Alta Autoridad + Migración de Sistema",
                tactic_name: "RENTED_LAND_AUTHORITY",
                cadence: [
                    { step: 1, channel: "WhatsApp", intent: "Ruptura de patrón: 'Mandar prospectos a un dominio genérico destruye tu autoridad frente a clientes High-Ticket'." }
                ],
                technical_flaw: "Tierra Alquilada: El negocio redirige su tráfico a un dominio de un tercero (SaaS/RRSS) que no controlan.",
                friction_score: "LOW", // No tienen inversión propia real
                friction_angle: "Están alquilando su presencia digital. Cero costo hundido en código propio.",
                historical_confidence: 85,
                has_website_flag: true,
                is_rented_land_flag: true // CRÍTICO PARA MARIO
            };
        }

        // 2. Identify Niche by 'types' or 'category'
        let matchedTier = 2; // Default to Tier 2 (Volume Local) if unknown
        let codexMatch = SPIDER_CODEX.volume_local;

        // Check types array from Google Places if available
        const leadTypes = lead.types || [];
        const leadCategory = (lead.category || '').toLowerCase();

        for (const [key, config] of Object.entries(SPIDER_CODEX)) {
            const isMatch = config.keywords.some(keyword =>
                leadTypes.includes(keyword) || leadCategory.includes(keyword)
            );

            if (isMatch) {
                matchedTier = config.tier;
                codexMatch = config;
                break;
            }
        }

        // 2. The Ruthless Filter (Tier 3 -> Discard)
        if (matchedTier === 3) {
            return {
                isRentable: false,
                reason: codexMatch.pain_point + " (Nicho de bajo margen. No hacemos redes. Descartar.)",
                status: "NO-GO",
                tier: 3
            };
        }

        // 3. Technical Cross-referencing
        let technical_flaw = "Ninguna falla crítica obvia.";

        const { performance_metrics, seo_audit, enrichmentStatus, enrichmentError } = lead;

        if (enrichmentStatus === 'failed') {
            technical_flaw = `Sitio web caído o bloqueado (Error: ${enrichmentError || 'Desconocido'}).`;
        } else if (performance_metrics) {
            if (performance_metrics.lcp > 3000) {
                technical_flaw = `Carga lenta (LCP > 3s).`;
            } else if (performance_metrics.performanceScore < 50) {
                technical_flaw = `Pésimo rendimiento general en móviles (Score: ${performance_metrics.performanceScore}).`;
            }
        }

        if (!lead.website) {
            technical_flaw = "Invisibilidad Total: No poseen dominio web. Operan de forma precaria.";
        }

        // 4. ML Heuristics (Historical Confidence)
        // Check win rate of the theoretical tactic
        const theoreticalTactic = codexMatch.tactic_name || "ESTRATEGIA_DEFAULT";

        const stats = await Lead.aggregate([
            {
                $match: {
                    "spider_memory.applied_tactic": theoreticalTactic,
                    status: { $in: ['Cerrado - Ganado', 'Cerrado - Perdido'] }
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        let won = 0;
        let lost = 0;
        stats.forEach(s => {
            if (s._id === 'Cerrado - Ganado') won = s.count;
            if (s._id === 'Cerrado - Perdido') lost = s.count;
        });

        const totalSamples = won + lost;
        let winRate = 0;
        let activeService = codexMatch.recommended_service;
        let activeCadence = codexMatch.cadence_structure;

        if (totalSamples > 0) {
            winRate = Math.round((won / totalSamples) * 100);

            // Mutación de Táctica (Machine Learning Heurístico)
            if (totalSamples >= 5 && winRate < 15) {
                activeService = codexMatch.contingency_service || 'Consultoría de Negocios';
                activeCadence = codexMatch.contingency_cadence || codexMatch.cadence_structure;
            }
        }

        // 5. Friction Scoring
        const techStack = lead.tech_stack || [];
        const friction = this.calculateFriction(techStack);

        // 6. Return pure JSON Veridict
        return {
            status: "GO",
            isRentable: true,
            tier: matchedTier,
            pain: codexMatch.pain_point,
            service: activeService,
            tactic_name: theoreticalTactic,
            cadence: activeCadence,
            technical_flaw: technical_flaw,
            friction_score: friction.score,
            friction_angle: friction.angle,
            historical_confidence: winRate
        };
    }
}

export default SpiderEngine;
