import Lead from "../models/Lead.js";
import Settings from "../models/Settings.js";
import MarioStrategy from "../models/MarioStrategy.js";
import AIService from "./AIService.js";
import AgentOrchestrator from "./AgentOrchestrator.js";
import VectorStoreService, { COLLECTIONS } from "./VectorStoreService.js";
import { LLM_PRICING } from "../config/llm_pricing.js";
import { marioPrompt } from "../prompts/MarioPrompt.js";

class MarioService {
  /**
   * Generates a B2B Closer strategy using the Multi-Agent Pipeline V11.
   * Falls back to the monolithic V10.4 prompt if the pipeline fails.
   *
   * @param {string} leadId - The Mongoose ID of the lead.
   * @param {Array} previousFailedStrategies - Array of { strategy_data, human_feedback } from MarioStrategy.
   * @param {Object} options - Additional options for execution.
   * @param {boolean} options.forceUpsell - Whether to enforce upsell in the copy.
   */
  static async generateStrategy(
    leadId,
    previousFailedStrategies = [],
    options = {},
  ) {
    try {
      // ═══════════════════════════════════════════════════
      // 1. LOAD DATA (shared by both pipelines)
      // ═══════════════════════════════════════════════════
      const lead = await Lead.findById(leadId);
      if (!lead) throw new Error(`Lead ${leadId} no encontrado.`);

      const settings = await Settings.findOne({ isSingleton: true });
      const linguisticTone = settings?.linguistic_behavior || "AUTO";

      // ═══════════════════════════════════════════════════
      // 2. RAG INJECTION (shared by both pipelines)
      // ═══════════════════════════════════════════════════
      let ragContext = "";
      try {
        const searchNiche = `Empresa/Cliente: ${lead.name}. Sector/Dolor detectado: ${lead.spider_verdict?.pain || "No especificado"}.`;
        const queryEmbedding = await AIService.generateEmbedding(searchNiche);

        const knowledgeResults = await VectorStoreService.searchSimilar(
          COLLECTIONS.MARIO_KNOWLEDGE,
          queryEmbedding,
          null,
          3,
          0.25,
        );

        if (knowledgeResults?.length > 0) {
          const texts = knowledgeResults
            .map((r) => r.payload?.text_chunk)
            .filter(Boolean);
          ragContext = `\n[CONOCIMIENTO DE NICHO (RAG)]:\n${texts.join("\n---\n")}`;
        }
      } catch (err) {
        console.warn("[MarioService] Knowledge RAG Error:", err.message);
      }

      // ═══════════════════════════════════════════════════
      // 2.5 RAG INJECTION: Engagement Patterns (WON/LOST)
      // ═══════════════════════════════════════════════════
      let tacticalContext = "";
      try {
        const tacticalQuery = `Nicho: ${lead.category}. Tech: ${lead.tech_stack?.join(", ")}. Táctica: ${lead.spider_memory?.applied_tactic}.`;
        const tacticalEmbedding =
          await AIService.generateEmbedding(tacticalQuery);

        const tacticalResults = await VectorStoreService.searchSimilar(
          COLLECTIONS.SPIDER_MEMORY,
          tacticalEmbedding,
          null,
          5,
          0.6,
        );

        if (tacticalResults?.length > 0) {
          const wins = tacticalResults
            .filter((r) => r.payload?.outcome === "WON")
            .map(
              (r) =>
                ` - ÉXITO: Perfil ${r.payload.niche} con tech ${r.payload.tech_stack?.join(", ")} RESPONDIÓ POSITIVAMENTE.`,
            );
          const losses = tacticalResults
            .filter((r) => r.payload?.outcome === "LOST")
            .map(
              (r) =>
                ` - FRACASO: Este perfil ignoró el mensaje anterior. EVITAR redundancia o tono usado.`,
            );

          if (wins.length > 0 || losses.length > 0) {
            tacticalContext = `\n[EXPERIENCIA TÁCTICA PREVIA (Engagement)]:\n${wins.join("\n")}\n${losses.join("\n")}`;
          }
        }
      } catch (err) {
        console.warn("[MarioService] Tactical RAG Error:", err.message);
      }

      // ═══════════════════════════════════════════════════
      // 3. RLHF INJECTION (shared by both pipelines)
      // ═══════════════════════════════════════════════════
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

      // ═══════════════════════════════════════════════════
      // 3.5 UPSELL & CONSTRAINTS (shared by both pipelines)
      // ═══════════════════════════════════════════════════
      let upsellBlock = "";
      if (options.forceUpsell === true) {
        upsellBlock = `\n[INSTRUCCIÓN DE VENTA CRUZADA (UPSELL)]:\nEl Director de Ventas ha ordenado que el 'innovative_upsell' se ofrezca de forma EXPLÍCITA en el 'opening_message' y a lo largo del embudo. Integra esta oferta de manera fluida y natural. REGLA ESTRICTA: Usa un lenguaje extremadamente sencillo y orientado a beneficios para dueños de negocios (Ej. habla de 'atender clientes 24/7', 'respuestas automáticas al instante', 'no perder ventas'). NO uses jerga técnica como 'RAG', 'Vectores' o 'LLM' en el copy del mensaje.\n`;
      }

      const spiderVerdict = lead.spider_verdict || {};
      const objectionMode = options.objection_mode || "STANDARD";

      const latamConstraint =
        linguisticTone === "LATAM"
          ? " REGLA ESTRICTA LATAM: TIENES ABSOLUTAMENTE PROHIBIDO usar signos de apertura de exclamación (¡) o interrogación (¿), usa solo los de cierre para sonar como un humano real en internet."
          : "";

      const promptCategoryHint = lead.website
        ? lead.vision_analysis?.ux_score >= 8
          ? "TITAN (Infraestructura sólida, falta automatización)"
          : "AUTHORITY (Tiene web, pero tiene fallas tácticas)"
        : "IMPULSE (Sin web o precaria)";

      // ═══════════════════════════════════════════════════
      // 4. MULTI-AGENT PIPELINE V11 (with V10.4 fallback)
      // ═══════════════════════════════════════════════════
      let parsedStrategy;
      let pipelineMetadata;

      try {
        console.log(
          `[MarioService] Ejecutando Pipeline Multi-Agent V11 para Lead: ${leadId} (Modo: ${objectionMode})`,
        );

        const pipelineResult = await AgentOrchestrator.run({
          lead,
          spiderVerdict,
          promptCategoryHint,
          ragContext,
          tacticalContext,
          upsellBlock,
          rlhfBlock,
          objectionMode,
          latamConstraint,
        });

        parsedStrategy = pipelineResult.strategy;
        pipelineMetadata = pipelineResult.pipeline_metadata;

        console.log(
          `[MarioService] Pipeline V11 exitoso. Tokens: ${pipelineMetadata.total_tokens}, Costo: $${pipelineMetadata.total_cost_usd}`,
        );
      } catch (pipelineErr) {
        // ═══════════════════════════════════════════════════
        // FALLBACK: V10.4 Monolithic Prompt
        // ═══════════════════════════════════════════════════
        console.warn(
          `[MarioService] Pipeline V11 fallo (${pipelineErr.message}). Ejecutando Fallback V10.4...`,
        );

        pipelineMetadata = {
          version: "V10.4_FALLBACK",
          agents_used: ["MONOLITHIC"],
          total_tokens: 0,
          total_cost_usd: 0,
          agent_timings: {},
          fallback_reason: pipelineErr.message,
        };

        parsedStrategy = await MarioService._executeFallbackV104({
          lead,
          promptCategoryHint,
          spiderVerdict,
          ragContext,
          tacticalContext,
          upsellBlock,
          rlhfBlock,
          objectionMode,
          latamConstraint,
          pipelineMetadata,
        });
      }

      // ═══════════════════════════════════════════════════
      // 5. POST-PROCESSING (shared by both pipelines)
      // ═══════════════════════════════════════════════════
      const baseAuthority = 62;
      const variance = Math.floor(Math.random() * 19);
      const authorityValue = baseAuthority + variance;

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

      // ═══════════════════════════════════════════════════
      // 6. PERSIST STRATEGY
      // ═══════════════════════════════════════════════════
      const newStrategyLog = new MarioStrategy({
        lead_id: lead._id,
        strategy_data: parsedStrategy,
        status: "PENDING",
        pipeline_metadata: pipelineMetadata,
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
        pipeline_metadata: pipelineMetadata,
      };
    } catch (error) {
      console.error("[MarioService] Sales Orchestration Failed:", error);
      throw error;
    }
  }

  /**
   * FALLBACK: Execute the original V10.4 monolithic prompt.
   * Activated automatically when the multi-agent pipeline fails.
   */
  static async _executeFallbackV104({
    lead,
    promptCategoryHint,
    spiderVerdict,
    ragContext,
    tacticalContext,
    upsellBlock,
    rlhfBlock,
    objectionMode,
    latamConstraint,
    pipelineMetadata,
  }) {
    const systemPrompt = marioPrompt({
      lead,
      promptCategoryHint,
      spiderVerdict,
      ragContext,
      tacticalContext,
      upsellBlock,
      rlhfBlock,
      objectionMode,
      latamConstraint,
    });

    console.log(
      `[MarioService] Fallback V10.4 ejecutandose para Lead: ${lead._id} (Modo: ${objectionMode}).`,
    );

    const engineInfo = await AIService.getEngine();
    const openai = engineInfo.client;
    const activeModel = engineInfo.config?.active_model || "gpt-4o-mini";

    const completion = await openai.chat.completions.create({
      model: activeModel,
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Orquesta el ataque V10.4 para ${lead.name}. Genera el JSON completo.`,
        },
      ],
    });

    // Track usage
    const pricing = LLM_PRICING[activeModel] || LLM_PRICING["gpt-4o-mini"];
    AIService.trackUsage(completion, pricing);

    // Update fallback metadata
    pipelineMetadata.total_tokens =
      (completion.usage?.prompt_tokens || 0) +
      (completion.usage?.completion_tokens || 0);
    const cost =
      ((completion.usage?.prompt_tokens || 0) / 1_000_000) * pricing.input +
      ((completion.usage?.completion_tokens || 0) / 1_000_000) * pricing.output;
    pipelineMetadata.total_cost_usd = parseFloat(cost.toFixed(6));

    const rawJsonResponse = completion.choices[0].message.content;

    try {
      return JSON.parse(rawJsonResponse);
    } catch (parseErr) {
      console.error(
        `[MarioService] ❌ Fallback V10.4 JSON parse failed:`,
        rawJsonResponse,
      );
      throw new Error("El sistema no devolvió un JSON válido (Fallback V10.4).");
    }
  }
}

export default MarioService;
