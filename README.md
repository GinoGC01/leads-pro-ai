# 🧠 Leads Pro AI: Ecosistema "Neuro-Simbólico" de Adquisición B2B

Leads Pro AI ha evolucionado de un simple scraper de Google Maps a un **CRM Inteligente con toma de decisiones autónoma**. El sistema opera bajo una arquitectura de tres motores entrelazados que buscan, auditan y atacan prospectos de forma asimétrica.

Este documento consolida toda la documentación técnica, arquitectónica, operativa y de configuración del proyecto.

---

## 📑 Tabla de Contenidos

1. [Arquitectura Técnica Global](#%EF%B8%8F-1-arquitectura-t%C3%A9cnica-global)
2. [Los Tres Motores de Inteligencia](#-2-los-tres-motores-de-inteligencia-spider-vortex-mario)
   - [VORTEX Engine (Auditoría Técnica)](#%EF%B8%8F-vortex-engine-auditor%C3%ADa-t%C3%A9cnica)
   - [SPIDER Engine (Triaje Simbólico)](#%EF%B8%8F-spider-engine-triaje-simb%C3%B3lico)
   - [MARIO AI (Closer RAG)](#-mario-ai-closer-rag)
3. [Flujos de Datos Principales](#-3-flujos-de-datos-principales)
4. [Manual de Operaciones y CRM](#-4-manual-de-operaciones-y-crm)
5. [Configuración Inicial y Despliegue (Local Setup)](#-5-configuraci%C3%B3n-inicial-y-despliegue)
6. [Configuración de Google Cloud API](#-6-configuraci%C3%B3n-de-google-cloud-api)
7. [Referencia de API](#-7-referencia-de-api)

---

## 🏗️ 1. Arquitectura Técnica Global

El proyecto está dividido en un stack MERN moderno:

- **Frontend:** React + Vite, Tailwind CSS, Lucide Icons. Interfaz "Vantablack" ultraligera. Clean Architecture (Feature-Based).
- **Backend:** Node.js con Express, ESM Modules.
- **Base de Datos:** MongoDB (almacenamiento de Leads, Historial, Sesiones de Chat AI y Configuración).
- **Vector DB (RAG):** Supabase/pgvector para búsqueda semántica y RAG de MARIO.
- **Vector DB (SPIDER):** Qdrant (Self-hosted, Docker) para memoria vectorial de tácticas comerciales ganadoras.
- **Micro-servicios:** BullMQ/Redis para procesamiento asíncrono y tolerante a fallos, implementando un bus de eventos en la nube para streaming en vivo.
- **Telecomunicaciones:** `libphonenumber-js` para sanitización matemática estricta de números de teléfono (formato E.164, rechazo de basura y duplicados).
- **Telemetría en Vivo:** Integración nativa de Server-Sent Events (SSE) para emitir los logs asíncronos de BullMQ directamente a una consola "Vantablack" (Mac-Style) en el cliente.
- **Testing:** Jest + Supertest + cross-env para pruebas de integración ESM en Windows.

```text
┌──────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
│  Dashboard │ SearchView │ LeadDetails │ DataIntel    │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼───────────────────────────────┐
│                  BACKEND (Express)                   │
│  SearchController │ AIController │ VortexController  │
│  ManualLeadController │ DataIntelligenceController   │
├──────────────────────────────────────────────────────┤
│  SERVICES LAYER                                      │
│  GooglePlaces │ AIService │ GridService │ CampaignSvc│
│  ParserService │ ScraperService │ ProfilerService    │
│  ScoringService │ SpiderEngine │ SupabaseService     │
│  VectorStoreService (Qdrant)                         │
├──────────────────────────────────────────────────────┤
│  WORKERS (BullMQ)                                    │
│  EnrichmentWorker (Vortex Pipeline + SPIDER V2)      │
│  VisionWorker (Deep Vision Multimodal)               │
├──────────────────────────────────────────────────────┤
│  MODELS (Mongoose)                                   │
│  Lead │ SearchHistory │ ApiUsage │ Settings          │
└──────────────────────────────────────────────────────┘
       │                 │           │           │
    MongoDB       Supabase/pgvector  Redis     Qdrant
```

---

## 🧠 2. Los Tres Motores de Inteligencia (SPIDER, VORTEX, MARIO)

### 🌪️ VORTEX Engine (Auditoría Técnica)

**Propósito:** Motor asíncrono, concurrente (BullMQ/Redis) y tolerante a fallos para el enriquecimiento automatizado. Ingiere el lead crudo de Google y le inyecta metadatos técnicos.

- **FASE 1: Evasión WAF y Extracción Base:** Usa `got-scraping` para bypassear barreras. Si falla (Cloudflare 403, etc.), hace fallback a Puppeteer Stealth (Chromium headless) bloqueando CSS/Imágenes para ahorrar RAM.
- **FASE 2: Sanitización de Datos Crudos:** Verifica SEO básico (H1, meta descriptions). Extrae contactos y plica filtros de limpieza y deduplicación profunda (ignorando fechas, píxeles o IPs capturadas erróneamente en el HTML).
- **FASE 3: Análisis de Performance:** Llama a Google PageSpeed API para medir LCP y TTFB. Usa regex y firmas para descubrir el Tech Stack (WordPress, Wix, React).
- **🛡️ SPIDER INTERCEPT (entre FASE 3 y 4):** Antes de gastar tokens de OpenAI, `SpiderEngine.evaluateViability()` analiza si el lead posee infraestructura enterprise inexpugnable (Next.js + Vercel, React + AWS, etc.). Si 2+ tecnologías enterprise se detectan con un Lighthouse Score >85 y TTFB <400ms, el lead se marca como `disqualified` con `reason: DISCARD_PERFECT` y el pipeline se detiene. El frontend renderiza una tarjeta ámbar de "SPIDER Shield".
- **FASE 4: Vectorización Híbrida:** Llama a `text-embedding-3-small` de OpenAI y guarda un resumen técnico en Supabase (pgvector) para memoria semántica de RAG.
- **FASE 5: SPIDER V2 — Predicción de Táctica (READ-ONLY):** Genera un embedding del contexto comercial del lead, consulta Qdrant buscando leads ganados similares (status: `WON`), y predice la mejor táctica. Triple fallback: Qdrant → Heurístico → Emergencia. El embedding se guarda en MongoDB (`spider_context_vector`) para ingesta diferida.

**Nivel 2: DEEP VISION (Auditoría Multimodal Avanzada)**
Si el usuario lo requiere (o si la automatización lo exige), VORTEX lanza un segundo worker que implementa:

1. **Fotografía B2B Headless**: Instancia Puppeteer, emula un iPhone 13, inyecta pausas deliberadas (3 segundos) para purgar alucinaciones de frameworks "Asíncronos" y captura la página en formato JPEG optimizado.
2. **Evaluación Estructural de Conversión**: Analiza paleta de colores, ubicaciones de CTAs, contraste y fricción de UX/UI mediante GPT-4o Multimodal. Redacta vulnerabilidades comprobables.

_(Toda la actividad en el VORTEX Engine emite streams asíncronos al Frontend utilizando SSE: `job.updateProgress()` es volcado en real-time al usuario, suplantando los fallidos bucles de "Polling")._

### 🕷️ SPIDER Engine (Triaje Simbólico)

**Propósito:** El núcleo lógico y determinista. No alucina; aplica matemáticas y reglas crudas para escupir un Veredicto que la IA debe obedecer. Depende al 100% de la visión de VORTEX.

#### V1: Disqualification Shield (Filtro de Rentabilidad)

- **Viability Gate (`evaluateViability`):** Antes de la vectorización, SPIDER analiza el tech stack contra una lista de tecnologías enterprise (Next.js, Nuxt, Gatsby, React, Vercel, AWS, Docker, Kubernetes, GraphQL, etc.). Si detecta 2+ tecnologías enterprise con rendimiento excepcional (Lighthouse >85, TTFB <400ms), o 3+ tecnologías enterprise sin importar performance, el lead se marca como `DISCARD_PERFECT` y el pipeline aborta. El frontend muestra una tarjeta ámbar con el veredicto.
- **Rented Land Detection:** Dominios de tierra alquilada (linktr.ee, instagram.com, calendly.com, etc.) se detectan pre-pipeline y el lead se salta sin consumir recursos.

#### V2: Vector Memory (Qdrant — Aprendizaje por Éxito)

- **`generateLeadContext(lead)`:** Genera un string semántico con nicho, tech stack, performance, fricción y UX score del lead.
- **`predictTactic(lead)`:** Orquestador principal:
  1. Genera embedding vía `AIService.generateEmbedding()` (text-embedding-3-small, 1536D).
  2. Consulta Qdrant (READ-ONLY) filtrando por `status: WON`.
  3. Si hay resultados: retorna la táctica más frecuente entre los ganadores (frequency analysis).
  4. Fallback: usa el heurístico determinista `analyzeLead()`.
  5. Guarda el embedding en MongoDB (`spider_context_vector`) para ingesta diferida.
- **Deferred Ingestion (`_ingestWonLeadToQdrant`):** Cuando un lead se marca como `Cerrado Ganado` en el CRM, el `SearchController` lee el `spider_context_vector` de MongoDB y lo upserta en Qdrant con payload `{ status: 'WON', tactic, niche }`. **Esta es la ÚNICA función autorizada para escribir en Qdrant.**
- **Resilience:** Si Qdrant está caído, el pipeline continúa normalmente usando el fallback heurístico. Ningún fallo de Qdrant bloquea VORTEX.

#### Reglas Clásicas

- **El Códice de Nichos:** Mapea industrias (Tiers). Tier 1 (High Ticket) receta "Software a Medida", Tier 2 (Locales) receta "Web + SEO", Tier 3 se filtran como `NO-GO`.
- **Motor de Fricción (Costo Hundido):** Si VORTEX detecta React o AWS, SPIDER deduce "Fricción Alta" (gastó mucho, la táctica cambia a "Auditoría"). Si detecta Wix o ausencia de web, la "Fricción Baja" indica quemar y rehacer completo o `NO_WEB_FOMO`.
- **Jerarquía de Fallos Técnicos:** 1. Latencia Móvil (>3s) 2. Performance (<50) 3. Sin Identificación (Meta Titles) 4. Sin SEO Estructural. Escoge el peor para atacar.
- **Machine Learning Heurístico:** Revisa MongoDB. Si una táctica sugerida tiene un _Win Rate_ < 15% histórico, SPIDER muta espontáneamente y sugiere un servicio contingente/secundario en su lugar.

### 🤖 MARIO AI (Closer RAG)

**Propósito:** El actor de voz (OpenAI `gpt-4o-mini` u `4o`). Lee el veredicto rígido de SPIDER y redacta el armamento de ventas humano usando RAG (Retrieval-Augmented Generation).

- **Nano Banana Context:** Identidad estricta y editable de tu agencia que impide que MARIO ofrezca servicios irreales.
- **El Framework de Cuatro Puntas (JSON Estricto):** Genera 4 tácticas secuenciales:
  1. _Ataque Inicial_: Dolor técnico y pregunta asimétrica.
  2. _Reacción Ignorado_: Prueba empírica a las 48hs.
  3. _Reacción Favorable_: Elevación instantánea a Call (Zoom/Meet), prohibido vender por chat.
  4. _Reacción Objeción (Judo Comercial)_: Retirada cortés validando rivales para generar disonancia cognitiva.
- **Modos de RAG:**
  - **Micro-RAG:** Mirada a lead individual (Lighhouse Score, Mongoose, Supabase document extraction).
  - **Macro-RAG:** Rol de "Analista de Campaña". Lee cientos de leads a la vez, se le restringe para no alucinar clientes, devolviendo un análisis estratégico táctico a nivel de dashboard.

### 🛣️ Roadmap V2.0: La Transición al Ecosistema Neuro-Simbólico

Actualmente, Leads Pro AI es un motor experto altamente eficiente. Sin embargo, los mercados B2B se saturan rápido. Si todos usan el mismo argumento de venta, el prospecto deja de responder.
Para la versión 2.0, el sistema evolucionará de ser una máquina de "causa y efecto" a un organismo adaptativo.

Aquí detallamos hacia dónde vamos, por qué es imperativo a nivel de negocio, y cómo funcionará en la práctica.

#### 👁️ 1. [VORTEX] Análisis de Visión Multimodal (Pixel Parsing)

**Hacia dónde vamos:** VORTEX dejará de leer únicamente el código fuente (DOM/HTML) y comenzará a "ver" la página web como lo hace un humano. Usaremos navegadores Headless para tomar capturas de pantalla de la versión móvil y de escritorio, pasándolas por modelos multimodales (como gpt-4o-vision).

**El Por Qué (Business Case):** El código no cuenta toda la historia. Un sitio web puede tener un código perfecto y cargar en 1 segundo (Lighthouse Score de 99), pero si su diseño parece de 1998, los colores lastiman la vista o los botones están superpuestos en el celular, el prospecto está perdiendo clientes. Vender "mejora de código" es técnico; vender "tu cliente no puede hacer clic en comprar" es visceral.

**Ejemplo Práctico:**

- **VORTEX V1 (Actual):** "El sitio usa WordPress. El LCP es de 1.2s. No hay errores graves." -> SPIDER se queda sin munición.
- **VORTEX V2 (Multimodal):** Toma un screenshot. La IA detecta que el banner principal tapa el número de teléfono en la versión móvil y que la paleta de colores carece de contraste.
- **Táctica Generada:** "Hola [Nombre], entré a tu web desde mi iPhone y noté que el menú flotante está tapando el botón de WhatsApp. Tienes un embudo roto ahí..."

#### ⚖️ 2. [SPIDER] Inferencia Bayesiana y Feedback Loops

**Hacia dónde vamos:** SPIDER reemplazará sus árboles de decisión estáticos (if/else) por un motor de probabilidad matemática. Se conectará directamente a los estados del tablero Kanban del CRM. Cada vez que muevas un lead a "Cerrado Ganado" o "Perdido", SPIDER actualizará los pesos matemáticos de las tácticas que recomendó.

**El Por Qué (Business Case):** Los nichos sufren de "ceguera de marketing". Si durante 6 meses le vendes "Velocidad de Carga" a las clínicas dentales, eventualmente todos los dentistas ignorarán ese correo. El sistema necesita darse cuenta por sí solo de que una táctica dejó de funcionar y pivotar hacia un ángulo nuevo sin intervención humana.

**Ejemplo Práctico:**

- **Escenario:** SPIDER recomienda usar el ángulo "Falta de SEO" para 100 plomeros.
- **Feedback:** Cierras 0 ventas. Tasa de conversión: 0%.
- **Adaptación Bayesiana:** El sistema degrada la probabilidad de éxito de "SEO para Plomeros". Para los siguientes 100 plomeros, SPIDER analiza los datos y nota que la táctica "Automatización de WhatsApp" tuvo un 12% de éxito en el pasado. Muta la estrategia global y le ordena a MARIO que empiece a vender automatización en lugar de SEO a ese nicho específico.

#### 🤺 3. [MARIO] Arquitectura Multi-Agente (Agentic Reflection)

**Hacia dónde vamos:** MARIO dejará de ser un solo prompt escupiendo texto. Implementaremos un flujo de trabajo "Adversarial" (Multi-Agente). Cuando se requiera un guion de ventas, el sistema instanciará tres IA separadas en el backend que debatirán antes de mostrarte el resultado.

**El Por Qué (Business Case):** Los Modelos de Lenguaje Grandes (LLMs) son complacientes por naturaleza. Suelen usar palabras pomposas ("sinergia", "potenciar", "en la era digital") que los delatan instantáneamente como Inteligencia Artificial, arruinando la confianza B2B. Necesitamos un agente "Crítico" que filtre esa basura corporativa.

**Ejemplo Práctico:**

- **Paso 1 (El Redactor):** Genera el borrador inicial. "Espero que este correo te encuentre bien. Somos una agencia líder y queremos potenciar tu embudo digital..."
- **Paso 2 (El Crítico):** Evalúa el borrador contra el Códice de la agencia. "Rechazado. Suena a bot de spam genérico. Estás usando la palabra 'potenciar'. Borra el saludo inicial, ve directo al dolor técnico del TTFB que encontró VORTEX y usa un tono casual de un solo párrafo."
- **Paso 3 (El Editor):** Reescribe el texto final. "Vi que tu sitio tarda 4 segundos en responder el primer byte. Con la pauta que estás pagando en Google, estás tirando clics a la basura. ¿Lo revisaron tus desarrolladores?"
- **Resultado:** Un mensaje asimétrico, clínico e imposible de distinguir de un humano experto.

---

## 🔄 3. Flujos de Datos Principales

### Búsqueda Nominal y Grid Search

1.  **POST `/api/search`**: Se lanza búsqueda. Retorna un ID para polling.
2.  **Google Places V1 API**: Extrae a costo $0 con FieldMasks restrictivos (Solo status operational, websites y phones).
3.  **Grid Search (Expansión)**: Mueve las coordenadas en malla NxN para evadir el límite de 60 resultados de Google API. Multiplica la adquisición.
4.  **Higiene**: Deduplicación por dominio, filtro de dominios de parqueo (Sinkhole Detections).
5.  **Data Intelligence**: El sistema rastrea cuántos USD (Costo Semanal) ha incurrido contra el free tier de Google ($200) y OpenAI.

### Ciclo de Mando (LeadDetails)

El usuario abre un Lead de la tabla:

1. MARIO lee el Veredicto SPIDER en el backend, genera JSON y el frontend renderiza la `Battlecard`.
2. Las Action Cards inyectan un link dinámico de `wa.me/` (habiendo antes sanitizado matemáticamente con `libphonenumber-js`).
3. El Agente Humano hace click y envía la artillería en 1 segundo.
4. Si los metadatos o las capturas están desfasadas por la latencia, el humano usa el protocolo **Hard Reset**, purgando el Lead y reencolando las 4 fases técnicas desde cero mediante telemetría SSE en vivo, emitiendo un JobID inmutable.

---

## 🎯 4. Manual de Operaciones y CRM

El CRM opera bajo un pipeline estricto de estatus. La transición alimenta a la telemetría global (Velocity Pipeline, Win Rates de SPIDER, ROI).

1.  **Nuevo**: Recién escaneado, 0 interacciones. VORTEX procesó de fondo, SPIDER dio veredicto.
2.  **Contactado**: El Humano hizo click en un Macro-Botón táctico. Este cambio inyecta volumen saliente al Dashboard de Finanzas y diluye el costo contable.
3.  **Gestión de la Respuesta (Routing MARIO):**
    - Si ignoran → Macro: Empuje Asimétrico de 48hs.
    - Si aceptan → Macro: Aislamiento (Meeting/Agenda).
    - Si objetan → Macro: Judo de Reversión.
4.  **Estados Terminales/Inflexión:**
    - **Cita Agendada / Propuesta Enviada:** Éxito en la penetración inicial.
    - **En Espera:** Dilatación corporativa prolongada. (Mueve Leads de "No Phone/No Web").
    - **Descartados / Perdido:** Fallo financiero o mortalidad del Lead.
    - **Cerrado Ganado:** Éxito económico B2B.

---

## 🚀 5. Configuración Inicial y Despliegue

### 📋 Prerrequisitos

- **Node.js v18+**, **MongoDB** local o Atlas, **Docker** (para Qdrant y Redis), **Cuenta OpenAI**, **Proyecto Supabase**.

### 🐳 Infraestructura Docker

El proyecto incluye un `docker-compose.yml` que levanta Qdrant (memoria vectorial de SPIDER) y Redis (BullMQ) con persistencia:

```bash
# Levantar infraestructura (desde la raíz del proyecto)
docker compose up -d

# Verificar contenedores
docker ps
# Esperado: spider_qdrant (puerto 6333) + spider_redis (puerto 6379)
```

### 🛠️ Instalación de Dependencias

```bash
npm run install-all
```

### 🔑 Configuración del Entorno (.env)

En `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tu_db
GOOGLE_PLACES_API_KEY=tu_google_api_key

# --- AI & RAG CONFIGURATION ---
OPENAI_API_KEY=tu_clave_de_openai
SUPABASE_URL=tu_url_de_supabase
SUPABASE_ANON_KEY=tu_clave_anon_de_supabase

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Qdrant (SPIDER V2 Vector Memory)
QDRANT_URL=http://localhost:6333

# Frontend
VITE_API_URL=http://localhost:5000/api
```

### 💾 Preparación de Supabase (SQL Editor)

```sql
create extension if not exists vector;

create table if not exists business_leads (
  id uuid primary key default gen_random_uuid(),
  lead_id text unique not null,
  name text not null,
  metadata jsonb default '{}'::jsonb,
  content text not null,
  embedding vector(1536) not null
);

create index on business_leads using hnsw (embedding vector_cosine_ops)
with (m = 16, ef_construction = 64);

create or replace function match_leads (
  query_embedding vector(1536), match_threshold float, match_count int
)
returns table (id uuid, lead_id text, name text, content text, metadata jsonb, similarity float)
language plpgsql as $$
begin
  return query
  select bl.id, bl.lead_id, bl.name, bl.content, bl.metadata, 1 - (bl.embedding <=> query_embedding) as similarity
  from business_leads bl
  where 1 - (bl.embedding <=> query_embedding) > match_threshold
  order by bl.embedding <=> query_embedding limit match_count;
end;
$$;
```

### ⚡ Ejecución

```bash
# 1. Levantar infraestructura (Qdrant + Redis)
docker compose up -d

# 2. Desarrollo (Frontend + Backend concurrente)
npm run dev

# 3. Ejecución Manual de los 3 procesos
cd backend && npm run dev
cd backend && node src/workers/EnrichmentWorker.js
cd frontend && npm run dev

# 4. Tests de integración (SPIDER Vector Loop)
cd backend && npm run test -- --forceExit tests/integration/SpiderVectorLoop.test.js
```

---

## 🌍 6. Configuración de Google Cloud API

1.  Consola Google Cloud → "Proyecto nuevo".
2.  Habilitar **Places API (New)** y **Geocoding API**.
3.  Credenciales → Clave de API → **Restringir** la llave solo a esas APIs.
4.  Activar Facturación (Free tier $200 USD).

---

## 🔌 7. Referencia de API

El backend usa un **3-Tier Modular Monolith** de Clean Architecture en varios dominios (Routes → Controller → UseCases/Services).

- **Search:**
  - `POST /api/search` (Líder principal de ingestión, transacción Mongoose segura)
  - `GET /api/history`
  - `DELETE /api/history/:id`
- **Leads / CRM:**
  - `PATCH /api/leads/:id/status` (Trigger automágico de estado de campaña + **ingesta Qdrant** al marcar `Cerrado Ganado`)
  - `POST /api/leads/manual`
  - `DELETE /api/leads`
- **Data Intelligence (Billing/Usage):**
  - `GET /api/intelligence/usage`
  - `GET /api/stats` (Métricas globales)
- **AI & Vortex:**
  - `POST /api/ai/chat` (Flujo RAG de MARIO)
  - `POST /api/vortex/enrich/:id` (Pipeline de 5 fases: Scrape → Parse → Profile → **SPIDER Gate** → Vectorize + **SPIDER V2 Predict**)
  - `POST /api/vortex/deep-vision/:id` (Trigger Nivel 2 Multimodal)
  - `POST /api/vortex/reset/:id` (Hard Reset Engine)
  - `GET /api/vortex/status/:id`
  - `GET /api/vortex/stream/:jobId` (EventSource API con anti-buffering de proxies)
