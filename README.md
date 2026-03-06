# 🧠 Leads Pro AI: Ecosistema "Neuro-Simbólico" de Adquisición B2B

Leads Pro AI ha evolucionado de un simple scraper de Google Maps a un **CRM Inteligente con toma de decisiones autónoma**. El sistema opera bajo una arquitectura de tres motores entrelazados que buscan, auditan y atacan prospectos de forma asimétrica.

La **Versión 2.0 (MARIO V2)** introduce la consola de operaciones "War Room", retroalimentación humana (RLHF), Settings de Agencia RAG, y Venta Cruzada Dinámica (Upsells).

---

## 📑 Tabla de Contenidos

1. [Arquitectura Técnica Global](#%EF%B8%8F-1-arquitectura-t%C3%A9cnica-global)
2. [Los Tres Motores de Inteligencia](#-2-los-tres-motores-de-inteligencia-spider-vortex-mario)
3. [Novedades en MARIO V2 (War Room & RLHF)](#-3-novedades-en-mario-v2-war-room--rlhf)
4. [Flujos de Datos Principales](#-4-flujos-de-datos-principales)
5. [Configuración Inicial y Despliegue (Local Setup)](#-5-configuraci%C3%B3n-inicial-y-despliegue)
6. [Referencia de API](#-6-referencia-de-api)

---

## 🏗️ 1. Arquitectura Técnica Global

El proyecto está construido sobre un stack MERN moderno y optimizado para IA:

- **Frontend:** React + Vite, Tailwind CSS 4, Lucide Icons. Interfaz "Vantablack Cyberpunk" orientada a B2B. Clean Architecture.
- **Backend:** Node.js con Express, ESM Modules.
- **Base de Datos:** MongoDB (almacenamiento de Leads, Historial, Sesiones de Chat AI y Configuración de Agencia).
- **Vector DB:** Qdrant (Self-hosted, Docker) con dos colecciones:
  - `spider_memory`: Tácticas ganadoras (WON leads) para predicción de SPIDER V2.
  - `mario_knowledge`: Memoria RAG de leads enriquecidos y documentos PDF/TXT de la agencia.
- **Micro-servicios:** BullMQ/Redis para procesamiento asíncrono y tolerante a fallos.
- **Telemetría en Vivo:** Integración nativa de Server-Sent Events (SSE) para emitir los logs de BullMQ a la UI en tiempo real.

```text
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                      │
│  Dashboard │ War Room (MarioPanel) │ Settings (RAG Matrix)  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────▼─────────────────────────────────┐
│                       BACKEND (Express)                     │
│  AIController │ VortexController │ KnowledgeController      │
├─────────────────────────────────────────────────────────────┤
│  SERVICES LAYER                                             │
│  MarioService │ SpiderEngine │ VectorStoreService │ AIService │
├─────────────────────────────────────────────────────────────┤
│  WORKERS (BullMQ)                                           │
│  EnrichmentWorker (Vortex Pipeline) │ VisionWorker          │
└────────────┬──────────────────┬──────────────────┬──────────┘
             │                  │                  │
          MongoDB             Redis              Qdrant
```

---

## 🧠 2. Los Tres Motores de Inteligencia (SPIDER, VORTEX, MARIO)

### 🌪️ VORTEX Engine (Auditoría Técnica)

Motor asíncrono, concurrente y tolerante a fallos para el enriquecimiento automatizado.

- **Extracción Híbrida:** Usa `got-scraping` con fallback a Puppeteer Stealth.
- **Análisis de Performance:** Google PageSpeed API para LCP, TTFB y Stack Tech.
- **Vectorización:** Genera embeddings vía OpenAI y los guarda en Qdrant.
- **Deep Vision Multimodal:** Evaluación de paleta de colores y fricción UX/UI emulando un iPhone 13 frente a GPT-4o-Vision.

### 🕷️ SPIDER Engine (Triaje Simbólico)

El núcleo matemático y determinista. No alucina.

- **Disqualification Shield:** Descarta leads con ecosistemas inexpugnables (Ej: Next.js + Vercel perfecto) ahorrando tokens.
- **Vector Memory:** Analiza y busca leads ganados históricamente en Qdrant para sugerir la táctica de más alta probabilidad de conversión.
- **Motor de Fricción:** Escoge el dolor más agudo (Latencia, sin SEO, Stack viejo).

### 🤖 MARIO AI (Sales Copilot RAG)

El redactor de asimetría bélica comercial (basado en `gpt-4o-mini` o `4o`).
Lee el veredicto rígido de SPIDER y formula la estrategia en un JSON estricto (`opening_message`, `ignore_follow_up`, `favorable_response`, `objection_handling`). Su prompt depende del **Agency Profile**, inyectando el nombre del closer, oferta core de la agencia y estilo lingüístico.

---

## ⚔️ 3. Novedades en MARIO V2 (War Room & RLHF)

La versión 2.0 replantea la estructura de interacción humano-máquina:

- **Agency Settings & RAG Dropzone:** Una nueva vista centralizada (`SettingsView`) donde se configura el perfil de la agencia (Nombre, Value Proposition, Core Services) y se suben PDFs de conocimiento (Casos de estudio, Tarifarios). Todo vectorizado en Qdrant y consumido por MARIO.
- **War Room B2B (MarioPanel):** Una interfaz Cyberpunk que separa el _Resumen Estratégico_ (Arriba) de las _Tarjetas de Pipeline_ (Abajo).
- **RLHF (Reinforcement Learning from Human Feedback):** MARIO aprende de sus errores. Si el copy es malo, el usuario deja un score de 1 a 5 estrellas y un mensaje de feedback. Cuando clica en "Regenerar Estrategia", el backend inyecta los últimos 3 fallos humanos directamente en el prompt para que la IA corrija su trayectoria de inmediato.
- **Dynamic Upsell Injection:** Un botón táctico minimalista en el War Room permite al usuario inyectar un servicio secundario (Ej: _Chatbot RAG Automático_) en el copy de ventas con un solo clic. El LLM reescribe el mensaje integrando la venta cruzada usando "Beneficios de Negocio" en vez de "Jerga Técnica".
- **Zero-Data Robustness:** MARIO V2 no explota con errores 500 si la base de datos de Settings de la agencia está vacía. Emplea _Fallbacks_ lógicos y le notifica amablemente al usuario con alertas ámbar en el War Room B2B.

---

## 🔄 4. Flujos de Datos Principales

1.  **Ingesta de Leads (`/api/search`)**: Busca leads vía Google Places V1 (costo $0) con grid-search geográfico.
2.  **Triaje VORTEX (`/api/vortex/enrich/:id`)**: Se evalúa performance y SEO del lead. SPIDER decreta una táctica.
3.  **War Room (`MarioPanel`)**: El humano abre el lead. MARIO genera el copy de ventas (RAG).
4.  **Alineación (RLHF):** Si la estrategia es débil, el agente vota 1 estrella, deja feedback ("Suena muy técnico") y regenera.
5.  **Ataque Final:** El agente inyecta el Upsell Dinámico si es necesario, aprueba el copy definitivo y lo lanza vía WhatsApp / Email usando las macros dinámicas del CRM.

---

## 🚀 5. Configuración Inicial y Despliegue

### 📋 Prerrequisitos

- Node.js v18+, MongoDB local/Atlas, Docker (para Qdrant y Redis).

### 🐳 Infraestructura Local

```bash
# Levantar Qdrant y Redis
docker compose up -d
```

### 🛠️ Configuración (.env)

Variables requeridas en `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/leads_pro
OPENAI_API_KEY=tu_clave_de_openai
GOOGLE_PLACES_API_KEY=tu_clave_google

REDIS_HOST=localhost
REDIS_PORT=6379
QDRANT_URL=http://localhost:6333
VITE_API_URL=http://localhost:5000/api
```

### ⚡ Ejecución concurrente

La raíz del proyecto cuenta con los scripts para levantar ambos entornos:

```bash
# Instalar todo e iniciar backend + frontend
npm install
npm run dev
```

---

## 🔌 6. Referencia de API

- **Leads & Search:** `POST /api/search`, `PATCH /api/leads/:id/status` (Guarda en Qdrant el éxito).
- **Settings & RAG:**
  - `GET /api/settings/agency`, `PUT /api/settings/agency`
  - `POST /api/knowledge/upload` (Hashea PDFs e ingesta vectores en Qdrant).
- **AI & Vortex (V2):**
  - `GET /api/ai/spider-analysis/:id` (Ejecuta War Room y Veredicto Spider).
  - `POST /api/ai/mario/score/:id` (Feedback Humano RLHF).
  - `POST /api/ai/mario/regenerate/:id` (Regeneración inyectando Múltiples Fallos o Forzando Upsell).
  - `POST /api/vortex/deep-vision/:id` (Gatilla auditoría Multimodal iOS/Desktop UI Chrome).
