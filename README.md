# 🧠 Leads Pro AI: Ecosistema "Neuro-Simbólico" - MARIO V11

Leads Pro AI ha evolucionado de un simple scraper a un **Motor de Ensamblaje Modular** con toma de decisiones deterministas. El sistema opera bajo el paradigma de **MARIO V11**, donde la inteligencia de negocio está codificada en Node.js y la IA se relega estrictamente a la **Generación de Lenguaje Natural (NLG)**.

La **Versión 11 (V11)** introduce el **Routing Matricial**, el **Circuit Breaker** matemático y el pipeline **Multi-Agente Sustitutivo**.

---

## 📑 Tabla de Contenidos

1. [Arquitectura Modular (V11)](#-1-arquitectura-modular-v11)
2. [Los Tres Motores (SPIDER, VORTEX, MARIO)](#-2-los-tres-motores-spider-vortex-mario)
3. [Novedades en MARIO V11 (Matrix Routing & Circuit Breaker)](#-3-novedades-en-mario-v11)
4. [Flujos de Datos Principales](#-4-flujos-de-datos-principales)
5. [Configuración Inicial y Despliegue](#-5-configuraci%C3%B3n-inicial-y-despliegue)

---

## 🏗️ 1. Arquitectura Modular (V11)

El sistema ha abandonado el "Mega-Prompt" por un motor de enrochement:

- **Frontend:** React + Vite, Tailwind CSS 4. Consola War Room con telemetría SSE.
- **Backend:** Node.js (ESM). Orquestación modular vía `enrochementWorkerAgents.js`.
- **Pipeline Multi-Agente:** Arquitectura secuencial: `RESEARCHER` → `STRATEGIST` → `COPYWRITER`.
- **Base de Datos:** MongoDB para persistencia de estrategias y aggregación estadística de tonos.
- **Vector DB:** Qdrant para memoria RAG de la agencia y tácticas históricas.

```text
┌─────────────────────────────────────────────────────────────┐
│                       WAR ROOM (V11 UI)                     │
│  Orquestación Visual │ Matrix Routing │ Circuit Breaker Logs │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              MARIO V11 ASSEMBLY ENGINE (Node.js)            │
│  Circuit Breaker (Math) │ Statistical Tones │ Matrix Routing │
└─────────────┬─────────────┬──────────────┬──────────────────┘
              │             │              │
      ┌───────▼──────┐┌─────▼──────┐┌──────▼──────┐
      │  RESEARCHER  ││ STRATEGIST  ││ COPYWRITER  │
      │  (Briefing)  ││ (BattlePlan)││ (NLG/Copy)  │
      └──────────────┘└─────────────┘└──────────────┘
```

---

## 🧠 2. Los Tres Motores (SPIDER, VORTEX, MARIO)

### 🌪️ VORTEX Engine (Auditoría Técnica)
- **Deep Vision Multimodal:** Evaluación de UX/UI mediante GPT-4o-Vision.
- **Análisis de Performance:** Auditoría real de LCP/TTFB para alimentar el Circuit Breaker.

### 🕷️ SPIDER Engine (Triaje Simbólico)
- **Disqualification Shield:** Filtra prospectos inexpugnables.
- **Heuristic Predicition:** Determina el ángulo de dolor (Local Hijack, Technical Flaw, etc.).

### 🤖 MARIO V11 (Multi-Agent NLG)
- **Researcher:** Analiza datos crudos y genera un briefing clínico.
- **Strategist:** Define el ángulo de ataque basado en la oferta autorizada.
- **Copywriter:** Genera el mensaje final bajo el tono inyectado (Challenger, Consultivo, Visionario).

---

## ⚔️ 3. Novedades en MARIO V11

### 🔌 Matrix Routing (Enrutamiento Modular)
Ya no se envía todo el contexto a todos los agentes. Cada sub-agente recibe solo su payload:
- **Researcher:** Reglas base + Datos Lead.
- **Strategist:** Reglas base + Táctica Específica + Oferta Autorizada.
- **Copywriter:** Reglas base + Tono Lingüístico + Restricción Geográfica.

### 🛡️ Circuit Breaker Matemático
Un motor de validación en Node.js calcula un **Investment Score (0-100)**.
- Si el score es insuficiente (infraestructura pobre), el sistema ejecuta un **Downgrade Forzado** (ej: de AUTHORITY a IMPULSE).
- Esto protege la reputación de la agencia al no ofrecer servicios que el cliente no puede asimilar.

### 📈 Statistical Tone Override
MARIO V11 no elige el tono al azar. Realiza una **Agregación en MongoDB** sobre el historial de estrategias:
- Identifica qué tono (`appliedTone`) ha tenido mejor engagement en el nicho específico del lead.
- Si hay datos suficientes, sobreescribe el tono por defecto por la variante estadística ganadora.

---

## 🚀 4. Configuración Inicial y Despliegue

### 🛠️ Configuración (.env)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/leads_pro_ai
OPENAI_API_KEY=sk-proj-xxx
QDRANT_URL=http://localhost:6333
```

### ⚡ Ejecución
```bash
npm install
npm run dev
```

---

## 🔌 5. Verificación (V11)
Para validar la integridad del pipeline multi-agente y el routing matricial:
```bash
cd backend
npm run test tests/integration/MultiAgentPipeline.test.js
```

