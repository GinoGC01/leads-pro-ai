import { OpenAI } from 'openai';
import ragConfig from '../config/rag.config.js';
import { GEO_LOCALIZATION } from '../config/spider_codex.js';
import Lead from '../models/Lead.js';
import ApiUsage from '../models/ApiUsage.js';
import SystemConfig from '../models/SystemConfig.js';
import { decrypt } from '../utils/encryptionVault.js';
import { LLM_PRICING } from '../config/llm_pricing.js';

// Fallback static client (used only if vault is empty)
let _fallbackClient = null;
function getFallbackClient() {
    if (!_fallbackClient && process.env.OPENAI_API_KEY) {
        _fallbackClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _fallbackClient;
}

class AIService {
    /**
     * Get the OpenAI client dynamically — vault key takes priority over .env.
     * Also returns the active SystemConfig for model/temperature.
     */
    static async getEngine() {
        const config = await SystemConfig.getInstance();

        // Resolve API key: vault first, then .env
        const vaultKey = decrypt(config.api_keys?.openai_key_encrypted);
        const activeKey = vaultKey || process.env.OPENAI_API_KEY;
        if (!activeKey) throw new Error('[AIService] No hay API Key de OpenAI configurada (ni en Vault ni en .env)');

        const client = vaultKey ? new OpenAI({ apiKey: vaultKey }) : getFallbackClient();
        if (!client) throw new Error('[AIService] No se pudo inicializar el cliente OpenAI');

        const modelName = config.ai_engine?.model_name || 'gpt-4o-mini';
        const temperature = config.ai_engine?.temperature ?? 0.7;
        const maxTokens = config.ai_engine?.max_tokens || 1500;
        const pricing = LLM_PRICING[modelName] || LLM_PRICING['gpt-4o-mini'];

        return { client, modelName, temperature, maxTokens, pricing };
    }

    /**
     * Track usage with dynamic per-model pricing.
     */
    static async trackUsage(response, pricing) {
        try {
            const promptTokens = response.usage?.prompt_tokens || 0;
            const completionTokens = response.usage?.completion_tokens || 0;
            const costUSD = ((promptTokens / 1_000_000) * pricing.input) + ((completionTokens / 1_000_000) * pricing.output);

            // Use the dynamic cost instead of static rate
            const today = new Date().toISOString().slice(0, 10);
            const usage = await ApiUsage.getCurrentMonth();
            usage.openaiCalls += 1;
            usage.openaiTokensInput += promptTokens;
            usage.openaiTokensOutput += completionTokens;
            usage.openaiTokens += (promptTokens + completionTokens);
            usage.openaiCostUSD = parseFloat((usage.openaiCostUSD + costUSD).toFixed(6));

            let dayEntry = usage.dailyBreakdown.find(d => d.date === today);
            if (!dayEntry) {
                usage.dailyBreakdown.push({ date: today, googleCalls: 0, googleCostUSD: 0, openaiCalls: 0, openaiTokens: 0, openaiCostUSD: 0 });
                dayEntry = usage.dailyBreakdown[usage.dailyBreakdown.length - 1];
            }
            dayEntry.openaiCalls += 1;
            dayEntry.openaiTokens += (promptTokens + completionTokens);
            dayEntry.openaiCostUSD = parseFloat((dayEntry.openaiCostUSD + costUSD).toFixed(6));

            usage.updatedAt = new Date();
            await usage.save();
        } catch (e) {
            console.error('[AIService] Token tracking error:', e.message);
        }
    }


    /**
     * Generate embedding vector for a piece of text
     */
    static async generateEmbedding(text) {
        try {
            const { client } = await AIService.getEngine();
            const response = await client.embeddings.create({
                model: ragConfig.vector.model,
                input: text,
                encoding_format: "float",
            });
            return response.data[0].embedding;
        } catch (err) {
            console.error('[OpenAI] Embedding Error:', err.message);
            throw err;
        }
    }

    /**
     * Chat with GPT-4o-mini using retrieved context and conversation history
     */
    static async chatWithContext(query, retrievedLeads, history = []) {
        try {
            const systemPrompt = `Eres un Closer de Ventas B2B de élite trabajando EXCLUSIVAMENTE para la agencia descrita a continuación.

            [CONTEXTO DE TU AGENCIA - TU IDENTIDAD Y OFERTA]
            ${ragConfig.agency.raw}

            Tu objetivo absoluto es analizar al prospecto y redactar comunicaciones o estrategias para VENDER LOS SERVICIOS de tu agencia. 

            REGLAS DE ORO:
            1. NO ALUCINES SERVICIOS: Solo ofrece lo que está en [CONTEXTO DE TU AGENCIA]. Si el lead tiene un problema que no resolvemos, ignora ese problema y enfócate en lo que SÍ vendemos.
            2. ALINEACIÓN ESTRATÉGICA: Usa los datos del prospecto para justificar por qué NUESTRA oferta es la solución lógica.
            3. TONO: Directo, asimétrico, experto y orientado al cierre.

            [DATOS EMPÍRICOS DEL PROSPECTO]
            ${retrievedLeads.map(l => {
                const isNoWeb = !l.website;
                if (isNoWeb) {
                    return `[ESTADO DIGITAL DEL LEAD]: INEXISTENTE. El lead no posee dominio web registrado. Solo cuenta con su presencia básica en Google Maps.
            Su reputación es de ${l.rating || 'N/A'} estrellas basada en ${l.userRatingsTotal || 0} opiniones.
            Nombre: ${l.name}
            Categoría: ${l.category || 'General'}
            Dirección: ${l.address || 'No proporcionada'}`;
                }
                return `LEAD [ID: ${l.lead_id}]: ${l.name} | Contexto Semántico: ${l.content}`;
            }).join('\n')}
            `;

            // Construct messages array with system prompt, history, and current context-aware prompt
            const messages = [
                { role: "system", content: systemPrompt },
                ...history.slice(-6).map(m => ({
                    role: m.role,
                    content: m.text || m.content // Handle both frontend and backend formats
                })),
                { role: "user", content: query }
            ];

            const { client, modelName, temperature, maxTokens, pricing } = await AIService.getEngine();

            const response = await client.chat.completions.create({
                model: modelName,
                messages: messages,
                temperature: temperature,
                max_tokens: maxTokens,
            });

            // Track with dynamic pricing
            await AIService.trackUsage(response, pricing);

            return response.choices[0].message.content;
        } catch (err) {
            console.error('[OpenAI] Chat Error:', err.message);
            throw new Error(`AI Chat Service failed: ${err.message}`);
        }
    }

    /**
     * Build Deterministic Campaign Context (Macro-RAG)
     */
    static async buildCampaignContext(campaignId) {
        try {
            const leads = await Lead.find({
                searchId: campaignId,
                enrichmentStatus: 'completed'
            }).lean();

            if (!leads || leads.length === 0) {
                return "No hay leads procesados y enriquecidos en esta campaña aún.";
            }

            const dataString = leads.map((l, index) => {
                const webStatus = l.performance_metrics?.performanceScore
                    ? `Score: ${l.performance_metrics.performanceScore}, LCP: ${l.performance_metrics.lcp || 'N/A'}`
                    : 'Desconocido';

                const seoStatus = l.seo_audit
                    ? `H1: ${l.seo_audit.h1Count || 0}, Meta: ${l.seo_audit.hasMetaDescription ? 'Sí' : 'No'}`
                    : 'Desconocido';

                const stack = l.tech_stack?.length > 0 ? l.tech_stack.join(', ') : 'Desconocido';

                return `[Nro: ${index + 1}] Nombre: ${l.name} | Score: ${l.leadOpportunityScore} | Web: ${webStatus} | SEO: ${seoStatus} | Stack: ${stack}`;
            }).join('\n');

            return dataString;
        } catch (error) {
            console.error('[AIService] Error building campaign context:', error);
            throw error;
        }
    }

    /**
     * Chat with GPT using Macro-RAG Deterministic Campaign Context
     */
    static async chatWithMacroContext(query, campaignLeadsDataString, history = []) {
        try {
            const systemPrompt = `Eres un Analista de Datos de Ventas B2B trabajando para la agencia ${ragConfig.agency.name || '[Nombre Agencia]'}.

BASE DE DATOS DE LA CAMPAÑA ACTUAL:
${campaignLeadsDataString}

REGLAS ESTRICTAS:
1. Si el usuario te pide "el mejor prospecto", "el más probable", o "el peor", DEBES elegir un NOMBRE ESPECÍFICO de la lista de arriba.
2. NUNCA des consejos genéricos o teóricos sobre "el sector". Habla SOLO de los datos empíricos que tienes en la lista.
3. Justifica tu elección basándote en el cruce entre los fallos de su web (lentitud, mal SEO, stack obsoleto) y los servicios que vende nuestra agencia.
4. Sé directo, analítico y ve al grano.`;

            const messages = [
                { role: "system", content: systemPrompt },
                ...history.slice(-6).map(m => ({
                    role: m.role,
                    content: m.text || m.content
                })),
                { role: "user", content: query }
            ];

            const { client, modelName, temperature, maxTokens, pricing } = await AIService.getEngine();

            const response = await client.chat.completions.create({
                model: modelName,
                messages: messages,
                temperature: temperature,
                max_tokens: maxTokens,
            });

            // Track with dynamic pricing
            await AIService.trackUsage(response, pricing);

            return response.choices[0].message.content;
        } catch (err) {
            console.error('[OpenAI] Macro Chat Error:', err.message);
            throw new Error(`AI Macro Chat Service failed: ${err.message}`);
        }
    }

    /**
     * Chat with GPT using Spider Deterministic Verdict (Neuro-Symbolic)
     */
    static async chatWithSpiderContext(spiderVerdict, region = 'LATAM', leadName = 'Empresa') {
        try {
            let dynamicConstraints = `
[CONTEXTO DE REPUTACIÓN EN GOOGLE MAPS]:
SPIDER ha detectado lo siguiente sobre este lead: "${spiderVerdict.reputation_context}"
DEBES incorporar esta realidad en tu argumento. NUNCA inventes que tienen "excelentes reseñas" si el reporte dice textualmente "Mala Reputación".
`;

            if (spiderVerdict.has_website_flag === false) {
                dynamicConstraints += `
[ALERTA ROJA - RESTRICCIÓN ABSOLUTA]:
ESTE LEAD NO TIENE SITIO WEB ACTUALMENTE. 
TIENES ESTRICTAMENTE PROHIBIDO:
- Mencionar "tu página actual", "tu sitio es lento", o "diseño obsoleto".
- Hablar de auditorías, tiempos de carga, o código.
TU ÚNICO ÁNGULO ES USAR LA ESTRATEGIA EXACTA DADA POR SPIDER. NO ASUMAS NADA SOBRE SU REPUTACIÓN SI NO ESTÁ EN EL VEREDICTO DE SPIDER.
`;
            } else if (spiderVerdict.is_rented_land_flag) {
                dynamicConstraints = `
[ALERTA DE TIERRA ALQUILADA]:
El cliente NO tiene web propia, usa un link genérico (ej. Linktree, AgendaPro, Instagram).
TIENES ESTRICTAMENTE PROHIBIDO:
- Hablar de tiempos de carga o de código. Su sitio genérico siempre cargará rápido porque no es de ellos.
TU ÚNICO ÁNGULO ES: Dile que mandar tráfico a un link genérico destruye su autoridad, hace que parezcan un negocio amateur frente a los clientes premium, y que le regalan sus datos y SEO a esa empresa externa.
`;
            } else {
                dynamicConstraints += `
[CONTEXTO TÉCNICO VITAL]:
El lead posee una web activa y propia. 
ATENCIÓN: Si "Falla Técnica Real del Prospecto" menciona que "la web tarda demasiado" o "funciona muy mal en celulares" (LCP o TTFB alto), ESTE ES TU ÁNGULO DE ATAQUE PRINCIPAL.
Debes usar este fallo para decirle EXPLÍCITAMENTE que su lentitud hace que la gente cierre la página y se vaya a la competencia, perdiendo clientes premium. Si menciona lentitud, ignora otros fallos menores como SEO o etiquetas.
`;
            }

            // Seleccionamos el perfil local inyectado (LATAM o EXPORT)
            const geoProfile = GEO_LOCALIZATION[region] || GEO_LOCALIZATION["LATAM"];

            const senderProfile = {
                name: ragConfig.agency.senderName,
                agency: ragConfig.agency.agencyName
            };

            const systemPrompt = `[PRINCIPIOS DE COMUNICACIÓN V10.1 - THE CHALLENGER EVOLUTION]:
1. PROHIBICIÓN DE SALUDOS: Prohibido iniciar con "Hola", "Soy [Nombre]", "Espero que estés bien".
2. TONO: Auditor Estratégico de Infraestructura. Directo, clínico, asertivo (Agencia ${senderProfile.agency}).
3. ORDEN DEL ATAQUE (MATRIZ DE IMPACTO):
   A. Premisa de Autoridad (RAG): Establece el KPI de éxito del nicho.
   B. La Variable de Fricción: Introduce la vulnerabilidad detectada por VORTEX.
   C. Traducción a Negocio: Explica el fallo en términos de pérdida de dinero/atención.
   D. El Horizonte de Exclusión: Aplicar la "Variable de Autoridad" ([AuthorityVariable]%) para mostrar la pérdida de mercado.

[DATOS INMUTABLES]:
- Región: ${region}
- Empresa: ${leadName}
- Vulnerabilidad: ${spiderVerdict.technical_flaw || 'Invisibilidad digital'}

[FORMATO DE SALIDA JSON]:
Genera un objeto JSON con estas 4 claves:
{
  "ataque_inicial": "Matrix V10.1 (A+B+C+D). Sin saludos.",
  "reaccion_ignorado": "Seguimiento clínico para reactivación.",
  "reaccion_favorable": "Aislamiento del dolor y agenda.",
  "reaccion_objecion": "Judo comercial y retirada."
}`;

            const messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Mario, por favor dame la estrategia V10.1 para este lead basada en el veredicto de SPIDER." }
            ];

            const { client, modelName, maxTokens, pricing } = await AIService.getEngine();

            const response = await client.chat.completions.create({
                model: modelName,
                messages: messages,
                temperature: 0.7,
                max_tokens: maxTokens,
                response_format: { type: "json_object" }
            });

            // Track usage
            await AIService.trackUsage(response, pricing);

            let finalContent = response.choices[0].message.content;

            // Varianza Estadística: Authority Variable (62% a 80% en V10.1)
            const baseAuthority = 62;
            const variance = Math.floor(Math.random() * 19);
            const authorityValue = baseAuthority + variance;

            if (region === 'LATAM') {
                try {
                    let parsedJson = JSON.parse(finalContent);
                    for (const key in parsedJson) {
                        if (typeof parsedJson[key] === 'string') {
                            parsedJson[key] = parsedJson[key]
                                .replace(/\[AuthorityVariable\]/g, authorityValue)
                                .replace(/\[Nicho\]/g, leadName || "su sector")
                                .replace(/\[Empresa\]/g, leadName)
                                .replace(/[¿¡:]/g, '')                    // Strip banned punctuation (LATAM Rules)
                                .replace(/<[^>]*>/g, '')                  // Strip HTML
                                .replace(/\s{2,}/g, ' ')                  // Collapse spaces
                                .trim();
                        }
                    }
                    finalContent = JSON.stringify(parsedJson);
                } catch (e) {
                    console.warn('[AIService] LATAM Post-processing Failsafe.');
                    finalContent = finalContent
                        .replace(/\[AuthorityVariable\]/g, authorityValue)
                        .replace(/\[Nicho\]/g, leadName || "su sector")
                        .replace(/\[Empresa\]/g, leadName)
                        .replace(/[¿¡:]/g, '')
                        .replace(/<[^>]*>/g, '')
                        .replace(/\[Nombre\]/gi, '');
                }
            } else {
                try {
                    let parsedJson = JSON.parse(finalContent);
                    for (const key in parsedJson) {
                        if (typeof parsedJson[key] === 'string') {
                            parsedJson[key] = parsedJson[key]
                                .replace(/\[AuthorityVariable\]/g, authorityValue)
                                .replace(/\[Nicho\]/g, leadName || "su sector")
                                .replace(/\[Empresa\]/g, leadName)
                                .trim();
                        }
                    }
                    finalContent = JSON.stringify(parsedJson);
                } catch (e) {
                    finalContent = finalContent.replace(/\[AuthorityVariable\]/g, authorityValue);
                }
            }

            return finalContent;
        } catch (error) {
            console.error('[AIService] Spider Chat Error:', error.message);
            throw new Error(`AI Spider Service failed: ${error.message}`);
        }
    }

    /**
     * Analyze UX/UI from a mobile base64 screenshot.
     */
    static async analyzeUX(base64Image, url) {
        try {
            const systemPrompt = "Eres un analista UX. Basa tu análisis estrictamente en lo que ves de esta captura móvil B2B. Si hay un botón de WhatsApp, teléfono o contacto en el header o visible, RECONÓCELO explícitamente. No inventes fricciones genéricas. Si el diseño es obsoleto o hay problemas de contraste reales indícalo. Si el sitio está bien diseñado y claro, puntúalo alto. Responde ÚNICAMENTE con un JSON válido.";
            
            const expectedJsonTemplate = `{ "ux_score_1_to_10": number, "design_era": string, "critical_frictions": string[], "sales_angle_recommendation": string }`;

            const messages = [
                { role: "system", content: systemPrompt + " Las claves del JSON deben ser extrictamente iguales a lo definido: " + expectedJsonTemplate },
                {
                    role: "user",
                    content: [
                        { type: "text", text: `Por favor analiza la pantalla inicial del dominio: ${url}` },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                                detail: "high" // Deep Vision Fix: Máxima resolución para evitar alucinaciones UI
                            }
                        }
                    ]
                }
            ];

            const { client, modelName, maxTokens, pricing } = await AIService.getEngine();
            // Fallback to explicitly supporting vision modeling if dynamic one isn't 4o based, but normally it defaults to 4o or 4o-mini
            const forceVisionModel = /^gpt-4o(-\w+)?$/.test(modelName) ? modelName : "gpt-4o-mini";

            const response = await client.chat.completions.create({
                model: forceVisionModel,
                messages: messages,
                max_tokens: 1500, // UX report shouldn't exceed
                response_format: { type: "json_object" }
            });

            await AIService.trackUsage(response, pricing);

            const content = response.choices[0].message.content;
            return JSON.parse(content);

        } catch (error) {
            console.error('[AIService] Error analyzeUX:', error.message);
            throw new Error(`AI UX Analysis failed: ${error.message}`);
        }
    }

    /**
     * RAG Gatekeeper: Evaluate document domain relevance via LLM.
     * Receives 3 strategic samples (start, center, end) and checks topical congruence.
     * Rejects Trojan Horse documents that deviate from business/tech/sales domains.
     * 
     * @param {string} sampledText - Output from DocumentProcessor.extractStrategicSamples
     * @returns {{ is_relevant: boolean, reason: string }}
     */
    static async evaluateDocumentDomain(sampledText) {
        try {
            const { client, config } = await AIService.getEngine();

            const response = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0.1,
                max_tokens: 300,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: `Eres un auditor de bases de datos corporativas. Te daré 3 fragmentos extraídos del inicio, medio y final de un documento. Debes evaluar la congruencia total.

REGLA DE ACEPTACIÓN:
Si los 3 fragmentos hablan consistentemente sobre alguno de estos temas: Ventas B2B, Estrategias Comerciales, Marketing Digital, Tecnología Web, Desarrollo de Software, SEO/SEM, CRM, Automatización, Gestión Empresarial, E-commerce, o Atención al Cliente — ACEPTA el documento.

REGLA DE RECHAZO:
Si detectas que en algún punto el tema se desvía drásticamente hacia temas completamente irrelevantes (ej. aviación, recetas de cocina, ficción literaria, historia antigua, matemáticas puras, biología, deportes) — RECHAZA el documento.

Responde EXCLUSIVAMENTE en JSON: {"is_relevant": boolean, "reason": "explicación breve de tu decisión"}`
                    },
                    {
                        role: 'user',
                        content: `Evalúa este documento:\n\n${sampledText}`
                    }
                ]
            });

            const content = response.choices[0].message.content;
            const result = JSON.parse(content);

            console.log(`[AIService] 🛡️ Document Gate: ${result.is_relevant ? '✅ ACCEPTED' : '❌ REJECTED'} — ${result.reason}`);

            return {
                is_relevant: !!result.is_relevant,
                reason: result.reason || (result.is_relevant ? 'Contenido relevante.' : 'Contenido fuera de dominio.')
            };

        } catch (error) {
            console.error(`[AIService] ⚠️ evaluateDocumentDomain error: ${error.message}`);
            // Fail-open: if LLM is unavailable, accept the document
            return { is_relevant: true, reason: 'Error en validación LLM — aceptado por defecto.' };
        }
    }
}

export default AIService;
