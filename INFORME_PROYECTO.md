# 🧠 Leads Pro AI: El Ecosistema "Neuro-Simbólico" de Adquisición B2B

Leads Pro AI ha evolucionado de un simple scraper de Google Maps a un CRM inteligente con toma de decisiones autónoma. El sistema opera bajo una arquitectura de tres motores entrelazados que buscan, auditan y atacan prospectos de forma asimétrica.

Este documento explica en profundidad el funcionamiento del núcleo, sus variables, la forma en que procesa las respuestas y su bucle de auto-aprendizaje.

---

## 🏗️ 1. Arquitectura Técnica Global

El proyecto está dividido en un stack MERN moderno:
- **Frontend:** React + Vite, Tailwind CSS, Lucide Icons, enrutamiento condicional. Interfaz tipo "Vantablack" ultraligera.
- **Backend:** Node.js con Express, ESM Modules.
- **Base de Datos:** MongoDB (almacenamiento de Leads, Historial de Búsquedas, Sesiones de Chat AI y Configuración de Agencia).
- **Telecomunicaciones:** `libphonenumber-js` para sanitización matemática de números crudos extraídos de Google Maps.

---

## 🌪️ 2. Motor VORTEX (Auditoría Asíncrona)

**Propósito:** Extraer la radiografía técnica y comercial del prospecto antes de emitir cualquier palabra.

**Flujo de Funciones:**
1. **Adquisición a Costo Cero (API V1):** Consume la Nueva Google Places API V1 (`POST /v1/places:searchText`) con un `X-Goog-FieldMask` restrictivo anclado al SKU "Basic Data" ($0.00). Extrae masivamente números nacionales y URIs de sitios web **sin caer en el problema de N+1 peticiones**.
   - **Zombie Filter Nativo:** Filtra en el mismo bucle de ingesta usando `places.businessStatus === 'OPERATIONAL'`, descartando negocios inactivos.
   - **Cuarentena Automática:** Si el negocio no tiene web ni teléfono, el lead se clasifica bajo el estado de "En Espera" para no ensuciar la base de operaciones principal.
2. **Raspado Profundo (Firecrawl):** Si el prospecto tiene un sitio web, VORTEX envía un worker en segundo plano que extrae el contenido semántico en formato Markdown para entender a qué se dedica realmente la empresa.
3. **Métricas Heurísticas (Lighthouse):** Analiza la velocidad (Core Web Vitals: LCP, TTFB), la salud del SEO (H1, Meta Titles) y la pila tecnológica subyacente (Wappalyzer: WordPress, React, Meta Pixels).

**Integridad UI:** 
Si el sitio web del prospecto bloquea el ataque de VORTEX (Firewalls, Cloudflare 403, Timeout), el frontend traduce los errores técnicos brutales (ej. `ERR_CONNECTION_REFUSED`) en mensajes humanos y degadados de forma elegante ("Acceso denegado - Firewall Activo").

---

## 🕷️ 3. Motor SPIDER (Motor de Triaje Simbólico)

**Propósito:** Procesar la data cruda de VORTEX mediante reglas lógicas puras (simbólicas) para decidir si el lead vale la pena y qué ángulo de ataque requiere.

**Variables Críticas de SPIDER:**
- `friction_score` (Nivel de Fricción): SPIDER evalúa si el lead tiene un "Costo Hundido Tech" (`HIGH`) porque acaba de gastar dinero en un React moderno, o si es un "Lienzo en Blanco" (`LOW`) porque no tiene web o usa un constructor arcaico.
- `spider_codex.js`: El cerebro de reglas. Dependiendo de la industria, SPIDER carga secuencias condicionales. 
- `cadence_structure`: En lugar de una orden estática, asigna una secuencia de ataque de varios toques (ej. Día 1: Ataque Inicial, Día 3: Seguimiento, Día 7: Ruptura).
- `historical_confidence` (Confianza Histórica): El porcentaje de éxito de la táctica seleccionada.

**Mecanismo de Aprendizaje (Fase Beta):**
SPIDER cuenta con un bucle de retroalimentación en la base de datos (MongoDB Aggregation). Cuando el equipo marca ventas ganadas o perdidas en el CRM, SPIDER recalcula la "tasa de victoria" (Win Rate) de la táctica. Si una táctica cae por debajo del 15% de efectividad, el motor automáticamente restaura su `historical_confidence` y emite una alerta ámbar indicando que "el mercado se ha inmunizado a este ángulo".

---

## 🍄 4. IA MARIO (Closer Neuro-Simbólico)

**Propósito:** MARIO es el "Actor de Voz" de la máquina. Toma el frío veredicto estructurado de SPIDER y lo convierte en palabras persuasivas usando redes neuronales (LLM - OpenAI GPT-4o), pero bajo cadenas de titanio.

**El Framework de Generación (MARIO V5.1):**
MARIO NO tiene libertad creativa. Está obligado a procesar la "Battlecard" usando formatos exactos:

1. **JSON Estricto:** MARIO siempre devuelve un objeto JSON parseable con 4 llaves:`ataque_inicial`, `reaccion_ignorado`, `reaccion_favorable`, y `reaccion_objecion`. Nunca devuelve bloques de código, garantizando que React pueda separar y renderizar "Action Cards" independientes.
2. **El "Checklist de Supervivencia":** Inyectado en el System Prompt, le prohíbe cometer errores novatos de ventas:
   - **Destrucción del Signo '¿':** Jamás inicia preguntas con '¿' para simular escritura rápida de WhatsApp informal.
   - **Tono Antisuplicante:** Prohibidas las palabras "Me ayudarías", "Espero", "Me encantaría".
   - **Judo Comercial (Reacciones a Objeciones):** Si el prospecto dice "Ya tengo agencia", MARIO responde tocando el ego, validando a la agencia rival para generar disonancia y retirándose limpiamente, negándose a suplicar atención.
   - **Anti-Doblaje (LATAM vs NA):** MARIO filtra frases de "español de película" como "lucir fantástico" o "atrapar clientes" cargando perfiles lingüísticos y prohibiciones geográficas.

---

## 🔄 5. Flujos de RAG (Retrieval-Augmented Generation)

El sistema soporta dos modos de memoria a largo plazo a través del Chat:

- **Micro-RAG (Enfoque Táctico):** Al abrir el panel lateral de un cliente específico, el chat se inyecta con la ficha biométrica, la radiografía de VORTEX y toda la estrategia aislada de ese lead.
- **Macro-RAG (Enfoque Estratégico):** En el Dashboard principal (`/dashboard?campaignId=X`), el usuario habla con el "Analista Financiero". El Backend extrae los últimos cientos de leads procesados, sus estados de victoria, la inversión total y agrupa la información. La IA responde a nivel corporativo ("El nicho de odontología generó 3 cierres ganados, sugiero escalar en la zona Norte").

El Sistema REST mapea el contexto en tiempo real. Todas las sesiones son persistentes en MongoDB y permiten a los vendedores retomar conversaciones tácticas de días anteriores sin perder de vista los datos heurísticos.

---

## 🚀 6. Operatividad y Ejecución (La "Última Milla")

La inteligencia no sirve si hay fricción en la ejecución.

Por eso, el Frontend intercepta la estrategia JSON de MARIO y despliega una interfaz premium en el `LeadDetailsPanel`:
1. **Accionables Condicionales:** El botón "Enviar WhatsApp" dispara una URL `wa.me` dinámica que inyecta automáticamente el texto de la IA en la aplicación móvil o web. El botón de Correo inyecta un enlace `mailto`.
2. **Sanitización Matemática:** Gracias a `libphonenumber-js`, los números en formatos locales corruptos como `011 15-4321-9876` son esterilizados a identificaciones universales (ej. `5491143219876`). Si el teléfono es inválido o el prospecto no posée uno, el sistema deshabilita visualmente los botones impidiendo fallos operativos en caliente.

El resultado es una **"Batlecard de Mando"** donde el agente humano se vuelve 100 veces más destructivo y certero; MARIO piensa, SPIDER clasifica, VORTEX investiga, y el humano solo da clics calificados.
