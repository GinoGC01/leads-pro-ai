const fs = require('fs');
const path = require('path');

let agencyContext = 'No se ha definido el contexto de la agencia.';
try {
    const agencyPath = path.join(__dirname, 'AGENCY_CONTEXT.md');
    if (fs.existsSync(agencyPath)) {
        agencyContext = fs.readFileSync(agencyPath, 'utf8');
    }
} catch (err) {
    console.error('[RAG Config] Error loading AGENCY_CONTEXT.md:', err.message);
}

module.exports = {
    // Agency Context for Dual-Context RAG
    agency: {
        raw: agencyContext,
        // Helper to get a condensed version for prompts if needed
        condensed: agencyContext.substring(0, 1000)
    },
    // 1. LLM Operational Parameters (Anti-Hallucination Core)
    llm: {
        model: 'gpt-4o-mini',
        // Temperatura 0 es innegociable para tareas analíticas de datos. 
        // 0.1-0.2 solo si necesitas que el "experto en marketing" suene más natural en el chat.
        temperature: 0.1,
        max_tokens: 1000,
    },

    // 2. Vector Database Parameters
    vector: {
        model: 'text-embedding-3-small',
        dimensions: 1536,
        // Un umbral de 0.3 es mucho más permisivo para asegurar resultados en el chat.
        similarityThreshold: 0.3,
        maxResults: 5, // No satures el contexto del LLM o empezará a alucinar por sobrecarga
    },

    // 3. Ingestion Templates (Resolviendo el Frankenstein Semántico)
    // Transforma el JSON estructurado en prosa natural para maximizar la calidad del embedding
    ingestion: {
        buildSemanticContent: (lead) => {
            const reviewsText = lead.reviews?.slice(0, 2).join(" ") || "Sin reseñas destacadas.";
            const techStack = lead.tech_stack?.length > 0 ? lead.tech_stack.join(", ") : "Tecnología desconocida";

            return `
                Empresa: ${lead.name}. 
                Ubicación: ${lead.address || 'No disponible'}.
                Contacto: ${lead.phoneNumber || lead.email || 'No disponible'}.
                Sector/Categoría: ${lead.category || 'General'}.
                Ángulo de venta: ${lead.sales_angle || 'No definido'}.
                Estado: ${lead.is_zombie ? 'Zombie/Inactivo' : 'Activo'}.
                Web Perf: ${lead.performance_metrics?.performance_issue ? 'Lenta' : 'Óptima'} (TTFB: ${lead.performance_metrics?.ttfb || 'N/A'}ms).
                Stack: ${techStack}.
                Reseñas: ${reviewsText}.
            `.replace(/\s+/g, ' ').trim();
        }
    },

    // 4. Prompt Engineering (The Law of the System)
    prompts: {
        // System prompt dicta la "Personalidad" y las "Restricciones"
        system: `Eres un estratega de marketing de alto nivel y analista de ventas B2B para la plataforma 'Leads Pro AI'.
Tu objetivo es analizar los prospectos comerciales (leads) proporcionados en el contexto y generar estrategias de cierre de ventas, análisis de objeciones y evaluación de oportunidades.

REGLAS ESTRICTAS DE NO ALUCINACIÓN:
1. BASADO EN EVIDENCIA: Utiliza ÚNICAMENTE la información proporcionada en la sección [CONTEXTO DE LEADS]. 
2. NO INVENTES: Si se te pregunta sobre el teléfono, métricas o reseñas de un lead y no está en el contexto, DEBES responder textualmente: "No tengo esa información en mi base de datos sobre este lead."
3. SEPARACIÓN DE CONCEPTOS: Si el usuario pregunta por conceptos generales de marketing (ej. "¿Qué es el TTFB?"), puedes usar tu conocimiento interno. Si pregunta sobre un lead específico, tu única fuente de verdad es el contexto.
4. HONESTIDAD INTELECTUAL: Si el 'leadOpportunityScore' es bajo, no intentes suavizarlo. Analiza fríamente por qué es un mal prospecto.`,

        // Plantilla dinámica para inyectar en la petición de chat
        buildChatContext: (query, retrievedLeads) => {
            const leadsContext = retrievedLeads.map(l =>
                `- LEAD [ID: ${l.lead_id}]: ${l.name} | Contexto Semántico: ${l.content}`
            ).join('\n');

            return `
[CONTEXTO DE LEADS RECUPERADOS]
${leadsContext || 'No se encontraron leads relevantes para esta consulta.'}

[PREGUNTA DEL USUARIO]
${query}

Genera tu análisis aplicando las REGLAS ESTRICTAS DE NO ALUCINACIÓN.
`;
        }
    }
};
