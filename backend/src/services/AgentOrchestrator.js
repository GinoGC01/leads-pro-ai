/**
 * AgentOrchestrator — Multi-Agent Pipeline V11
 *
 * Executes the 3-agent sequential pipeline:
 *   RESEARCHER -> STRATEGIST -> COPYWRITER
 *
 * CRITICAL RULES (User-approved):
 * 1. RLHF injection in BOTH Strategist AND Copywriter
 * 2. Intermediate outputs are STRINGS (no JSON.parse until Copywriter)
 * 3. Per-agent timeouts (Researcher=unlimited, Strategist/Copywriter=15s)
 * 4. All agents use gpt-4o-mini
 * 5. Real-time progress tracking via in-memory store
 */
import AIService from "./AIService.js";
import { LLM_PRICING } from "../config/llm_pricing.js";
import { researcherPrompt } from "../prompts/ResearcherPrompt.js";
import { strategistPrompt } from "../prompts/StrategistPrompt.js";
import { copywriterPrompt } from "../prompts/CopywriterPrompt.js";

// Timeout per agent (ms). Researcher is unlimited by user request.
const AGENT_TIMEOUTS = {
  RESEARCHER: 0,      // 0 = sin limite
  STRATEGIST: 15000,
  COPYWRITER: 15000,
};

const PIPELINE_MODEL = "gpt-4o-mini";

// ═══════════════════════════════════════════════════════════════════════════
// IN-MEMORY PROGRESS STORE
// Tracks pipeline status per lead for frontend polling.
// Structure: Map<leadId, { agents: [...], started_at, completed_at }>
// ═══════════════════════════════════════════════════════════════════════════
const _pipelineProgress = new Map();

// Auto-cleanup after 5 minutes
function _scheduleCleanup(leadId) {
  setTimeout(() => _pipelineProgress.delete(leadId), 5 * 60 * 1000);
}

class AgentOrchestrator {
  /**
   * Get the current pipeline progress for a lead.
   * @param {string} leadId
   * @returns {Object|null}
   */
  static getProgress(leadId) {
    return _pipelineProgress.get(leadId) || null;
  }

  /**
   * Execute the full multi-agent pipeline.
   */
  static async run({
    lead,
    spiderVerdict,
    promptCategoryHint,
    ragContext,
    tacticalContext,
    upsellBlock,
    rlhfBlock,
    objectionMode,
    latamConstraint,
  }) {
    const leadId = lead._id.toString();
    const metadata = {
      version: "V11_MULTI_AGENT",
      agents_used: [],
      total_tokens: 0,
      total_cost_usd: 0,
      agent_timings: {},
    };

    const pricing = LLM_PRICING[PIPELINE_MODEL] || LLM_PRICING["gpt-4o-mini"];

    // Initialize progress tracking
    _pipelineProgress.set(leadId, {
      started_at: Date.now(),
      completed_at: null,
      current_agent: "RESEARCHER",
      agents: [
        { name: "RESEARCHER", status: "running", started_at: Date.now(), completed_at: null, tokens: 0 },
        { name: "STRATEGIST", status: "pending", started_at: null, completed_at: null, tokens: 0 },
        { name: "COPYWRITER", status: "pending", started_at: null, completed_at: null, tokens: 0 },
      ],
    });

    // ═══════════════════════════════════════════════════
    // AGENT 1: RESEARCHER
    // ═══════════════════════════════════════════════════
    const researcherStart = Date.now();
    const researcherSystemPrompt = researcherPrompt({
      lead,
      spiderVerdict,
      promptCategoryHint,
    });

    const researcherBriefing = await AgentOrchestrator._callAgent(
      "RESEARCHER",
      researcherSystemPrompt,
      `Analiza al prospecto ${lead.name} y genera el briefing comercial.`,
      { maxTokens: 600 },
      metadata,
      pricing,
    );

    metadata.agent_timings.researcher_ms = Date.now() - researcherStart;
    AgentOrchestrator._updateProgress(leadId, "RESEARCHER", "done", metadata);
    console.log(
      `[RESEARCHER] OK Briefing generado en ${metadata.agent_timings.researcher_ms}ms`,
    );

    // ═══════════════════════════════════════════════════
    // AGENT 2: STRATEGIST (receives RLHF)
    // ═══════════════════════════════════════════════════
    AgentOrchestrator._updateProgress(leadId, "STRATEGIST", "running", metadata);
    const strategistStart = Date.now();
    const strategistSystemPrompt = strategistPrompt({
      researcherBriefing,
      ragContext,
      tacticalContext,
      upsellBlock,
      rlhfBlock,
      leadName: lead.name,
      objectionMode,
    });

    const strategistBattlePlan = await AgentOrchestrator._callAgent(
      "STRATEGIST",
      strategistSystemPrompt,
      `Disena el plan de batalla para ${lead.name} basandote en el briefing del analista.`,
      { maxTokens: 800 },
      metadata,
      pricing,
    );

    metadata.agent_timings.strategist_ms = Date.now() - strategistStart;
    AgentOrchestrator._updateProgress(leadId, "STRATEGIST", "done", metadata);
    console.log(
      `[STRATEGIST] OK Battle plan generado en ${metadata.agent_timings.strategist_ms}ms`,
    );

    // ═══════════════════════════════════════════════════
    // AGENT 3: COPYWRITER (receives RLHF + strict JSON)
    // ═══════════════════════════════════════════════════
    AgentOrchestrator._updateProgress(leadId, "COPYWRITER", "running", metadata);
    const copywriterStart = Date.now();
    const copywriterSystemPrompt = copywriterPrompt({
      strategistBattlePlan,
      leadName: lead.name,
      rlhfBlock,
      latamConstraint,
      objectionMode,
    });

    const copywriterRaw = await AgentOrchestrator._callAgent(
      "COPYWRITER",
      copywriterSystemPrompt,
      `Escribe el copy de ventas para ${lead.name} basandote en el plan de batalla. Devuelve JSON estricto.`,
      { maxTokens: 1500, jsonMode: true },
      metadata,
      pricing,
    );

    metadata.agent_timings.copywriter_ms = Date.now() - copywriterStart;
    AgentOrchestrator._updateProgress(leadId, "COPYWRITER", "done", metadata);
    console.log(
      `[COPYWRITER] OK Copy generado en ${metadata.agent_timings.copywriter_ms}ms`,
    );

    // ═══════════════════════════════════════════════════
    // PARSE: Solo el output del Copywriter se parsea
    // ═══════════════════════════════════════════════════
    let strategy;
    try {
      strategy = JSON.parse(copywriterRaw);
    } catch (parseErr) {
      console.error(
        `[AgentOrchestrator] Copywriter JSON parse failed:`,
        copywriterRaw.substring(0, 200),
      );
      AgentOrchestrator._markPipelineFailed(leadId, "PIPELINE_PARSE_ERROR");
      throw new Error(
        "PIPELINE_PARSE_ERROR: El Copywriter no devolvio JSON valido.",
      );
    }

    if (!strategy.mensaje_base || !strategy.objection_tree) {
      AgentOrchestrator._markPipelineFailed(leadId, "PIPELINE_SCHEMA_ERROR");
      throw new Error(
        "PIPELINE_SCHEMA_ERROR: El JSON del Copywriter no tiene los campos requeridos.",
      );
    }

    // Mark pipeline complete
    const progress = _pipelineProgress.get(leadId);
    if (progress) {
      progress.completed_at = Date.now();
      progress.current_agent = null;
    }
    _scheduleCleanup(leadId);

    return { strategy, pipeline_metadata: metadata };
  }

  /**
   * Update progress for a specific agent.
   */
  static _updateProgress(leadId, agentName, status, metadata) {
    const progress = _pipelineProgress.get(leadId);
    if (!progress) return;

    const agent = progress.agents.find((a) => a.name === agentName);
    if (!agent) return;

    agent.status = status;
    if (status === "running") {
      agent.started_at = Date.now();
      progress.current_agent = agentName;
    }
    if (status === "done") {
      agent.completed_at = Date.now();
      agent.tokens = metadata.total_tokens;
    }
  }

  /**
   * Mark pipeline as failed in progress store.
   */
  static _markPipelineFailed(leadId, reason) {
    const progress = _pipelineProgress.get(leadId);
    if (progress) {
      progress.completed_at = Date.now();
      progress.current_agent = null;
      progress.error = reason;
    }
    _scheduleCleanup(leadId);
  }

  /**
   * Call a single agent with per-agent timeout protection.
   */
  static async _callAgent(
    agentName,
    systemPrompt,
    userMessage,
    options = {},
    metadata,
    pricing,
  ) {
    const { maxTokens = 800, jsonMode = false } = options;

    const engineInfo = await AIService.getEngine();
    const openai = engineInfo.client;

    const requestConfig = {
      model: PIPELINE_MODEL,
      temperature: 0.7,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    };

    if (jsonMode) {
      requestConfig.response_format = { type: "json_object" };
    }

    // Timeout wrapper (0 = no timeout for that agent)
    const timeoutMs = AGENT_TIMEOUTS[agentName] || 0;
    const completionPromise = openai.chat.completions.create(requestConfig);

    let completion;
    try {
      if (timeoutMs > 0) {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `AGENT_TIMEOUT: ${agentName} excedio ${timeoutMs}ms`,
                ),
              ),
            timeoutMs,
          ),
        );
        completion = await Promise.race([completionPromise, timeoutPromise]);
      } else {
        // No timeout — wait indefinitely
        completion = await completionPromise;
      }
    } catch (err) {
      console.error(`[${agentName}] FAIL ${err.message}`);
      throw err;
    }

    // Track usage per agent
    const agentTokens =
      (completion.usage?.prompt_tokens || 0) +
      (completion.usage?.completion_tokens || 0);
    const agentCost =
      ((completion.usage?.prompt_tokens || 0) / 1_000_000) * pricing.input +
      ((completion.usage?.completion_tokens || 0) / 1_000_000) * pricing.output;

    metadata.agents_used.push(agentName);
    metadata.total_tokens += agentTokens;
    metadata.total_cost_usd = parseFloat(
      (metadata.total_cost_usd + agentCost).toFixed(6),
    );

    AIService.trackUsage(completion, pricing);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error(`AGENT_EMPTY: ${agentName} devolvio respuesta vacia.`);
    }

    return content;
  }
}

export default AgentOrchestrator;
