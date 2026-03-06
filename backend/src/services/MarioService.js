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
        const searchNiche =
          lead.spider_memory?.applied_tactic ||
          lead.spider_verdict?.pain ||
          lead.name;
        const queryEmbedding = await AIService.generateEmbedding(searchNiche);
        const results = await VectorStoreService.searchSimilar(
          COLLECTIONS.MARIO_KNOWLEDGE,
          queryEmbedding,
          null,
          3, // Top 3 documents
          0.4, // Confidence threshold
        );

        if (results && results.length > 0) {
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
              `Intento ${idx + 1}: El humano rechazó tu propuesta anterior. Feedback del humano: "${fs.human_feedback}".\nLo que enviaste (resumen): ${JSON.stringify(fs.strategy_data.sales_funnel_copy)}`,
          )
          .join("\n---\n");

        rlhfBlock = `\n[ALERTA ROJA - CORRECCIÓN RLHF HUMANA]:\nATENCIÓN: Tus intentos anteriores para este lead fueron RECHAZADOS.\n${feedbackLogs}\nREGLA ESTRICTA: NO repitas los errores del feedback. Ajusta drásticamente tu enfoque según las correcciones del humano.\n`;
      }

      // 3.5 Upsell Injection
      let upsellBlock = "";
      if (options.forceUpsell === true) {
        upsellBlock = `\n[INSTRUCCIÓN DE VENTA CRUZADA (UPSELL)]:\nEl Director de Ventas ha ordenado que el 'innovative_upsell' se ofrezca de forma EXPLÍCITA en el 'opening_message' y a lo largo del embudo. Integra esta oferta de manera fluida y natural. REGLA ESTRICTA: Usa un lenguaje extremadamente sencillo y orientado a beneficios para dueños de negocios (Ej. habla de 'atender clientes 24/7', 'respuestas automáticas al instante', 'no perder ventas'). NO uses jerga técnica como 'RAG', 'Vectores' o 'LLM' en el copy del mensaje.\n`;
      }

      // 4. Construct WAR ROOM Mega-Prompt
      const spiderVerdict = lead.spider_verdict || {};
      const isWhatsappValid = lead.whatsapp_valid === true;

      const systemPrompt = `Eres un sistema autónomo de inteligencia artificial operando como el "War Room" (Técnico + Estratega + Closer) de la agencia ${agencyName}.
Tu objetivo principal es cerrar ventas B2B asimétricas, actuando en representación de ${salesRep}.

[IDENTIDAD DE LA AGENCIA Y OFERTA]:
Propuesta de Valor: ${valueProp}
Servicios Core Disponibles: ${JSON.stringify(coreServices)}
Regla Lingüística: ${linguisticTone === "LATAM" ? "Fuerza el uso de voseo/tuteo, tono casual típico de Latinoamérica." : linguisticTone === "EXPORT" ? "Fuerza un tono neutral, profesional y directo (neutro o España)." : "Autodetecta el mejor tono en base al lead."}

[DATOS TÉCNICOS DEL LEAD (Extraídos por VORTEX & SPIDER)]:
- Nombre: ${lead.name}
- Industria/Dolor SPIDER: ${spiderVerdict.pain || "N/A"}
- Falla Técnica Real: ${spiderVerdict.technical_flaw || "N/A"}
- Táctica SPIDER Asignada: ${lead.spider_memory?.applied_tactic || spiderVerdict.tactic_name || "Auditoría Inicial"}
- Fricción de Código: ${spiderVerdict.friction_score || "N/A"}
- Visión Multimodal UX: ${lead.vision_analysis ? JSON.stringify(lead.vision_analysis) : "Sin análisis visual"}
- Whatsapp Valido (Mobile): ${isWhatsappValid ? "SÍ" : "NO"}

${ragContext}
${rlhfBlock}
${upsellBlock}

[INSTRUCCIONES DEL WAR ROOM - FORMATO ESTRICTO JSON]:
Debes debatir internamente y generar una estrategia implacable. Tu respuesta DEBE ser EXCLUSIVAMENTE un objeto JSON válido que cumpla estrictamente con esta estructura:

{
  "internal_reasoning": {
    "spider_data_cited": "Dato técnico exacto de SPIDER o Vision que justifica la acción.",
    "rag_sources_cited": "Principio del documento de conocimiento aplicado. REGLA ESTRICTA: Si la consulta a la base de datos RAG (Qdrant) no devuelve información útil o el array está vacío, DEBES poner exactamente la cadena 'NO_CONTEXT_FOUND'.",
    "logic_chain": "Cadena lógica del debate simulado entre el Agente Técnico (qué falla), Estratega (ángulo de ataque) y Closer (call to action)."
  },
  "strategic_planning": {
    "approach_overview": "Justificación táctica del abordaje.",
    "recommended_channel": "${isWhatsappValid ? "WHATSAPP" : "EMAIL"} (Basado en la validación estricta de la línea).",
    "channel_justification": "Por qué se eligió este canal."
  },
  "solution_architecture": {
    "core_offer": "Oferta principal elegida de los Servicios Core Disponibles.",
    "innovative_upsell": "Ángulo tecnológico innovador (ej. Chatbot RAG o automatización) que potencie la oferta core.",
    "technical_rationale": "Por qué esta arquitectura soluciona el problema de fricción técnica o UX detectado."
  },
  "sales_funnel_copy": {
    "opening_message": "Mensaje de contacto inicial (Directo, casual, humano, atacando el dolor técnico. OMITIR saludos corporativos y despedidas).",
    "follow_up_pressure": "Copy abrasivo pero profesional para seguimiento si hay silencio a las 48hs.",
    "objection_handling": "Manejo corto de la objeción más probable.",
    "closing_script": "Call to action exacto para moverlos a una videollamada de cierre (Zoom/Meet)."
  }
}

REGLAS DE FORMATO Y REDACCIÓN:
1. NUNCA firmes el mensaje. NUNCA pongas "Saludos", ni "Atentamente". El mensaje debe terminar abruptamente en el Call to Action.
2. NO hables en lenguaje corporativo ("sinergia", "potenciar"). Habla como un empresario real.
3. El JSON debe ser válido e interpretable directamente. No agregues backticks de markdown (como \\\`\\\`\\\`json) por fuera del objeto.`;

      console.log(
        `[MarioService] Ejecutando War Room para Lead: ${leadId}. RLHF Activo: ${previousFailedStrategies.length > 0}`,
      );

      // 5. OpenAI Call (Strict JSON)
      const engineInfo = await AIService.getEngine();
      const openai = engineInfo.client;
      const modelName = "gpt-4o"; // Usamos 4o u 4o-mini según config, forzando JSON

      // Prefer Gpt-4o-mini for speed and cost, but keep 4o strictness for JSON if configured
      const activeModel = engineInfo.config?.active_model || "gpt-4o-mini";

      const completion = await openai.chat.completions.create({
        model: activeModel,
        temperature: 0.7, // War Room needs some creativity to bypass defenses
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analiza al lead ${lead.name} y formula el armamento JSON para el ataque.`,
          },
        ],
      });

      // 6. Track Usage
      AIService.trackUsage(completion, LLM_PRICING[activeModel]);

      // 7. Parse and Persist Strategy
      const rawJsonResponse = completion.choices[0].message.content;
      let parsedStrategy;
      try {
        parsedStrategy = JSON.parse(rawJsonResponse);
      } catch (parseErr) {
        console.error(
          `[MarioService] Failed to parse JSON from OpenAI:`,
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

      // Store the latest copy in the Lead for backwards compatibility in UI (temporarily)
      lead.tactical_response = parsedStrategy.sales_funnel_copy.opening_message;
      lead.spider_memory.generated_playbook = JSON.stringify(parsedStrategy); // Legacy UI support
      await lead.save();

      return {
        strategy_id: newStrategyLog._id,
        strategy: parsedStrategy,
        rlhf_warnings_applied: previousFailedStrategies.length,
      };
    } catch (error) {
      console.error("[MarioService] War Room Execution Failed:", error);
      throw error;
    }
  }
}

export default MarioService;
