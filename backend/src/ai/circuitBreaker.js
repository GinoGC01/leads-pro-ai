/**
 * MARIO V11 - Motor Matemático y Circuit Breaker
 * Funciones puras para decidir el nivel de inversión y ofertas basadas empíricamente.
 */

/**
 * calculateInvestmentScore
 * Evalúa las capacidades técnicas y de tracking del lead basadas en datos de Mongoose.
 * @param {Object} lead - Datos del modelo Lead.
 * @returns {number} Score de 0 a 100 indicando madurez digital.
 */
export const calculateInvestmentScore = (lead) => {
    let score = 0;
    if (!lead) return score;

    // 1. Tiene sitio web (Fuerte indicador de infraestructura básica)
    // Escapa de TIERRA ALQUILADA (threshold 30) garantizando 35 puntos.
    if (lead.website && lead.website.trim().length > 4 && lead.website !== 'No detectado') {
        score += 35;
    }

    // 2. Tech Stack robusto detectado (Uso de CRMs, builders serios)
    if (lead.tech_stack && lead.tech_stack.length > 0) {
        score += 15;
        if (lead.tech_stack.length >= 3) score += 10; 
    }

    // 3. SEO o Análisis de UX 
    if (lead.vision_analysis && lead.vision_analysis.ux_score >= 7) {
        score += 15;
    } else if (lead.seo_audit && (lead.seo_audit.hasTitle || lead.seo_audit.hasMetaDescription)) {
        score += 10;
    }

    // 4. Tráfico o publicidad activa (Disposición a invertir)
    if (lead.is_advertising) {
        score += 20;
    }

    // 5. Reseñas o presencia local consolidada (Google Maps rating)
    if (lead.userRatingsTotal && lead.userRatingsTotal > 15) {
        score += 10;
    }

    return Math.min(score, 100); // Max 100
};

/**
 * validateTacticVsBudget
 * Determina si el nivel de oferta target propuesto puede ser asimilado por el lead.
 * @param {string} targetOffer - Oferta seleccionada (TITAN, AUTHORITY, IMPULSE).
 * @param {number} score - Score calculado de madurez digital (0-100).
 * @param {number} threshold - Umbral mínimo permitido configurado en Settings.
 * @returns {Object} { finalOffer, wasDowngraded, system_override_reason }
 */
export const validateTacticVsBudget = (targetOffer, score, threshold) => {
    targetOffer = targetOffer?.toUpperCase() || 'IMPULSE';
    
    // Solo auditamos ofertas High-Ticket (TITAN, AUTHORITY)
    if (['TITAN', 'AUTHORITY'].includes(targetOffer)) {
        if (score < threshold) {
            return {
                finalOffer: 'IMPULSE',
                wasDowngraded: true,
                system_override_reason: `[CIRCUIT BREAKER ACTIVADO]: Offer target era ${targetOffer}, pero Investment Score (${score}) es menor al umbral (${threshold}). Fallback de seguridad a IMPULSE forzado para proteger la venta.`
            };
        }
    }

    // El score soporta la oferta target, o es una oferta entry-level (IMPULSE)
    return {
        finalOffer: targetOffer,
        wasDowngraded: false,
        system_override_reason: null
    };
};
