import ragConfig from '../config/rag.config.js';

class ScoringService {
    /**
     * Calculates a dynamic opportunity score (0-100) for Leads Pro AI v2.0
     */
    static calculateScore(lead) {
        if (!lead) return 0;

        // Core Negative Scoring: Clients with extremely low rating or known franchises
        if (lead?.rating && lead.rating < 3.0) return 0;

        const franchiseKeywords = ['mcdonald', 'starbucks', 'burger king', 'subway', 'pizza hut', 'domino', 'kfc', 'walmart', 'carrefour'];
        if (franchiseKeywords.some(kw => lead?.name?.toLowerCase().includes(kw))) return 0;

        // PENALTY_ZOMBIE (-100): Inactive businesses
        if (lead?.is_zombie) return 0;

        let score = 0;

        // 1. BONUS_ANALOG (+80): Successful businesses without web
        const isSuccessfulAnalog = !lead?.website && (lead?.userRatingsTotal || 0) > 50 && (lead?.rating || 0) > 4.2;
        if (isSuccessfulAnalog) {
            score += 80;
        }

        // 2. BONUS_INEFFICIENCY (+40): Good business + Poor Technology (Wix/GoDaddy)
        const hasInefficientTech = lead?.tech_stack && (lead.tech_stack.includes('Wix') || lead.tech_stack.includes('GoDaddy'));
        const isGoodBusiness = lead?.rating > 4.0 || lead?.is_advertising;

        if (hasInefficientTech && isGoodBusiness) {
            score += 40;
        }

        // 3. Performance Bonus: TTFB Issues
        if (lead?.performance_metrics?.performance_issue) {
            score += 15;
        }

        // 4. Advertising intent: Boost priority
        if (lead?.is_advertising) {
            score += 30;
        }

        // 5. [NEW] Agency Affinity Bonus (+25)
        // Checks if the lead's "pains" align with what the agency sells (defined in AGENCY_CONTEXT.md)
        const agencyOffers = ragConfig.agency.raw.toLowerCase();

        const detectAffinity = () => {
            // SEO Pain -> SEO Offer
            if (lead?.seo_audit?.missing_meta_desc && (agencyOffers.includes('seo') || agencyOffers.includes('posicionamiento'))) return true;
            // Perf Pain -> Web Dev/Optimization Offer
            if (lead?.performance_metrics?.performance_issue && (agencyOffers.includes('web') || agencyOffers.includes('optimización') || agencyOffers.includes('performance'))) return true;
            // Digital Gap -> Digitalization Offer
            if (!lead?.website && (agencyOffers.includes('web') || agencyOffers.includes('digitalización'))) return true;
            // Ad Intent -> Ads Management Offer
            if (lead?.is_advertising && (agencyOffers.includes('ads') || agencyOffers.includes('publicidad') || agencyOffers.includes('pauta'))) return true;

            return false;
        };

        if (detectAffinity()) {
            console.log(`[SCORING] Afinidad de Agencia detectada para ${lead.name} (+25 pts)`);
            score += 25;
        }

        // General Authority points
        if (lead?.userRatingsTotal > 100) score += 10;

        // Final normalization
        return Math.min(Math.max(score, 0), 100);
    }

    /**
     * Generates a refined sales angle combining Tech Profiling and Reviews
     */
    static generateRefinedAngle(lead, reviews) {
        if (!lead) return "Análisis de oportunidad estándar";
        let angle = "";

        const hasBadTech = lead?.tech_stack && (lead.tech_stack.includes('Wix') || lead.tech_stack.includes('GoDaddy'));
        const hasPerfIssue = lead?.performance_metrics?.performance_issue;

        // Review analysis for specific friction
        const reviewText = reviews ? reviews.join(' ').toLowerCase() : "";
        const frictionDetected = reviewText.includes('teléfono') || reviewText.includes('atiende') || reviewText.includes('espera');

        if (lead?.is_advertising && hasBadTech) {
            angle = `Cliente con alta inversión publicitaria pero web de bajo rendimiento (${lead?.tech_stack?.join(', ') || 'N/A'}). Riesgo de pérdida de presupuesto.`;
        } else if (!lead?.website && (lead?.userRatingsTotal || 0) > 50) {
            angle = "Negocio exitoso operando en 'modo analógico'. Urgencia de digitalización profesional para escalar.";
        } else if (hasPerfIssue) {
            angle = `Web lenta detectada (TTFB >1.5s). Oportunidad de mejora de conversión mediante optimización técnica.`;
        } else if (frictionDetected) {
            angle = "Fricción operativa detectada en reseñas. Oportunidad de implementar herramientas de automatización/contacto.";
        } else {
            angle = lead.tech_stack?.length > 0 ? `Modernización de stack tecnológico (${lead.tech_stack[0]})` : "Mejora de autoridad y captación digital";
        }

        return angle;
    }

    /**
     * Categorizes the opportunity level
     */
    static getOpportunityLevel(score, lead) {
        if (lead?.is_advertising || score >= 90) return 'Critical';
        if (score >= 70) return 'High';
        if (score >= 40) return 'Medium';
        return 'Low';
    }
}

export default ScoringService;
