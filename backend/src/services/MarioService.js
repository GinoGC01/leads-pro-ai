import Lead from "../models/Lead.js";
import Settings from "../models/Settings.js";
import MarioStrategy from "../models/MarioStrategy.js";
import AIService from "./AIService.js";
import VectorStoreService, { COLLECTIONS } from "./VectorStoreService.js";
import { LLM_PRICING } from "../config/llm_pricing.js";

class MarioService {
  /**
   * Generates a structural, B2B Closer strategy using a War Room of agents (Técnico + Estratega + Closer).
   * Enforces strict JSON output and injects RLHF feedback if previous strategies failed.
   *
   * @param {string} leadId - The Mongoose ID of the lead.
   * @param {Array} previousFailedStrategies - Array of { strategy_data, human_feedback } from MarioStrategy.
   * @param {Object} options - Additional options for execution.
   * @param {boolean} options.forceUpsell - Whether to enforce the innovative upsell directly in the copy.
   */
  static async generateStrategy(
    leadId,
    previousFailedStrategies = [],
    options = {},
  ) {
    try {
      // 1. Load Data
      const lead = await Lead.findById(leadId);
      if (!lead) throw new Error(`Lead ${leadId} no encontrado.`);

      const settings = await Settings.findOne({ isSingleton: true });
      const coreServices =
        !settings ||
        !settings.core_services ||
        settings.core_services.length === 0
          ? ["Desarrollo Web de Alta Conversión", "Consultoría Tecnológica"]
          : settings.core_services;

      const valueProp =
        settings?.value_proposition ||
        "El usuario aún no configuró la propuesta de valor. Asume una oferta estándar tecnológica orientada a resultados.";
      const linguisticTone = settings?.linguistic_behavior || "AUTO";
      const agencyName = settings?.agency_name || "Agencia IA";
      const salesRep = settings?.sales_rep_name || "nuestro equipo";

      // 2. RAG Injection: Search mario_knowledge in Qdrant based on Lead's applied tactic or niche
      let ragContext = "";
      try {
        // Construir un query rico semánticamente combinando los atributos del lead
        const searchNiche = `Empresa/Cliente: ${lead.name}. Sector/Dolor detectado: ${lead.spider_verdict?.pain || "No especificado"}. Táctica a aplicar: ${lead.spider_memory?.applied_tactic || "Venta de servicios IT"}.`;

        console.log(`[MarioService] RAG Query Term: "${searchNiche}"`);
        const queryEmbedding = await AIService.generateEmbedding(searchNiche);

        // ── HYBRID FILTER: Extract niche keywords for Qdrant tag matching ──
        const leadNiche = lead.spider_verdict?.pain || lead.category || null;
        let qdrantFilter = null;

        if (leadNiche) {
          // Build niche keywords from the pain/category (e.g. "Sector Legal" → "legal")
          const nicheKeywords = leadNiche
            .toLowerCase()
            .replace(/[^a-záéíóúüñ\s]/gi, "")
            .split(/\s+/)
            .filter((w) => w.length > 3); // Only meaningful words

          if (nicheKeywords.length > 0) {
            // Qdrant filter: match any document whose tags array contains any of these keywords
            qdrantFilter = {
              should: nicheKeywords.map((keyword) => ({
                key: "tags",
                match: { value: keyword },
              })),
            };
            console.log(
              `[MarioService] RAG Hybrid Filter: tags should match any of [${nicheKeywords.join(", ")}]`,
            );
          }
        }

        const results = await VectorStoreService.searchSimilar(
          COLLECTIONS.MARIO_KNOWLEDGE,
          queryEmbedding,
          qdrantFilter,
          5, // Top 5 chunks for richer context
          0.25, // Permissive threshold
        );

        console.log(
          `[MarioService] RAG Results Count: ${results?.length || 0}`,
        );
        if (results && results.length > 0) {
          results.forEach((r, i) =>
            console.log(
              `  -> Match ${i}: Score = ${r.score.toFixed(4)}, Source = ${r.payload?.source}`,
            ),
          );
          const texts = results
            .map((r) => r.payload?.text_chunk)
            .filter(Boolean);
          if (texts.length > 0) {
            ragContext = `\n[CONOCIMIENTO PROPIO RELEVANTE (RAG)]:\nAplica estos principios extraídos de nuestra base de datos para este nicho:\n${texts.join("\n---\n")}`;
          }
        }
      } catch (ragError) {
        console.warn(
          `[MarioService] RAG Query non-blocking fail: ${ragError.message}`,
        );
      }

      // 3. RLHF Injection
      let rlhfBlock = "";
      if (previousFailedStrategies && previousFailedStrategies.length > 0) {
        const feedbackLogs = previousFailedStrategies
          .map(
            (fs, idx) =>
              `Intento ${idx + 1}: El humano rechazó tu propuesta anterior. Feedback del humano: "${fs.human_feedback}".\nLo que enviaste (resumen): ${JSON.stringify(fs.strategy_data.sales_funnel_copy || fs.strategy_data.ataque_inicial || fs.strategy_data)}`,
          )
          .join("\n---\n");

        rlhfBlock = `\n[ALERTA ROJA - CORRECCIÓN RLHF HUMANA]:\nATENCIÓN: Tus intentos anteriores para este lead fueron RECHAZADOS.\n${feedbackLogs}\nREGLA ESTRICTA: NO repitas los errores del feedback. Ajusta drásticamente tu enfoque según las correcciones del humano.\n`;
      }

      // 3.5 Upsell Injection
      let upsellBlock = "";
      if (options.forceUpsell === true) {
        upsellBlock = `\n[INSTRUCCIÓN DE VENTA CRUZADA (UPSELL)]:\nEl Director de Ventas ha ordenado que el 'innovative_upsell' se ofrezca de forma EXPLÍCITA en el 'opening_message' y a lo largo del embudo. Integra esta oferta de manera fluida y natural. REGLA ESTRICTA: Usa un lenguaje extremadamente sencillo y orientado a beneficios para dueños de negocios (Ej. habla de 'atender clientes 24/7', 'respuestas automáticas al instante', 'no perder ventas'). NO uses jerga técnica como 'RAG', 'Vectores' o 'LLM' en el copy del mensaje.\n`;
      }

      // 4. Construct Sales Orchestration Engine V10.4 Mega-Prompt
      const spiderVerdict = lead.spider_verdict || {};
      const visionData = lead.vision_analysis || {};
      const objectionMode = options.objection_mode || "STANDARD";
      
      const latamConstraint =
        linguisticTone === "LATAM"
          ? " REGLA ESTRICTA LATAM: TIENES ABSOLUTAMENTE PROHIBIDO usar signos de apertura de exclamación (¡) o interrogación (¿), usa solo los de cierre para sonar como un humano real en internet."
          : "";

      const systemPrompt = `[MARIO V10.4 - SALES ORCHESTRATION ENGINE]:
1. ROL: No eres un asistente, eres un Sales Orchestration Engine diseñado para cerrar tratos B2B de alto ticket.
2. CORE TARGET INFERENCE: Clasifica al lead en una de estas 3 categorías:
   - IMPULSE: Leads sin web o con nula presencia digital. Dolor: Invisibilidad inmediata.
   - AUTHORITY: Leads con web pero fallos técnicos/SEO/UX. Dolor: Pérdida de credibilidad/conversión.
   - TITAN: Leads corporativos con infraestructura sólida pero falta de automatización IA. Dolor: Ineficiencia operativa.
3. TIMELINE ORCHESTRATION: Diseña una hoja de ruta de 5 pasos críticos para llevar el lead del "Dolor" al "Cierre".
4. DUAL-COPY ARCHITECTURE: Genera simultáneamente 'mensaje_base' (ataque directo al grano) y 'mensaje_con_upsell' (incluyendo la oferta innovadora de forma orgánica).
5. OBJECTION MODE (${objectionMode}): Si es CUSTOM, usa los hallazgos de VORTEX para predecir fricciones específicas. Si es STANDARD, usa las 3 objeciones clásicas (Precio, Tiempo, Autoridad).

[PRINCIPIOS DE COMUNICACIÓN]:
- PROHIBICIÓN ABSOLUTA DE LENGUAJE SERVIL: Prohibido saludar ("Hola", "Espero que estés bien") o usar rellenos de cortesía. 
- FORZADO DE TOKEN: El 'mensaje_base', 'mensaje_con_upsell' y las respuestas en 'objection_tree' DEBEN comenzar EXACTAMENTE con el token [PERSONALIZED_GREETING] (seguido de un espacio).
- INSIGHT DE IMPACTO: Después del token de saludo, DEBES mencionar explícitamente su negocio/estudio/agencia por nombre (ej: "En su estudio [Nombre], ...") y ve DIRECTO al grano con un golpe de realidad basado en RAG.
- ANTI-IA JARGON & CLICHÉS (CRÍTICO): Prohibido usar términos y estructuras que suenen a bot o a comercial estadounidense traducido.
    * NO USAR: "en línea", "marketing digital", "optimizar la captación", "presencia digital", "mundo digital".
    * PROHIBICIÓN DE SIGNOS IA: No uses dos puntos (:) para enfatizar o listar dentro de una oración (ej: "el problema es: ..."). Es una marca de ChatGPT. Usa punto seguido o fluye la frase naturalmente.
    * EVITAR CLICHÉS DE VENTA BARATA: Prohibido usar "centrarse en lo que hace mejor", "enfocarse en su pasión", o frases de cierre tipo infomercial.
    * USAR: "internet", "marketing", "conseguir clientes", "conseguir casos", "automatizar procesos", "crecer el negocio", "centrarse en su labor", "liberar tiempo de gestión".
- Lenguaje Layman (Sencillo): Cero jerga técnica. Traduce todo a dinero y tiempo.
- Tono: Auditor Estratégico. Clínico, letal y humano. Habla como un socio de negocios local, directo y sin rodeos.${latamConstraint}

[DATOS DEL LEAD]:
- Empresa: ${lead.name}
- Nicho: ${lead.category || "General"}
- Hallazgo VORTEX: ${spiderVerdict.technical_flaw || "Invisibilidad digital"}
- Hallazgo Vision: ${visionData.critical_frictions ? visionData.critical_frictions.join(", ") : "Estructura estándar"}

${ragContext}
${upsellBlock}

[ALERTA ROJA - CORRECCIÓN RLHF HUMANA]:
${rlhfBlock || "No hay correcciones previas. Mantén la excelencia operativa."}

[OBLIGATORIO: FORMATO DE SALIDA JSON]:
Tu respuesta DEBE ser EXCLUSIVAMENTE un objeto JSON con la siguiente estructura. No incluyas markdown, introducciones ni explicaciones.

{
  "resumen_orquestacion": "Breve descripción de la estrategia global.",
  "timeline": [
    {"step": 1, "action": "Acción inmediata de contacto."},
    {"step": 2, "action": "Aislamiento del dolor."},
    {"step": 3, "action": "Presentación de la variable de autoridad."},
    {"step": 4, "action": "Introducción de la solución."},
    {"step": 5, "action": "Cierre/Agendamiento."}
  ],
  "core_target": "IMPULSE | AUTHORITY | TITAN",
  "mensaje_base": "[PERSONALIZED_GREETING] [Impact_Insight]...",
  "mensaje_con_upsell": "[PERSONALIZED_GREETING] [Impact_Insight] + [Innovative_Upsell]...",
  "objection_tree": {
    "precio": "[PERSONALIZED_GREETING] Respuesta al 'Es muy caro'.",
    "tiempo": "[PERSONALIZED_GREETING] Respuesta al 'No tengo tiempo ahora'.",
    "autoridad": "[PERSONALIZED_GREETING] Respuesta al 'Tengo que consultarlo'."
  }
}`;

      console.log(
        `[MarioService] Ejecutando Orquestación V10.4 para Lead: ${leadId} (Modo: ${objectionMode}).`,
      );

      // 5. OpenAI Call (Strict JSON)
      const engineInfo = await AIService.getEngine();
      const openai = engineInfo.client;
      const activeModel = engineInfo.config?.active_model || "gpt-4o-mini";

      const completion = await openai.chat.completions.create({
        model: activeModel,
        temperature: 0.7,
        max_tokens: 2500, // CTO Directive: Prevention of JSON Truncation
        response_format: { type: "json_object" }, // CTO Directive: Enforce JSON Mode
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Orquesta el ataque V10.4 para ${lead.name}. Genera el JSON completo.`,
          },
        ],
      });

      // 6. Track Usage
      AIService.trackUsage(completion, LLM_PRICING[activeModel]);

      // 7. Parse and Post-Process Strategy (V10.4)
      const rawJsonResponse = completion.choices[0].message.content;
      let parsedStrategy;
      try {
        parsedStrategy = JSON.parse(rawJsonResponse);

        // Varianza Estadística: Inject [AuthorityVariable] (62% a 80%)
        const baseAuthority = 62;
        const variance = Math.floor(Math.random() * 19);
        const authorityValue = baseAuthority + variance;

        // Enhanced Post-processing function to handle nested objects
        const processValue = (val) => {
          if (typeof val === "string") {
            return val
              .replace(/\[AuthorityVariable\]/g, authorityValue)
              .replace(/\[Nicho\]/g, lead.category || "su sector")
              .replace(/\[Empresa\]/g, lead.name)
              .trim();
          }
          if (Array.isArray(val)) {
            return val.map(processValue);
          }
          if (val !== null && typeof val === "object") {
            const processedObj = {};
            for (const k in val) {
              processedObj[k] = processValue(val[k]);
            }
            return processedObj;
          }
          return val;
        };

        parsedStrategy = processValue(parsedStrategy);
      } catch (parseErr) {
        console.error(
          `[MarioService] Failed to parse JSON V10.4:`,
          rawJsonResponse,
        );
        throw new Error("El sistema no devolvió un JSON válido.");
      }

      const newStrategyLog = new MarioStrategy({
        lead_id: lead._id,
        strategy_data: parsedStrategy,
        status: "PENDING",
      });
      await newStrategyLog.save();

      // Store compatibility fields in Lead
      lead.tactical_response = parsedStrategy.mensaje_base;
      lead.spider_memory.generated_playbook = JSON.stringify(parsedStrategy); 
      await lead.save();

      return {
        strategy_id: newStrategyLog._id,
        strategy: parsedStrategy,
        rlhf_warnings_applied: previousFailedStrategies.length,
      };
    } catch (error) {
      console.error("[MarioService] Sales Orchestration Failed:", error);
      throw error;
    }
  }
}

export default MarioService;
