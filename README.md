# 🧠 Leads Pro AI: Ecosistema "Neuro-Simbólico" - MARIO V11.1

Leads Pro AI ha evolucionado a un **Motor de Ensamblaje Modular (MARIO V11.1)** con toma de decisiones deterministas. El sistema opera bajo la arquitectura **Router Matrix & Single Strike**, donde la inteligencia de negocio está codificada en Node.js y la IA se relega estrictamente a la **Generación de Lenguaje Natural (NLG)**.

La **Versión 11.1** perfecciona el **Routing Matricial**, introduce el **Filtro Guillotina** y unifica la salida de la IA en un solo **Mensaje Maestro**.

---

## 📑 Tabla de Contenidos

1. [Arquitectura Router Matrix & Single Strike (V11.1)](#-1-arquitectura-router-matrix--single-strike-v111)
2. [Los Tres Motores (SPIDER, VORTEX, MARIO)](#-2-los-tres-motores-spider-vortex-mario)
3. [Novedades en MARIO V11.1 (Guillotine & Single Strike)](#-3-novedades-en-mario-v111)
4. [Mitigación de Alucinaciones](#-4-mitigaci%C3%B3n-de-alucinaciones)
5. [Configuración Inicial y Despliegue](#-5-configuraci%C3%B3n-inicial-y-despliegue)

---

## 🏗️ 1. Arquitectura Router Matrix & Single Strike (V11.1)

El sistema ha abandonado el "Mega-Prompt" por un motor de orquestación determinista:

- **Frontend:** React + Vite, Tailwind CSS 4. Consola War Room con telemetría SSE y control de Pipeline.
- **Backend:** Node.js (ESM). Orquestación modular vía `enrochementWorkerAgents.js`.
- **Router Matrix:** El sistema mapea características del lead (Spider Verdict) a tácticas y ofertas *antes* de la intervención del LLM.
- **Single Strike Output:** La IA genera un único `mensaje_maestro`, eliminando la fragmentación de mensajes base/upsell para mayor impacto comercial.
- **Base de Datos:** MongoDB en Docker para persistencia y agregación estadística.
- **Vector DB:** Qdrant para memoria RAG de tácticas históricas.

```text
┌─────────────────────────────────────────────────────────────┐
│                     WAR ROOM (V11.1 UI)                     │
│  Orquestación Visual │ Router Matrix │ Single Strike Output  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              MARIO V11.1 ASSEMBLY ENGINE (Node.js)          │
│  Guillotine Filter │ Matrix Routing │ Unified Message Logic │
└─────────────┬─────────────┬──────────────┬──────────────────┘
              │             │              │
      ┌───────▼──────┐┌─────▼──────┐┌──────▼──────┐
      │  RESEARCHER  ││ STRATEGIST  ││ COPYWRITER  │
      │  (Briefing)  ││ (BattlePlan)││ (Mensaje)   │
      └──────────────┘└─────────────┘└──────────────┘
```

---

## 🌪️ 2. Los Tres Motores (SPIDER, VORTEX, MARIO)

### 🌪️ VORTEX Engine (Auditoría Técnica)
- **Deep Vision Multimodal:** Evaluación de UX/UI mediante GPT-4o-Vision.
- **Análisis de Performance:** Auditoría real de LCP/TTFB para alimentar el Circuit Breaker.

### 🕷️ SPIDER Engine (Triaje Simbólico)
- **Disqualification Shield:** Filtra prospectos inexpugnables.
- **Heuristic Prediction:** Determina el ángulo de dolor (Local Hijack, Technical Flaw, etc.).

### 🤖 MARIO V11.1 (Multi-Agent NLG)
- **Researcher:** Analiza datos crudos y genera un briefing clínico.
- **Strategist:** Define el ángulo de ataque basado en la oferta autorizada por el Router.
- **Copywriter:** Genera el **Mensaje Maestro** final bajo el tono inyectado (Challenger, Consultivo, Visionario).

---

## ⚔️ 3. Novedades en MARIO V11.1

### 🗡️ Filtro Guillotina (Automated Discarding)
Eliminación automática de leads sin fricción técnica aparente. Si el SPIDER no detecta vulnerabilidades explotables en el ecosistema digital del lead, el proceso se aborta para ahorrar recursos de IA.

### 🔌 Router Matrix (Enrutamiento Determinista)
Ya no se confía en la IA para "decidir" qué ofrecer. Node.js actúa como el cerebro comercial:
- Mapea el sector y el estado del lead a una **Táctica Específica**.
- Inyecta la **Oferta Autorizada** directamente en el payload del Strategist.

### 🎯 Single Strike (Unified Master Message)
Unificación de la comunicación en el campo `mensaje_maestro`. Esto asegura que el lead reciba una propuesta de valor coherente y directa en un solo bloque, optimizando la tasa de conversión en el primer contacto.

---

## 🛡️ 4. Mitigación de Alucinaciones
El sistema implementa medidas estrictas para leads de tipo **TIERRA_ALQUILADA** (sin sitio propio):
- **Spider Verdict Enforcement:** El Copywriter tiene prohibido inventar nombres de plataformas (Instagram, AgendaPro, etc.).
- **Generic Terminology:** Uso forzado de términos como "dependencia de terceros" o "falta de activos propios" basados estrictamente en el hallazgo del Scraper.

---

## 🚀 5. Configuración Inicial y Despliegue

### 🛠️ Configuración (.env)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/leads_pro_ai
OPENAI_API_KEY=sk-proj-xxx
QDRANT_URL=http://localhost:6333
```

### ⚡ Ejecución con Docker
El ecosistema de persistencia ahora corre bajo contenedores:
```bash
docker-compose up -d
npm run dev
```

### 🔌 Verificación
```bash
cd backend
npm test
```

