import { SPIDER_CODEX } from '../config/spider_codex.js';
import Lead from '../models/Lead.js';
import VectorStoreService from './VectorStoreService.js';
import AIService from './AIService.js';

const HIGH_COST_TECH = ['React', 'Next.js', 'Vue.js', 'Angular', 'AWS', 'Shopify Plus', 'Magento', 'Laravel'];
const LOW_COST_TECH = ['Wix', 'Weebly', 'Squarespace', 'WordPress', 'Blogger', 'Joomla'];

// Tecnologías que indican infraestructura de alto nivel inexpugnable (Fricción 100%)
const ENTERPRISE_FORTRESS_TECH = [
    'next.js', 'nuxt', 'gatsby', 'remix', 'astro', 'svelte',    // Frameworks modernos SSR/SSG
    'react', 'vue.js', 'angular',                                 // SPA Frameworks (si combinados con infra enterprise)
    'vercel', 'netlify', 'cloudflare pages',                      // Edge platforms
    'aws', 'google cloud', 'azure',                                // Cloud enterprise
    'docker', 'kubernetes',                                        // Containerización
    'graphql', 'strapi', 'contentful', 'sanity',                  // Headless CMS enterprise
    'shopify plus', 'magento enterprise'                           // E-commerce enterprise
];

export const RENTED_LAND_DOMAINS = [
    'agendapro.com', 'linktr.ee', 'instagram.com', 'facebook.com',
    'wa.me', 'calendly.com', 'sites.google.com', 'wixsite.com',
    'wordpress.com', 'canva.site', 'beacons.ai', 'fresha.com', 'booksy.com', 'tiktok.com'
];

class SpiderEngine {
    /**
     * FASE 0: Viability Gate (Disqualification Shield)
     * Evalúa si el lead posee infraestructura de alto nivel que lo hace comercialmente inexpugnable.
     * Se ejecuta ANTES de vectorización para ahorrar tokens de OpenAI y tiempo de Deep Vision.
     * 
     * @param {Object} leadData - Objeto con { tech_stack: string[], performance_metrics: { performanceScore, ttfb } }
     * @returns {{ is_disqualified: boolean, reason: string, message: string }}
     */
    static evaluateViability(leadData) {
        const techStack = leadData.tech_stack || [];
        const perfMetrics = leadData.performance_metrics || {};

        // --- REGLA 1: Detección de Stack Fortaleza ---
        // Contamos cuántas tecnologías "enterprise" posee el stack
        const fortressMatches = techStack.filter(tech =>
            ENTERPRISE_FORTRESS_TECH.some(fort => tech.toLowerCase().includes(fort))
        );

        // Si tiene 2+ tecnologías enterprise (ej. React + Vercel, Next.js + AWS), 
        // es infraestructura deliberada, no accidental
        const hasEnterpriseFortress = fortressMatches.length >= 2;

        // --- REGLA 2: Rendimiento Excepcional ---
        // Si Lighthouse Score > 85 Y TTFB < 400ms, están optimizados profesionalmente
        const hasExceptionalPerformance = (
            perfMetrics.performanceScore > 85 && 
            perfMetrics.ttfb && perfMetrics.ttfb < 400
        );

        // --- VEREDICTO: DISCARD_PERFECT ---
        // Ambas condiciones o solo la fortaleza con 3+ matches (inequívoco)
        if ((hasEnterpriseFortress && hasExceptionalPerformance) || fortressMatches.length >= 3) {
            return {
                is_disqualified: true,
                reason: 'DISCARD_PERFECT',
                message: `Infraestructura inexpugnable detectada. Stack: [${fortressMatches.join(', ')}]. ` +
                    `Performance Score: ${perfMetrics.performanceScore || 'N/A'}, TTFB: ${perfMetrics.ttfb || 'N/A'}ms. ` +
                    `Fricción comercial 100%. El prospecto no necesita nuestros servicios.`
            };
        }

        // No descalificado — continuar pipeline
        return {
            is_disqualified: false,
            reason: 'NONE',
            message: null
        };
    }

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
        // 0. GLOBALIZE REPUTATION CONTEXT SO MARIO NEVER HALLUCINATES
        const rating = lead.rating || 0;
        const reviews = lead.userRatingsTotal || 0;
        let reputation_context = "";

        if (reviews === 0) {
            reputation_context = "Invisibilidad digital absoluta. Cero reseñas en Google Maps.";
        } else if (rating >= 4.5) {
            reputation_context = `Excelente reputación validada en Google Maps.`;
        } else if (rating >= 4.0) {
            reputation_context = `Buena reputación en Google Maps, pero estándar/mejorable.`;
        } else {
            reputation_context = `MALA REPUTACIÓN O CRISIS DE CONFIANZA en Google Maps.`;
        }

        // 1. CORTAFUEGOS DE EXISTENCIA WEB
        const hasWebsite = !!(lead.website || lead.websiteUri);

        if (!hasWebsite) {


            let reputationContext = "";
            let intentString = "";

            if (reviews === 0) {
                reputationContext = "Invisibilidad digital y cero validación social en Google Maps.";
                intentString = "Ruptura de patrón: 'Vi que no tienen página web ni suficientes reseñas en Google para generar confianza. La competencia se está llevando a los clientes que buscan su servicio'.";
            } else if (rating >= 4.5) {
                reputationContext = "Atrapados por falta de ecosistema, a pesar de tener excelente validación social.";
                intentString = `Ruptura de patrón: 'Vi que tienen excelentes calificaciones en Google Maps pero al no tener página web, están perdiendo a los clientes premium que buscan más validación'.`;
            } else if (rating >= 4.0) {
                reputationContext = "Validación social buena pero estándar. Sin web pierden autoridad frente al top 1%.";
                intentString = `Ruptura de patrón: 'Vi que tienen buenas referencias en Google Maps, pero al no tener página web profesional, se están quedando atrás y perdiendo clientes premium ante la competencia'.`;
            } else {
                reputationContext = "Crisis de confianza: Mala reputación en Maps combinada con inexistencia de página web que los defienda.";
                intentString = `Ruptura de patrón: 'Asumo que están sintiendo la baja de volumen. Teniendo una baja puntuación en Maps y sin una página web profesional que eleve su autoridad, están regalando los clientes a la competencia'.`;
            }

            return {
                status: "GO",
                isRentable: true,
                tier: 2,
                pain: reputationContext,
                service: "Creación de Identidad Digital (Web + SEO Local)",
                tactic_name: "NO_WEB_FOMO",
                cadence: [
                    { step: 1, channel: "WhatsApp", intent: intentString },
                    { step: 2, channel: "Email", intent: "Mockup de cómo luciría su web frente a su competencia directa." },
                    { step: 3, channel: "WhatsApp", intent: "Takeaway/Breakup: 'Asumo que están a reventar de clientes en el local y no necesitan presencia digital'." }
                ],
                technical_flaw: "No poseen dominio web ni infraestructura detectable.",
                friction_score: "N/A",
                friction_angle: "No tienen web. Cero costo hundido. Es un lienzo en blanco.",
                historical_confidence: 90,
                has_website_flag: false,
                reputation_context: reputation_context
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
                is_rented_land_flag: true, // CRÍTICO PARA MARIO
                reputation_context: reputation_context
            };
        }

        // 2. Identify Niche by 'types' or 'category'
        let matchedTier = 2; // Default to Tier 2 (Volume Local) if unknown
        // Safely pick a generic Tier 2 as fallback if explicit niche doesn't exist
        let codexMatch = SPIDER_CODEX.negocio_local_generico || Object.values(SPIDER_CODEX)[0];

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
            technical_flaw = `La web no carga o está caída. Los clientes que buscan su negocio en Google ven un error.`;
        } else {
            let flaws = [];

            if (performance_metrics?.lcp > 3000) {
                flaws.push("la web tarda demasiado en abrir desde el celular");
            } else if (performance_metrics?.performanceScore < 50) {
                flaws.push("la web funciona muy mal en celulares");
            }

            if (seo_audit) {
                if (!seo_audit.title) {
                    flaws.push("la web no tiene identificación para Google (es como un local sin cartel en la calle)");
                }
                if (seo_audit.h1_tags && seo_audit.h1_tags.length === 0) {
                    flaws.push("Google no puede leer bien la web y no la muestra a los clientes que buscan su servicio");
                }
            }

            // Implement Hierarchy & Natural Aggregation
            if (flaws.length === 1) {
                technical_flaw = flaws[0];
            } else if (flaws.length > 1) {
                // Take the most severe flaw (the first one pushed) and aggregate the rest naturally
                technical_flaw = `${flaws[0]}, y otros puntos débiles más`;
            }
        }

        if (!lead.website) {
            technical_flaw = "Invisibilidad Total: No poseen dominio web. Operan de forma precaria.";
        }

        // 4. ML Heuristics (Historical Confidence)
        // Check win rate of the theoretical tactic
        const theoreticalTactic = codexMatch.estrategia_spider?.tactic_name || "Secuestro de Tráfico Local (Local Hijack)";

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
        let activeService = codexMatch.estrategia_spider?.recommended_service || "Posicionamiento Dominante en Maps + Generación de Leads";
        let activeCadence = codexMatch.cadence_structure;

        if (totalSamples > 0) {
            winRate = Math.round((won / totalSamples) * 100);

            // Mutación de Táctica (Machine Learning Heurístico)
            if (totalSamples >= 5 && winRate < 15) {
                activeService = codexMatch.estrategia_spider?.contingency_service || 'Auditoría Básica de Presencia Online';
                activeCadence = codexMatch.contingency_cadence || codexMatch.cadence_structure;
            }
        }

        // 5. Friction Scoring
        const techStack = lead.tech_stack || [];
        const frictionData = SpiderEngine.calculateFriction(lead.tech_stack);

        // Safe destructuring of strategy context
        const strategyObj = codexMatch.estrategia_spider || {};
        const safeWinRateExpected = (codexMatch.rendimiento_historico && codexMatch.rendimiento_historico.win_rate_esperado)
            ? codexMatch.rendimiento_historico.win_rate_esperado
            : 50;

        const finalTacticName = codexMatch.nombre || strategyObj.tactic_name || 'Estrategia Genérica';
        const finalCadence = codexMatch.cadencia_sugerida || codexMatch.cadence_structure || [];
        const finalConfidence = winRate > 0 ? winRate : safeWinRateExpected;

        // --- HARD OVERRIDE FOR PERFORMANCE FLAWS ---
        // If technical flaw mentions LCP/TTFB, we MUST rewrite the step 1 intent 
        // to prevent MARIO from hallucinating the generic "error visual en tu ficha"
        let overriddenCadence = JSON.parse(JSON.stringify(finalCadence)); // Deep copy to avoid mutating the codex

        if (technical_flaw.includes('tarda demasiado') || technical_flaw.includes('funciona muy mal')) {
            if (Array.isArray(overriddenCadence) && overriddenCadence.length > 0) {
                const aggregationSuffix = technical_flaw.includes('y otros puntos débiles más') ? ', y otros puntos débiles más' : '';
                overriddenCadence[0].intent_psicologico = `Ataque al pain point: '[Nombre], un competidor directo en tu código postal sin tu calidad de servicio está capturando a los clientes premium que buscan en Google Maps porque tu página web tarda una infinidad en cargar desde el celular${aggregationSuffix}. El cliente se frustra, cierra tu web y llama al consultorio de tu competencia que carga más rápido.'`;
            }
        } else {
            // If it's a generic flaw (e.g. SEO) but has multiple issues, append the suffix to the default codex intent
            if (technical_flaw.includes('y otros puntos débiles más') && Array.isArray(overriddenCadence) && overriddenCadence.length > 0) {
                // Append it right before the final period or at the end of the sentence
                if (overriddenCadence[0].intent_psicologico.endsWith(".'\"") || overriddenCadence[0].intent_psicologico.endsWith(".'")) {
                    overriddenCadence[0].intent_psicologico = overriddenCadence[0].intent_psicologico.replace(/\.'"?$/, ", y otros puntos débiles más.'\"");
                } else {
                    overriddenCadence[0].intent_psicologico += ", y otros puntos débiles más";
                }
            }
        }

        // 6. Return pure JSON Veridict
        return {
            status: "GO",
            isRentable: true,
            tier: matchedTier,
            pain: codexMatch.psicologia_de_venta.pain_point_real,
            service: codexMatch.psicologia_de_venta.solucion_agencia,
            tactic_name: finalTacticName,
            cadence: overriddenCadence,
            technical_flaw,
            friction_score: frictionData.score,
            friction_angle: frictionData.angle,
            historical_confidence: finalConfidence,
            has_website_flag: true,
            is_rented_land_flag: false,
            reputation_context: reputation_context
        };
    }

    /**
     * SPIDER V2: Generate semantic context string for embedding.
     * Captures the commercial DNA of a lead for vector similarity search.
     * 
     * @param {Object} lead - MongoDB Lead document
     * @returns {string} Natural language context for embedding
     */
    static generateLeadContext(lead) {
        const techStack = lead.tech_stack?.length > 0 ? lead.tech_stack.join(', ') : 'Desconocido';
        const perfScore = lead.performance_metrics?.performanceScore || 'N/A';
        const ttfb = lead.performance_metrics?.ttfb || 'N/A';
        const friction = lead.spider_memory?.friction_score || 'UNKNOWN';
        const hasWeb = !!lead.website;
        const rating = lead.rating || 0;
        const reviews = lead.userRatingsTotal || 0;
        const category = lead.category || 'General';
        const visionScore = lead.vision_analysis?.ux_score || 'N/A';

        return [
            `Nicho: ${category}.`,
            `Tech Stack: ${techStack}.`,
            `Performance Score: ${perfScore}. TTFB: ${ttfb}ms.`,
            `Fricción Tecnológica: ${friction}.`,
            `Tiene Web: ${hasWeb ? 'Sí' : 'No'}.`,
            `Rating Google: ${rating} (${reviews} reseñas).`,
            `UX Score (Vision): ${visionScore}.`
        ].join(' ');
    }

    /**
     * SPIDER V2: Predict the best commercial tactic using Qdrant vector memory.
     * Pipeline: Generate context → Embed → Search Qdrant (WON filter) → Pick winner → Fallback heuristic.
     * 
     * ARCHITECTURE: READ-ONLY Qdrant access. No upsert here.
     * The embedding is saved to MongoDB (spider_context_vector) for deferred ingestion via markLeadAsWon.
     * 
     * @param {Object} lead - MongoDB Lead document (must have tech_stack, performance_metrics populated)
     * @returns {{ predicted_tactic: string, confidence: number, source: string, embedding: number[] }}
     */
    static async predictTactic(lead) {
        try {
            // 1. Generate semantic context and embedding
            const context = SpiderEngine.generateLeadContext(lead);
            const embedding = await AIService.generateEmbedding(context);

            // 2. Search Qdrant for similar WON leads (READ-ONLY)
            const filter = {
                must: [
                    { key: 'status', match: { value: 'WON' } }
                ]
            };

            const similarLeads = await VectorStoreService.searchSimilarLeads(embedding, filter, 5);

            if (similarLeads.length > 0) {
                // 3. Frequency analysis — pick the most common winning tactic
                const tacticCounts = {};
                similarLeads.forEach(result => {
                    const tactic = result.payload?.tactic || 'UNKNOWN';
                    tacticCounts[tactic] = (tacticCounts[tactic] || 0) + 1;
                });

                const bestTactic = Object.entries(tacticCounts)
                    .sort((a, b) => b[1] - a[1])[0];

                const avgScore = similarLeads.reduce((sum, r) => sum + (r.score || 0), 0) / similarLeads.length;

                console.log(`[SPIDER V2] 🎯 Predicted tactic from ${similarLeads.length} WON leads: "${bestTactic[0]}" (freq: ${bestTactic[1]}, avg similarity: ${(avgScore * 100).toFixed(1)}%)`);

                return {
                    predicted_tactic: bestTactic[0],
                    confidence: Math.round(avgScore * 100),
                    source: 'QDRANT_VECTOR',
                    embedding
                };
            }

            // 4. Fallback — no WON data in Qdrant, use heuristic
            console.log(`[SPIDER V2] ⚙️ No vector matches found. Using heuristic fallback.`);
            const heuristicResult = await SpiderEngine.analyzeLead(lead);

            return {
                predicted_tactic: heuristicResult.tactic_name || 'Estrategia Genérica',
                confidence: heuristicResult.historical_confidence || 50,
                source: 'HEURISTIC_FALLBACK',
                embedding
            };
        } catch (err) {
            console.error(`[SPIDER V2] ⚠️ predictTactic failed (using heuristic): ${err.message}`);
            
            // Total fallback — even embedding generation failed
            try {
                const heuristicResult = await SpiderEngine.analyzeLead(lead);
                return {
                    predicted_tactic: heuristicResult.tactic_name || 'Estrategia Genérica',
                    confidence: heuristicResult.historical_confidence || 50,
                    source: 'HEURISTIC_EMERGENCY',
                    embedding: null
                };
            } catch (innerErr) {
                return {
                    predicted_tactic: 'Estrategia Genérica',
                    confidence: 0,
                    source: 'TOTAL_FALLBACK',
                    embedding: null
                };
            }
        }
    }
}

export default SpiderEngine;
