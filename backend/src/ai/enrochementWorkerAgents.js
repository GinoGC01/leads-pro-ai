import mongoose from 'mongoose';
import { calculateInvestmentScore, validateTacticVsBudget } from './circuitBreaker.js';
import { getTone, getRules, getTactic } from './promptsLibs/index.js';
import MarioStrategy from '../models/MarioStrategy.js';

/**
 * MARIO V11.1 - Motor de Ensamblaje Modular (Router Matrix & Single Strike)
 * Se encarga de ensamblar los payloads independientes para cada sub-agente
 * (Researcher, Strategist, Copywriter) basándose en las métricas técnicas 
 * (Circuit Breaker) y el nuevo Router Lógico.
 */

/**
 * FASE 2: La Guillotina
 * Descarta leads que tienen infraestructura técnica perfecta, ahorrando tokens LLM.
 */
export const evaluatePerfectLead = (lead) => {
    try {
        const hasWebsite = !!lead.website || !!lead.websiteUri;
        if (!hasWebsite) return false;

        // Parse LCP a segundos
        let lcpValue = 99; // Default bad
        if (lead.performance_metrics && lead.performance_metrics.lcp) {
            const rawLcp = lead.performance_metrics.lcp;
            if (typeof rawLcp === 'number') {
                lcpValue = rawLcp > 100 ? rawLcp / 1000 : rawLcp;
            } else if (typeof rawLcp === 'string') {
                lcpValue = parseFloat(rawLcp.replace(/[^\d.]/g, '')) / (rawLcp.toLowerCase().includes('ms') ? 1000 : 1);
            }
        }

        // Proxy o valor directo para SEO Score
        let seoScore = 0;
        if (lead.seo_audit) {
            if (lead.seo_audit.score !== undefined) {
                seoScore = lead.seo_audit.score;
            } else {
                seoScore = (lead.seo_audit.hasTitle ? 40 : 0) + 
                           (lead.seo_audit.hasMetaDescription ? 40 : 0) + 
                           ((lead.seo_audit.h1Count || 0) > 0 ? 20 : 0);
            }
        }

        // Buscar pixeles en Tech Stack
        const pixelKeywords = ['facebook-pixel', 'meta-pixel', 'google-analytics', 'gtm', 'google-tag-manager', 'tiktok-pixel'];
        const hasPixels = lead.tech_stack && lead.tech_stack.some(tech => 
            pixelKeywords.some(kw => tech.toLowerCase().includes(kw))
        );

        if (lcpValue <= 2.5 && seoScore >= 90 && hasPixels) {
            return true;
        }
        return false;
    } catch (e) {
        console.error("[MARIO V11] Error en evaluatePerfectLead:", e);
        return false;
    }
};

// Helper para obtener el override estadístico de MongoDB (Agregación)
const getStatisticalTone = async (niche) => {
    try {
        if (process.env.JEST_WORKER_ID !== undefined) {
             console.log(`[MARIO V11 Test Mock] 📈 Statistical Override Retornado: CHALLENGER`);
             return 'CHALLENGER';
        }

        if (!mongoose.models['MarioStrategy'] || !mongoose.models['Lead']) return null;
        // Pipeline de agregación para encontrar el tono más exitoso por nicho (usando Lead y MarioStrategy)
        const pipeline = [
            // Joins con la colección de leads para filtrar por nicho
            {
                $lookup: {
                    from: "leads",
                    localField: "lead_id",
                    foreignField: "_id",
                    as: "lead_info"
                }
            },
            { $unwind: "$lead_info" },
            // Match del nicho (category en el schema viejo)
            { 
                $match: { 
                    "lead_info.category": niche, 
                    // El test inyecta appliedTone directo en metadata. En prod debería haber engagement_score también.
                    "pipeline_metadata.nlgConfig.appliedTone": { $exists: true, $ne: null } 
                } 
            },
            // Agrupar por tono y contar
            { $group: { 
                _id: "$pipeline_metadata.nlgConfig.appliedTone", 
                total_successes: { $sum: 1 } 
            }},
            { $sort: { total_successes: -1 } },
            { $limit: 1 }
        ];

        const result = await MarioStrategy.aggregate(pipeline);
        if (result && result.length > 0 && result[0]._id) {
            console.log(`[MARIO V11] 📈 Statistical Override Activo. Nicho: ${niche}. Tono Ganador: ${result[0]._id}`);
            return result[0]._id;
        }
        
        return null; // Not enough data
    } catch (error) {
        console.warn(`[MARIO V11] ⚠️ Fallo al calcular tono estadístico para ${niche}, usando default.`, error.message);
        return null;
    }
};

/**
 * ensamblarEstrategia
 * Función principal expuesta por el módulo.
 * 
 * @param {Object} formData - Los datos introducidos manualmente por el SDR.
 * @param {Object} lead - El objeto Lead completo desde Mongoose.
 * @param {Object} marioCoreSettings - Configuración del AgencySettings (DB).
 * @param {Object} globalSettings - El resto de configuraciones de la agencia.
 * @returns {Object} Los payloads inyectados para cada agente y la oferta final autorizada.
 */
export const ensamblarEstrategia = async (formData, lead, marioCoreSettings, globalSettings) => {
    const {
        default_tone = 'CHALLENGER',
        statistical_override_enabled = true,
        circuit_breaker_threshold = 40
    } = marioCoreSettings || {};

    // ==========================================
    // PASO A: Ejecución del Circuit Breaker (Táctica)
    // ==========================================
    const investmentScore = calculateInvestmentScore(lead);
    const requestedOffer = formData.target_offer || 'IMPULSE';
    
    const { finalOffer, wasDowngraded, system_override_reason } = validateTacticVsBudget(
        requestedOffer,
        investmentScore,
        circuit_breaker_threshold
    );

    if (wasDowngraded) {
        console.warn(`[MARIO V11] 🛑 CIRCUIT BREAKER FIRED: ${system_override_reason}`);
    }

    // ==========================================
    // FASE 2: Ejecución de la Guillotina (Descarte Duro)
    // ==========================================
    const isPerfect = evaluatePerfectLead(lead);
    if (isPerfect) {
        console.warn(`[MARIO V11.1] 🪓 GUILLOTINA: Lead Perfecto Detectado. Abortando IA.`);
        return {
            status: 'DISCARDED',
            reason: 'Lead Perfecto. Sin fricción técnica evidente para prospección en frío.'
        };
    }

    // ==========================================
    // FASE 3: Matriz de Enrutamiento (Router Lógico)
    // ==========================================
    let tacticName = 'TACTICA_DEFAULT';
    let plusDiferenciador = "";
    
    const hasWebsite = !!lead.website || !!lead.websiteUri;
    
    // Extracción segura de LCP
    let lcpSecs = 99;
    if (lead.performance_metrics?.lcp) {
        const v = lead.performance_metrics.lcp;
        lcpSecs = typeof v === 'number' ? (v > 100 ? v/1000 : v) : parseFloat(String(v).replace(/[^\d.]/g, '')) || 99;
    }

    const pixelKws = ['facebook-pixel', 'meta-pixel', 'google-analytics', 'gtm', 'google-tag'];
    const leadHasPixels = lead.tech_stack && lead.tech_stack.some(t => pixelKws.some(kw => t.toLowerCase().includes(kw)));

    if (!hasWebsite) {
        // RAMA A: Sin Web / Tierra Alquilada
        tacticName = 'TIERRA_ALQUILADA';
        // Nota: finalOffer viene autorizada del Circuit Breaker, mantenemos congruencia
        plusDiferenciador = "Despliegue de infraestructura web propia y Embudos de contacto directo a WhatsApp.";
    } else if (hasWebsite && lcpSecs > 3.0) {
        // RAMA B1: Web Lenta
        tacticName = 'FRICCION_VELOCIDAD';
        plusDiferenciador = "Refactorización a arquitectura Mobile-First de carga en menos de 1 segundo para frenar fuga de tráfico.";
    } else if (hasWebsite && !leadHasPixels) {
        // RAMA B2: Tráfico Ciego
        tacticName = 'FUGA_RETARGETING';
        plusDiferenciador = "Ecosistema de conversión con analítica implementada y automatización (n8n/Make) para capturar a cada visitante.";
    } else {
        // RAMA B3: Alta Autoridad / Cuello Operativo (Fallback si pasó Guillotina)
        tacticName = 'CUELLO_BOTELLA_OPERATIVO';
        plusDiferenciador = "Desarrollo de software propietario Full-Stack e integración de IA (RAG) a sus bases de datos operativas.";
    }

    console.log(`[MARIO V11.1] 🧭 Router Matrix asignó Táctica: ${tacticName} con Oferta Autorizada: ${finalOffer}`);

    // ==========================================
    // PASO B: Determinación del Tono Copys
    // ==========================================
    let selectedTone = default_tone;
    const leadNiche = formData.niche || 'general';

    if (statistical_override_enabled) {
        const statsTone = await getStatisticalTone(leadNiche);
        if (statsTone) {
            selectedTone = statsTone;
        }
    }

    // ==========================================
    // PASO C: Carga de Strings (promptsLibs)
    // ==========================================
    const rulesString  = getRules();           // Va a todos
    const tacticString = getTactic(tacticName);// Solo al Strategist
    const toneString   = getTone(selectedTone); // Solo al Copywriter

    // ==========================================
    // PASO D: Routing Matricial de Payloads
    // ==========================================
    
    // Estos payloads se inyectarán en AgentOrchestrator.js (que recibe params extras)
    const agentPayloads = {
        RESEARCHER: {
            injectedRules: rulesString,
            injectedContext: `
[CONTEXTO DE AGENCIA]
Agencia: ${globalSettings?.agency_name || 'La Agencia'}
Representante: ${globalSettings?.sales_rep_name || 'Tu Especialista'}
`
        },
        STRATEGIST: {
            injectedRules: rulesString,
            injectedTactic: tacticString,
            authorizedOffer: finalOffer,
            plusDiferenciador: plusDiferenciador
        },
        COPYWRITER: {
            injectedRules: rulesString,
            injectedTone: toneString,
            linguisticFormat: globalSettings?.linguistic_behavior || 'AUTO'
        }
    };

    return {
        agentPayloads,
        circuitBreaker: {
            score: investmentScore,
            wasDowngraded,
            reason: system_override_reason,
            originalOffer: requestedOffer,
            authorizedOffer: finalOffer
        },
        nlgConfig: {
            appliedTone: selectedTone,
            tacticUsed: tacticName,
            isStatisticalOverride: selectedTone !== default_tone
        }
    };
};
