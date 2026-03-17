/**
 * MARIO V11: Multi-Agent Pipeline End-to-End Integration Test
 *
 * Tests the full pipeline lifecycle:
 *   1. Multi-Agent Pipeline (RESEARCHER → STRATEGIST → COPYWRITER)
 *   2. Output JSON schema validation (V10.4-compatible)
 *   3. Pipeline metadata persistence (version, tokens, timings)
 *   4. RLHF injection in BOTH Strategist + Copywriter
 *   5. Automatic Fallback to V10.4 when pipeline fails
 *   6. Timeout enforcement per agent
 *
 * REQUIREMENTS:
 *   - MongoDB running (uses test DB: leads_ai_test_mario_v11)
 *   - OpenAI API is MOCKED (no real calls)
 *
 * RUN:
 *   cd backend
 *   npm test -- tests/integration/MultiAgentPipeline.test.js --verbose
 */

import { jest } from "@jest/globals";
import mongoose from "mongoose";
import MarioService from "../../src/services/MarioService.js";
import Lead from "../../src/models/Lead.js";
import Settings from "../../src/models/Settings.js";
import MarioStrategy from "../../src/models/MarioStrategy.js";
import AIService from "../../src/services/AIService.js";
import VectorStoreService from "../../src/services/VectorStoreService.js";
import AIController from "../../src/controllers/AIController.js";

// ═══════════════════════════════════════════════════════════════════════════
// MOCK RESPONSES — Simulate the 3-agent chain
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_RESEARCHER_RESPONSE = `CATEGORÍA: AUTHORITY (Tiene web pero con fallos técnicos de rendimiento)
DIAGNÓSTICO DE DOLOR: La web del negocio carga demasiado lento, lo que provoca que clientes potenciales abandonen antes de ver la oferta.
VULNERABILIDAD CLAVE: Performance Score de 42/100 y TTFB de 1800ms. La web es un embudo roto.
NIVEL DE OPORTUNIDAD: ALTA — Negocio con buena reputación operativa pero infraestructura web obsoleta.
ÁNGULO COMPETITIVO: Competidores con webs más rápidas capturan el tráfico que este negocio pierde por lentitud.
RESUMEN DE REPUTACIÓN: Buena reputación en Google Maps con 4.2 estrellas y 85 reseñas. La base de clientes existe, falta el canal digital.`;

const MOCK_STRATEGIST_RESPONSE = `TARGET: AUTHORITY
RESUMEN ESTRATÉGICO: Atacar con dato concreto de velocidad de carga para demostrar la fuga de clientes. Posicionar la solución como una reparación urgente, no como un proyecto nuevo.

TIMELINE DE ATAQUE:
Paso 1: Mensaje directo por WhatsApp con dato de lentitud y consecuencia económica.
Paso 2: Aislamiento del dolor — cuántos clientes se pierden por mes por la lentitud.
Paso 3: Presentación de la variable de autoridad — el 73% de los negocios locales con web rápida duplica sus consultas.
Paso 4: Introducción de la solución — web optimizada lista en 15 días.
Paso 5: Cierre con agendamiento — propuesta sin compromiso de 15 minutos.

ÁNGULO DE DOLOR PRINCIPAL: Su web tarda más de 5 segundos en cargar y eso les cuesta entre 15 y 30 consultas mensuales que su competencia directa sí captura.
ÁNGULO DE UPSELL: N/A

ANTICIPACIÓN DE OBJECIONES:
- PRECIO: El costo de la solución es una fracción de lo que ya pierden en clientes que cierran la web sin contactar.
- TIEMPO: La implementación se hace sin frenar su operación actual, lista en 15 días hábiles.
- AUTORIDAD: Ofrecer una reunión breve de 15 minutos con datos concretos de su caso para que el decisor evalúe con toda la información.`;

const MOCK_COPYWRITER_JSON = {
  resumen_orquestacion:
    "Ataque directo por vulnerabilidad de velocidad web. El negocio pierde clientes premium porque su web tarda una eternidad en cargar.",
  core_target: "AUTHORITY",
  timeline: [
    {
      step: 1,
      action: "Mensaje directo por WhatsApp con dato de lentitud y consecuencia económica",
    },
    {
      step: 2,
      action: "Aislamiento del dolor — cuántos clientes se pierden por mes",
    },
    {
      step: 3,
      action: "Presentación de variable de autoridad — [AuthorityVariable]% de negocios optimizados duplican consultas",
    },
    {
      step: 4,
      action: "Introducción de la solución — web optimizada lista en 15 días",
    },
    {
      step: 5,
      action: "Cierre con agendamiento — propuesta sin compromiso de 15 minutos",
    },
  ],
  mensaje_base:
    '[PERSONALIZED_GREETING] En Plomería Test Pro, su web tarda más de 5 segundos en cargar desde un celular. Eso significa que por cada 10 personas que buscan su servicio en Google, al menos 6 cierran la página antes de ver su oferta y llaman a un competidor que carga más rápido. Eso son entre 15 y 30 consultas perdidas por mes. Tienen un plan para arreglar esto antes de que termine el trimestre, o es algo que se viene posponiendo?',
  mensaje_con_upsell:
    '[PERSONALIZED_GREETING] En Plomería Test Pro, su web tarda más de 5 segundos en cargar y eso equivale a regalar clientes a la competencia cada día. Una web rápida con un sistema de respuesta automática que atiende consultas las 24 horas —incluso cuando ustedes duermen— cambia la ecuación por completo. Están dispuestos a dejar de perder esos clientes, o prefieren seguir con los resultados de hoy?',
  objection_tree: {
    precio:
      "El precio no es el problema real. Lo que cuesta de verdad es seguir un mes más con una web que espanta clientes antes de que vean su oferta. La inversión se paga sola con los primeros 3 clientes que hoy se van a la competencia. Tienen un presupuesto asignado para resolver esto, o es algo que nunca se planificó?",
    tiempo:
      "La implementación se hace sin frenar la operación de su negocio. En 15 días hábiles tienen una web que retiene clientes en vez de expulsarlos. Lo que no pueden recuperar es el tiempo y los clientes que pierden cada semana que pasa. Van a darle prioridad a esto en las próximas 2 semanas, o prefieren posponerlo otro trimestre?",
    autoridad:
      "Entiendo que necesitan consultarlo. Les propongo una reunión breve de 15 minutos con datos concretos de su caso. Así el decisor tiene toda la información para evaluar sin presión. Pueden coordinar esa reunión esta semana, o necesitan más tiempo?",
  },
};

// Fallback V10.4 mock (simulates the monolithic prompt response)
const MOCK_FALLBACK_V104_JSON = {
  resumen_orquestacion: "Estrategia fallback V10.4 monolítica.",
  core_target: "AUTHORITY",
  timeline: [
    { step: 1, action: "Contacto inicial" },
    { step: 2, action: "Aislamiento" },
    { step: 3, action: "Autoridad" },
    { step: 4, action: "Solución" },
    { step: 5, action: "Cierre" },
  ],
  mensaje_base: "[PERSONALIZED_GREETING] En Plomería Test Pro, fallback message.",
  mensaje_con_upsell:
    "[PERSONALIZED_GREETING] En Plomería Test Pro, fallback upsell.",
  objection_tree: {
    precio: "Fallback precio response.",
    tiempo: "Fallback tiempo response.",
    autoridad: "Fallback autoridad response.",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

describe("MARIO V11 Multi-Agent Pipeline E2E", () => {
  let dummyLeadId;
  let strategyId;
  let mockOpenAICreate;
  let getEngineSpy;
  let vectorSearchSpy;
  let callIndex;

  const TEST_MONGO_URI = process.env.MONGODB_URI
    ? process.env.MONGODB_URI.replace(/\/[^/]+$/, "/leads_ai_test_mario_v11")
    : "mongodb://127.0.0.1:27017/leads_ai_test_mario_v11";

  // ─── SETUP ─────────────────────────────────────────────────────────────
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(TEST_MONGO_URI);
    }
    console.log(`[TEST] Connected to MongoDB: ${TEST_MONGO_URI}`);

    // Clean slate
    await Lead.deleteMany({});
    await Settings.deleteMany({});
    await MarioStrategy.deleteMany({});

    // Create test lead (AUTHORITY — has web, has performance issues)
    const lead = new Lead({
      name: "Plomería Test Pro",
      website: "https://plomeria-test.com",
      rating: 4.2,
      userRatingsTotal: 85,
      category: "plumber",
      enrichmentStatus: "completed",
      tech_stack: ["WordPress", "jQuery"],
      performance_metrics: {
        performanceScore: 42,
        ttfb: 1800,
        lcp: "3200",
        performance_issue: true,
      },
      seo_audit: {
        hasTitle: true,
        hasMetaDescription: false,
        h1Count: 1,
      },
      spider_verdict: {
        is_disqualified: false,
        reason: "NONE",
        message: null,
        technical_flaw:
          "Pérdida de autoridad por velocidad: La espera para cargar es mayor a la paciencia del cliente premium.",
        reputation_context: "Buena reputación en Google Maps, pero estándar/mejorable.",
        friction_score: "LOW",
        friction_angle: "REEMPLAZO_TOTAL",
        historical_confidence: 50,
        has_website_flag: true,
      },
      spider_memory: {
        friction_score: "LOW",
        applied_tactic: null,
        historical_confidence: 0,
        last_analyzed_at: null,
        generated_playbook: null,
      },
      vision_analysis: { ux_score: 5 },
      status: "Nuevo",
    });
    await lead.save();
    dummyLeadId = lead._id;

    // Create settings
    const settings = new Settings({
      isSingleton: true,
      agency_name: "Testing Agency V11",
      sales_rep_name: "TestBot",
      core_services: [
        {
          name: "Desarrollo Web",
          description: "Webs de alta conversión",
          ideal_for: "Negocios locales",
        },
      ],
      linguistic_behavior: "LATAM",
      mario_objection_mode: "STANDARD",
    });
    await settings.save();

    // Mock RAG vector search
    vectorSearchSpy = jest
      .spyOn(VectorStoreService, "searchSimilar")
      .mockResolvedValue([
        {
          payload: {
            text_chunk:
              "Los negocios de plomería que optimizan su web aumentan consultas un 40%.",
          },
        },
      ]);

    // Mock embeddings
    jest.spyOn(AIService, "generateEmbedding").mockResolvedValue([0.1, 0.2]);

    // Mock token tracking
    jest.spyOn(AIService, "trackUsage").mockImplementation(() => {});
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await Lead.deleteMany({});
    await Settings.deleteMany({});
    await MarioStrategy.deleteMany({});
    await mongoose.connection.close();
    console.log("[TEST] Cleanup complete.");
  });

  beforeEach(() => {
    callIndex = 0;

    // Multi-agent mock: returns different responses per call
    // Call 1 = Researcher (text), Call 2 = Strategist (text), Call 3 = Copywriter (JSON)
    mockOpenAICreate = jest.fn().mockImplementation(async (config) => {
      callIndex++;
      const usage = {
        prompt_tokens: 500 + callIndex * 100,
        completion_tokens: 200 + callIndex * 100,
      };

      if (callIndex === 1) {
        // RESEARCHER
        return {
          choices: [{ message: { content: MOCK_RESEARCHER_RESPONSE } }],
          usage,
        };
      } else if (callIndex === 2) {
        // STRATEGIST
        return {
          choices: [{ message: { content: MOCK_STRATEGIST_RESPONSE } }],
          usage,
        };
      } else if (callIndex === 3) {
        // COPYWRITER (JSON mode)
        return {
          choices: [
            {
              message: { content: JSON.stringify(MOCK_COPYWRITER_JSON) },
            },
          ],
          usage,
        };
      } else {
        // FALLBACK (4th call for fallback test)
        return {
          choices: [
            {
              message: { content: JSON.stringify(MOCK_FALLBACK_V104_JSON) },
            },
          ],
          usage,
        };
      }
    });

    getEngineSpy = jest.spyOn(AIService, "getEngine").mockResolvedValue({
      client: {
        chat: {
          completions: {
            create: mockOpenAICreate,
          },
        },
      },
      config: { active_model: "gpt-4o-mini" },
    });
  });

  afterEach(() => {
    getEngineSpy.mockRestore();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 1: Full Pipeline Happy Path
  // ═══════════════════════════════════════════════════════════════════════
  it("Test 1: El pipeline 3-agentes produce JSON V10.4-compatible y persiste metadata", async () => {
    const result = await MarioService.generateStrategy(dummyLeadId);

    // ── Schema Validation ──
    expect(result.strategy).toBeDefined();
    expect(result.strategy.resumen_orquestacion).toBeDefined();
    expect(result.strategy.core_target).toBe("AUTHORITY");
    expect(result.strategy.timeline).toHaveLength(5);
    expect(result.strategy.mensaje_base).toContain("[PERSONALIZED_GREETING]");
    expect(result.strategy.mensaje_con_upsell).toContain(
      "[PERSONALIZED_GREETING]",
    );
    expect(result.strategy.objection_tree).toHaveProperty("precio");
    expect(result.strategy.objection_tree).toHaveProperty("tiempo");
    expect(result.strategy.objection_tree).toHaveProperty("autoridad");

    // ── Objection tree must NOT contain greeting token ──
    Object.values(result.strategy.objection_tree).forEach((objection) => {
      expect(objection).not.toContain("[PERSONALIZED_GREETING]");
    });

    // ── Pipeline Metadata ──
    expect(result.pipeline_metadata).toBeDefined();
    expect(result.pipeline_metadata.version).toBe("V11_MULTI_AGENT");
    expect(result.pipeline_metadata.agents_used).toEqual([
      "RESEARCHER",
      "STRATEGIST",
      "COPYWRITER",
    ]);
    expect(result.pipeline_metadata.total_tokens).toBeGreaterThan(0);
    expect(result.pipeline_metadata.total_cost_usd).toBeGreaterThan(0);
    expect(result.pipeline_metadata.agent_timings).toHaveProperty(
      "researcher_ms",
    );
    expect(result.pipeline_metadata.agent_timings).toHaveProperty(
      "strategist_ms",
    );
    expect(result.pipeline_metadata.agent_timings).toHaveProperty(
      "copywriter_ms",
    );

    // ── OpenAI was called exactly 3 times (one per agent) ──
    expect(mockOpenAICreate).toHaveBeenCalledTimes(3);

    // ── MongoDB Persistence ──
    const savedStrategy = await MarioStrategy.findById(result.strategy_id);
    expect(savedStrategy).not.toBeNull();
    expect(savedStrategy.status).toBe("PENDING");
    expect(savedStrategy.pipeline_metadata.version).toBe("V11_MULTI_AGENT");
    expect(savedStrategy.pipeline_metadata.agents_used).toEqual([
      "RESEARCHER",
      "STRATEGIST",
      "COPYWRITER",
    ]);

    // ── Lead Updated ──
    const updatedLead = await Lead.findById(dummyLeadId);
    expect(updatedLead.tactical_response).toContain("[PERSONALIZED_GREETING]");
    expect(updatedLead.spider_memory.generated_playbook).toBeTruthy();

    // Save for next tests
    strategyId = savedStrategy._id;

    console.log(
      `[TEST 1] ✅ Pipeline V11: ${result.pipeline_metadata.total_tokens} tokens, $${result.pipeline_metadata.total_cost_usd} USD`,
    );
  }, 15000);

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 2: Agent Chain — Each agent receives prior output
  // ═══════════════════════════════════════════════════════════════════════
  it("Test 2: El Strategist recibe el briefing del Researcher, el Copywriter recibe el battle plan", async () => {
    await MarioService.generateStrategy(dummyLeadId);

    // Call 1: RESEARCHER — system prompt should contain lead data
    const researcherCall = mockOpenAICreate.mock.calls[0][0];
    const researcherSystem = researcherCall.messages.find(
      (m) => m.role === "system",
    ).content;
    expect(researcherSystem).toContain("Plomería Test Pro");
    expect(researcherSystem).toContain("ANALISTA DE DATOS COMERCIALES");
    // Researcher should NOT have json_object mode
    expect(researcherCall.response_format).toBeUndefined();

    // Call 2: STRATEGIST — system prompt should contain Researcher's briefing
    const strategistCall = mockOpenAICreate.mock.calls[1][0];
    const strategistSystem = strategistCall.messages.find(
      (m) => m.role === "system",
    ).content;
    expect(strategistSystem).toContain("CATEGORÍA: AUTHORITY");
    expect(strategistSystem).toContain("DIAGNÓSTICO DE DOLOR");
    expect(strategistSystem).toContain("DIRECTOR DE ESTRATEGIA DE VENTAS");
    // Strategist should NOT have json_object mode
    expect(strategistCall.response_format).toBeUndefined();

    // Call 3: COPYWRITER — system prompt should contain Strategist's battle plan
    const copywriterCall = mockOpenAICreate.mock.calls[2][0];
    const copywriterSystem = copywriterCall.messages.find(
      (m) => m.role === "system",
    ).content;
    expect(copywriterSystem).toContain("TARGET: AUTHORITY");
    expect(copywriterSystem).toContain("TIMELINE DE ATAQUE");
    expect(copywriterSystem).toContain("MAESTRO DE LA PERSUASIÓN");
    // ONLY Copywriter has json_object mode
    expect(copywriterCall.response_format).toEqual({ type: "json_object" });

    console.log(
      "[TEST 2] ✅ Chain validated: Researcher→Strategist→Copywriter, only Copywriter uses json_object",
    );
  }, 15000);

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 3: RLHF Injection — Both Strategist AND Copywriter receive RLHF
  // ═══════════════════════════════════════════════════════════════════════
  it("Test 3: RLHF se inyecta tanto en el Strategist como en el Copywriter", async () => {
    // First, score the existing strategy as REJECTED
    const req = {
      params: { strategyId: strategyId },
      body: {
        score: 1,
        feedback:
          "El tono es demasiado corporativo. Necesito que hable como un vendedor callejero, más agresivo.",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await AIController.scoreStrategy(req, res);
    expect(res.status).toHaveBeenCalledWith(200);

    // Verify rejection persisted
    const rejected = await MarioStrategy.findById(strategyId);
    expect(rejected.status).toBe("REJECTED");

    // Regenerate with RLHF context
    const failedStrategies = await MarioStrategy.find({
      lead_id: dummyLeadId,
      status: "REJECTED",
    })
      .sort({ generated_at: -1 })
      .limit(3);

    expect(failedStrategies.length).toBeGreaterThanOrEqual(1);

    await MarioService.generateStrategy(dummyLeadId, failedStrategies);

    // Verify RLHF in STRATEGIST prompt (call 2)
    const strategistSystem = mockOpenAICreate.mock.calls[1][0].messages.find(
      (m) => m.role === "system",
    ).content;
    expect(strategistSystem).toContain("ALERTA ROJA - CORRECCIÓN RLHF HUMANA");
    expect(strategistSystem).toContain(
      "El tono es demasiado corporativo",
    );

    // Verify RLHF in COPYWRITER prompt (call 3)
    const copywriterSystem = mockOpenAICreate.mock.calls[2][0].messages.find(
      (m) => m.role === "system",
    ).content;
    expect(copywriterSystem).toContain(
      "ALERTA ROJA - CORRECCIÓN RLHF HUMANA",
    );
    expect(copywriterSystem).toContain(
      "El tono es demasiado corporativo",
    );

    console.log(
      "[TEST 3] ✅ RLHF inyectado en Strategist Y Copywriter",
    );
  }, 15000);

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 4: Post-Processing — AuthorityVariable, Nicho, Empresa replaced
  // ═══════════════════════════════════════════════════════════════════════
  it("Test 4: Post-processing reemplaza [AuthorityVariable], [Nicho], [Empresa]", async () => {
    const result = await MarioService.generateStrategy(dummyLeadId);

    // The mock has [AuthorityVariable] in step 3 of the timeline
    const step3 = result.strategy.timeline[2];
    expect(step3.action).not.toContain("[AuthorityVariable]");
    // Should be replaced with a number between 62 and 80
    expect(step3.action).toMatch(/\d+%/);

    // No [Empresa] or [Nicho] placeholders left anywhere
    const jsonStr = JSON.stringify(result.strategy);
    expect(jsonStr).not.toContain("[AuthorityVariable]");
    expect(jsonStr).not.toContain("[Empresa]");
    expect(jsonStr).not.toContain("[Nicho]");

    console.log("[TEST 4] ✅ Post-processing variables reemplazadas correctamente");
  }, 15000);

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 5: Fallback V10.4 — Pipeline failure triggers monolithic prompt
  // ═══════════════════════════════════════════════════════════════════════
  it("Test 5: Si el pipeline multi-agente falla, el Fallback V10.4 se activa automáticamente", async () => {
    // Override mock: Researcher fails (simulating timeout or error)
    callIndex = 0;
    mockOpenAICreate.mockReset();
    mockOpenAICreate
      .mockRejectedValueOnce(
        new Error("AGENT_TIMEOUT: RESEARCHER excedió 5000ms"),
      )
      .mockResolvedValueOnce({
        // Fallback V10.4 monolithic call
        choices: [
          {
            message: { content: JSON.stringify(MOCK_FALLBACK_V104_JSON) },
          },
        ],
        usage: { prompt_tokens: 2500, completion_tokens: 1500 },
      });

    const result = await MarioService.generateStrategy(dummyLeadId);

    // ── Should produce valid output via fallback ──
    expect(result.strategy.resumen_orquestacion).toBeDefined();
    expect(result.strategy.core_target).toBe("AUTHORITY");
    expect(result.strategy.timeline).toHaveLength(5);
    expect(result.strategy.mensaje_base).toContain("[PERSONALIZED_GREETING]");

    // ── Metadata should indicate fallback ──
    expect(result.pipeline_metadata.version).toBe("V10.4_FALLBACK");
    expect(result.pipeline_metadata.agents_used).toContain("MONOLITHIC");
    expect(result.pipeline_metadata.fallback_reason).toContain(
      "RESEARCHER",
    );

    // ── MongoDB should persist fallback version ──
    const savedStrategy = await MarioStrategy.findById(result.strategy_id);
    expect(savedStrategy.pipeline_metadata.version).toBe("V10.4_FALLBACK");

    console.log(
      `[TEST 5] ✅ Fallback V10.4 activado. Razón: ${result.pipeline_metadata.fallback_reason}`,
    );
  }, 15000);

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 6: Copywriter JSON parse failure → Fallback V10.4
  // ═══════════════════════════════════════════════════════════════════════
  it("Test 6: Si el Copywriter devuelve JSON inválido, el Fallback V10.4 se activa", async () => {
    callIndex = 0;
    mockOpenAICreate.mockReset();
    mockOpenAICreate
      .mockResolvedValueOnce({
        // Researcher OK
        choices: [{ message: { content: MOCK_RESEARCHER_RESPONSE } }],
        usage: { prompt_tokens: 600, completion_tokens: 300 },
      })
      .mockResolvedValueOnce({
        // Strategist OK
        choices: [{ message: { content: MOCK_STRATEGIST_RESPONSE } }],
        usage: { prompt_tokens: 700, completion_tokens: 400 },
      })
      .mockResolvedValueOnce({
        // Copywriter returns INVALID JSON
        choices: [
          {
            message: {
              content:
                "Lo siento, no puedo generar eso. Aquí va mi intento incompleto {roto",
            },
          },
        ],
        usage: { prompt_tokens: 800, completion_tokens: 500 },
      })
      .mockResolvedValueOnce({
        // Fallback V10.4
        choices: [
          {
            message: { content: JSON.stringify(MOCK_FALLBACK_V104_JSON) },
          },
        ],
        usage: { prompt_tokens: 2500, completion_tokens: 1500 },
      });

    const result = await MarioService.generateStrategy(dummyLeadId);

    // Should succeed via fallback
    expect(result.strategy.resumen_orquestacion).toBeDefined();
    expect(result.pipeline_metadata.version).toBe("V10.4_FALLBACK");
    expect(result.pipeline_metadata.fallback_reason).toContain("PARSE_ERROR");

    console.log(
      "[TEST 6] ✅ Copywriter JSON roto → Fallback V10.4 exitoso",
    );
  }, 15000);

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 7: Model used is gpt-4o-mini for all agents
  // ═══════════════════════════════════════════════════════════════════════
  it("Test 7: Los 3 agentes usan gpt-4o-mini", async () => {
    callIndex = 0;
    mockOpenAICreate.mockReset();
    mockOpenAICreate
      .mockResolvedValueOnce({
        choices: [{ message: { content: MOCK_RESEARCHER_RESPONSE } }],
        usage: { prompt_tokens: 600, completion_tokens: 300 },
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: MOCK_STRATEGIST_RESPONSE } }],
        usage: { prompt_tokens: 700, completion_tokens: 400 },
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: { content: JSON.stringify(MOCK_COPYWRITER_JSON) },
          },
        ],
        usage: { prompt_tokens: 800, completion_tokens: 500 },
      });

    await MarioService.generateStrategy(dummyLeadId);

    // All 3 calls should use gpt-4o-mini
    for (let i = 0; i < 3; i++) {
      const callConfig = mockOpenAICreate.mock.calls[i][0];
      expect(callConfig.model).toBe("gpt-4o-mini");
    }

    console.log("[TEST 7] ✅ Los 3 agentes usan gpt-4o-mini");
  }, 15000);

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 8: LATAM constraint is passed to Copywriter
  // ═══════════════════════════════════════════════════════════════════════
  it("Test 8: La restricción LATAM se inyecta en el prompt del Copywriter", async () => {
    callIndex = 0;
    mockOpenAICreate.mockReset();
    mockOpenAICreate
      .mockResolvedValueOnce({
        choices: [{ message: { content: MOCK_RESEARCHER_RESPONSE } }],
        usage: { prompt_tokens: 600, completion_tokens: 300 },
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: MOCK_STRATEGIST_RESPONSE } }],
        usage: { prompt_tokens: 700, completion_tokens: 400 },
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: { content: JSON.stringify(MOCK_COPYWRITER_JSON) },
          },
        ],
        usage: { prompt_tokens: 800, completion_tokens: 500 },
      });

    await MarioService.generateStrategy(dummyLeadId);

    // Copywriter should have the LATAM constraint (Settings.linguistic_behavior = "LATAM")
    const copywriterSystem = mockOpenAICreate.mock.calls[2][0].messages.find(
      (m) => m.role === "system",
    ).content;
    expect(copywriterSystem).toContain("LATAM");
    expect(copywriterSystem).toContain("PROHIBIDO");

    console.log("[TEST 8] ✅ Restricción LATAM presente en Copywriter prompt");
  }, 15000);

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 9: V11 Circuit Breaker impide sobrevender (TITAN -> IMPULSE)
  // ═══════════════════════════════════════════════════════════════════════
  it("Test 9: Circuit Breaker impide que LLM decida paquetes (TITAN -> IMPULSE)", async () => {
    // Bajar el score simulando mala tech (Performance = 10, no H1, no Title)
    const badLead = await Lead.findById(dummyLeadId);
    badLead.vision_analysis.ux_score = 2;
    badLead.performance_metrics.performanceScore = 10;
    badLead.performance_metrics.ttfb = 3000;
    badLead.seo_audit.hasTitle = false;
    badLead.seo_audit.hasMetaDescription = false;
    badLead.seo_audit.h1Count = 0;
    await badLead.save();

    const settings = await Settings.findOne({ isSingleton: true });
    if (!settings.mario_core_settings) settings.mario_core_settings = {};
    settings.mario_core_settings.circuit_breaker_threshold = 80; // umbral muy alto
    await settings.save();

    const result = await MarioService.generateStrategy(badLead._id);

    // El Circuit Breaker debió activarse
    expect(result.pipeline_metadata.circuitBreaker).toBeDefined();
    expect(result.pipeline_metadata.circuitBreaker.wasDowngraded).toBe(true);
    expect(result.pipeline_metadata.circuitBreaker.authorizedOffer).toBe("IMPULSE");

    // El Strategist debió recibir IMPULSE en la inyección de táctica
    const strategistCallText = mockOpenAICreate.mock.calls[mockOpenAICreate.mock.calls.length - 2][0].messages.find(m => m.role === "system").content;
    expect(strategistCallText).toContain("OFERTA OBJETIVO AUTORIZADA POR EL CIRCUIT BREAKER: IMPULSE");

    console.log("[TEST 9] ✅ Circuit breaker bajó exitosamente la oferta a IMPULSE debido a infraestructura pobre");
  }, 15000);

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 10: V11 Payload Routing - LLM solo recibe el tono seleccionado
  // ═══════════════════════════════════════════════════════════════════════
  it("Test 10: LLM solo recibe reglas del tono seleccionado (ej. CHALLENGER)", async () => {
    const settings = await Settings.findOne({ isSingleton: true });
    if (!settings.mario_core_settings) settings.mario_core_settings = {};
    settings.mario_core_settings.default_tone = "CHALLENGER";
    settings.mario_core_settings.statistical_override_enabled = false;
    await settings.save();

    await MarioService.generateStrategy(dummyLeadId);

    const copywriterCallText = mockOpenAICreate.mock.calls[mockOpenAICreate.mock.calls.length - 1][0].messages.find(m => m.role === "system").content;

    // Debe contener la inyección de CHALLENGER (basado en tones/challenger.js)
    expect(copywriterCallText).toContain("CHALLENGER");
    // NO debe contener directivas de Consultivo ni Visionario
    expect(copywriterCallText).not.toContain("CONSULTIVO");
    expect(copywriterCallText).not.toContain("VISIONARIO");

    console.log("[TEST 10] ✅ Routing Matricial aísla correctamente el tono CHALLENGER sin contaminar el prompt");
  }, 15000);

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 11: V11 Tono Estadístico MongoDB (Override)
  // ═══════════════════════════════════════════════════════════════════════
  it("Test 11: Override estadístico selecciona el mejor tono de MongoDB", async () => {
    // Configurar override ON, default VISIONARIO
    const settings = await Settings.findOne({ isSingleton: true });
    if (!settings.mario_core_settings) settings.mario_core_settings = {};
    settings.mario_core_settings.default_tone = "VISIONARIO";
    settings.mario_core_settings.statistical_override_enabled = true;
    await settings.save();

    // Poblar leads y estrategias previas en el mismo nicho para forzar ganador CHALLENGER
    const testLead2 = new Lead({ name: "Plumber 2", category: "plumber", status: "Contactado" });
    const testLead3 = new Lead({ name: "Plumber 3", category: "plumber", status: "Contactado" });
    const lead2 = await testLead2.save();
    const lead3 = await testLead3.save();

    await (new MarioStrategy({ 
      lead_id: lead2._id, 
      strategy_data: { mensaje_base: "test" }, 
      pipeline_metadata: { nlgConfig: { appliedTone: "CHALLENGER" } } 
    })).save();
    await (new MarioStrategy({ 
      lead_id: lead3._id, 
      strategy_data: { mensaje_base: "test" }, 
      pipeline_metadata: { nlgConfig: { appliedTone: "CHALLENGER" } } 
    })).save();

    callIndex = 0;
    mockOpenAICreate.mockReset();
    mockOpenAICreate
      .mockResolvedValueOnce({
        choices: [{ message: { content: MOCK_RESEARCHER_RESPONSE } }],
        usage: { prompt_tokens: 600, completion_tokens: 300 },
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: MOCK_STRATEGIST_RESPONSE } }],
        usage: { prompt_tokens: 700, completion_tokens: 400 },
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(MOCK_COPYWRITER_JSON) } }],
        usage: { prompt_tokens: 800, completion_tokens: 500 },
      });

    const result = await MarioService.generateStrategy(dummyLeadId);

    // Aunque el default es VISIONARIO, usó CHALLENGER por la estadística
    expect(result.pipeline_metadata.nlgConfig.appliedTone).toBe("CHALLENGER");
    expect(result.pipeline_metadata.nlgConfig.isStatisticalOverride).toBe(true);
    console.log("[TEST 11] ✅ Override Estadístico de MongoDB reemplazó exitosamente el tono base");
  }, 15000);

});
