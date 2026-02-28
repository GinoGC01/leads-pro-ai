import { OpenAI } from 'openai';
import ragConfig from '../config/rag.config.js';
import { GEO_LOCALIZATION } from '../config/spider_codex.js';
import Lead from '../models/Lead.js';

if (!process.env.OPENAI_API_KEY) {
    console.error('CRITICAL: OPENAI_API_KEY missing in .env');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

class AIService {
    /**
     * Generate embedding vector for a piece of text
     */
    static async generateEmbedding(text) {
        try {
            const response = await openai.embeddings.create({
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

            const response = await openai.chat.completions.create({
                model: ragConfig.llm.model,
                messages: messages,
                temperature: ragConfig.llm.temperature,
                max_tokens: ragConfig.llm.max_tokens,
            });

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

            const response = await openai.chat.completions.create({
                model: ragConfig.llm.model,
                messages: messages,
                temperature: ragConfig.llm.temperature,
                max_tokens: ragConfig.llm.max_tokens,
            });

            return response.choices[0].message.content;
        } catch (err) {
            console.error('[OpenAI] Macro Chat Error:', err.message);
            throw new Error(`AI Macro Chat Service failed: ${err.message}`);
        }
    }

    /**
     * Chat with GPT using Spider Deterministic Verdict (Neuro-Symbolic)
     */
    static async chatWithSpiderContext(spiderVerdict) {
        try {
            let dynamicConstraints = "";

            if (spiderVerdict.has_website_flag === false) {
                dynamicConstraints = `
[ALERTA ROJA - RESTRICCIÓN ABSOLUTA]:
ESTE LEAD NO TIENE SITIO WEB ACTUALMENTE. 
TIENES ESTRICTAMENTE PROHIBIDO:
- Mencionar "tu página actual", "tu sitio es lento", o "diseño obsoleto".
- Hablar de auditorías, tiempos de carga, o código.
TU ÚNICO ÁNGULO ES: "Vi que tienes excelente reputación, pero al no tener página web, le estás regalando los clientes premium a tu competencia".
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
                dynamicConstraints = `
[CONTEXTO TÉCNICO]:
El lead posee una web activa y propia. Usa los datos de fricción para atacarla.
`;
            }

            // Seleccionamos LATAM por defecto para Mariosweb
            const geoProfile = GEO_LOCALIZATION["LATAM"];

            const senderProfile = {
                name: process.env.SALES_REP_NAME || "Gino",
                agency: process.env.AGENCY_NAME || "Mariosweb"
            };

            const systemPrompt = `Eres el Director de Ventas B2B de la agencia ${senderProfile.agency}.
Tu trabajo es redactar los mensajes exactos que tu socio humano, ${senderProfile.name}, copiará y enviará a los clientes.

[IDENTIDAD Y PRESENTACIÓN]:
- El remitente del mensaje es: ${senderProfile.name} de ${senderProfile.agency}.
- REGLA ESTRICTA: NUNCA firmes el mensaje abajo. NUNCA pongas "Saludos, ${senderProfile.name}" o "Atentamente, ${senderProfile.name}".
- Si la cadencia lo requiere (por ejemplo, en el Paso 1 para romper el hielo en frío), preséntate rápido al principio de forma casual. 
  ✅ Ejemplo permitido: "Hola Juan! Soy ${senderProfile.name} de ${senderProfile.agency}, vi que tienen..."
  ✅ Ejemplo plural: "Hola! Somos de ${senderProfile.agency} y armamos un reporte..."
- En el Paso 2 y Paso 3 (Seguimientos y Retirada), OMITIR la presentación por completo. Ya saben quién eres. Ve directo al grano.

[DATOS INMUTABLES DE SPIDER ENGINER]:
- Táctica Seleccionada: ${spiderVerdict.tactic_name || spiderVerdict.tactic || 'N/A'}
- Nivel de Fricción (Costo Hundido): ${spiderVerdict.friction_score || 'NO_CALCULADO'} (${spiderVerdict.friction_angle || 'N/A'})
- Confianza Histórica de esta táctica: ${spiderVerdict.historical_confidence || 0}%
- Cadencia Estructurada: ${JSON.stringify(spiderVerdict.cadence || [])}

${dynamicConstraints}

[REGLAS DE FORMATO Y REDACCIÓN - TOLERANCIA CERO]:
1. NUNCA firmes el mensaje. NUNCA uses "Saludos, Mario", ni "Atentamente". El mensaje debe terminar abruptamente en el Call to Action o pregunta final.
2. NUNCA uses "Español de Película" (ej. "lucir tu página", "atrapar clientes", "discutirlo pronto"). Habla como un empresario real en WhatsApp o en un correo rápido de 2 líneas.
3. El saludo debe ser natural y rápido. (Ej: "Hola [Nombre]!" o "Hola!").
4. A menos que conozcas al dueño, háblale a la EMPRESA en plural ("Vi que *tienen* buenas reseñas pero no *tienen* web").

[PERFIL LINGÜÍSTICO ASIGNADO]:
${geoProfile.grammar_rules}
Palabras prohibidas: ${geoProfile.banned_words.join(", ")}

[FRAMEWORK DEL ATAQUE INICIAL (PASO 1) - OBLIGATORIO]:
El primer contacto NUNCA debe ser una simple observación ("Vi que tu web es lenta" o "Vi que no tienen página"). Debe generar entusiasmo táctico y urgencia usando la fórmula "Estatus + Fuga + Disonancia":

1. ESTATUS (Elevar el ego): Empieza validando su autoridad de forma creíble. Finge que te sorprende lo buenos que son.
   (Ej: "Estaba viendo los negocios de su zona y tienen por lejos las mejores reseñas, es una locura.")
2. LA FUGA (El Cuchillo/FOMO): Traduce el fallo técnico de SPIDER a pérdida de dinero o clientes a manos de la competencia.
   (Ej: "...el tema es que al no tener una web oficial, le están dejando la mesa servida a los competidores más chicos para que se lleven a los clientes premium de Google.")
3. DISONANCIA (El Cierre): Usa una pregunta asimétrica asumiendo que es una decisión consciente.
   (Ej: "¿Tienen pensado armar algo propio para frenar esa fuga o están cómodos con el volumen de clientes que manejan hoy?")

TONO: Entusiasta, astuto, como si le estuvieras avisando de un punto ciego a un socio comercial.

[FORMATO DE SALIDA ESTRICTO - DEBES RESPONDER EN FORMATO JSON]:
Genera un objeto JSON válido con estas 4 claves exactas:
{
  "ataque_inicial": "texto",
  "reaccion_ignorado": "texto",
  "reaccion_favorable": "texto",
  "reaccion_objecion": "texto"
}
Cero markdown, cero explicaciones fuera del JSON.

[CHECKLIST DE SUPERVIVENCIA ANTES DE RESPONDER]:
Revisa tus 4 mensajes generados y aplica estas reglas de vida o muerte:

1. DESTRUCCIÓN DEL SIGNO DE APERTURA: Revisa cada frase. Si usaste el signo '¿', BÓRRALO. (Ejemplo: "Tienen un minuto?" NO "¿Tienen un minuto?").
2. PROHIBICIÓN DE VENTA EN 'REACCION_FAVORABLE': Si responden que les interesa, NO ofrezcas mostrarles nada ni digas "Genial!". Aísla al prospecto con fricción. 
   - Correcto: "Perfecto Juan. Te lo muestro en 5 min por Meet para que veas la fuga en vivo. Hoy a las 15 o mañana a las 10, qué te queda mejor?"
3. JUDO COMERCIAL EN 'REACCION_OBJECION': Si te rechazan, NUNCA digas "Aquí estoy" ni "Entiendo". Toca su ego y vete.
   - Correcto: "Perfecto. Si la agencia que tienen ya les avisó de esta fuga de clientes premium, ignoren mi mensaje. Un saludo y éxitos."
4. PALABRAS BANEADAS EN SEGUIMIENTOS: "Potencial", "Ayudar", "Discutirlo", "Me encantaría", "Espero". Si usas una de estas, el negocio quiebra.`;

            const messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Mario, por favor dame la estrategia de ataque para este lead basada en el veredicto de SPIDER que acabas de recibir." }
            ];

            const response = await openai.chat.completions.create({
                model: ragConfig.llm.model,
                messages: messages,
                temperature: 0.7, // A bit of creativity for the cold outreach
                max_tokens: ragConfig.llm.max_tokens,
                response_format: { type: "json_object" }
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('[AIService] Spider Chat Error:', error.message);
            throw new Error(`AI Spider Service failed: ${error.message}`);
        }
    }
}

export default AIService;
