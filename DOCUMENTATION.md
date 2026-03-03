# Leads Pro AI — Documentación del Sistema

## 🏗️ Arquitectura General

El sistema se compone de **Backend (Node.js/Express)**, **Frontend (React/Vite)**, y **MongoDB** como base de datos principal, con **Supabase/pgvector** para búsqueda semántica y **BullMQ/Redis** para procesamiento asíncrono.

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND (React)                   │
│  Dashboard │ SearchView │ LeadDetails │ DataIntel    │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼───────────────────────────────┐
│                  BACKEND (Express)                    │
│  SearchController │ AIController │ VortexController   │
│  ManualLeadController │ DataIntelligenceController   │
├──────────────────────────────────────────────────────┤
│  SERVICES LAYER                                       │
│  GooglePlaces │ AIService │ GridService │ CampaignSvc│
│  ParserService │ ScraperService │ ProfilerService    │
│  ScoringService │ SpiderEngine │ SupabaseService     │
├──────────────────────────────────────────────────────┤
│  WORKERS (BullMQ)                                     │
│  EnrichmentWorker (Vortex Pipeline)                  │
├──────────────────────────────────────────────────────┤
│  MODELS (Mongoose)                                    │
│  Lead │ SearchHistory │ ApiUsage │ Settings           │
└──────────────────────────────────────────────────────┘
         │               │               │
    MongoDB         Supabase/pgvector    Redis
```

---

## 📁 Estructura de Archivos

### Backend (`/backend/src/`)

| Directorio     | Descripción                                        |
| -------------- | -------------------------------------------------- |
| `controllers/` | Endpoints REST (Search, AI, Vortex, Manual, Intel) |
| `services/`    | Lógica de negocio (Grid, Campaign, Parser, etc.)   |
| `models/`      | Schemas Mongoose (Lead, SearchHistory, ApiUsage)   |
| `workers/`     | Procesamiento async (EnrichmentWorker)             |
| `config/`      | Configuración (RAG, Spider Codex, GEO)             |
| `routes/`      | Definición de rutas API                            |

### Frontend (`/frontend/src/`)

El frontend ha sido escalado hacia una **Clean Architecture (Feature-Based)**, eliminando Single-File "God Components" a favor de dominios altamente cohesionados.

| Archivo/Directorio         | Descripción                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Dashboard.jsx`            | Panel principal (CRM orchestration)                                                                           |
| `features/`                | **Dominios Aislados (Clean Architecture)**                                                                    |
| `features/AcquisitionHub/` | Orquestador de búsquedas, Live Console y Historial (Hook Split-Brain: `useLiveSearch` & `useCampaignHistory`) |
| `features/search/`         | Componentes atómicos del formulario de búsqueda (`FormInput`, `FormSelect`, `useSearchForm`)                  |
| `features/settings/`       | Panel de configuración del sistema (`SystemSettings`, `useSystemSettings`, Zero-Axios)                        |
| `components/`              | Componentes UI puros y presentacionales (Botones, Tooltips, Sidebar, NavItems)                                |
| `components/Modals/`       | Bóveda centralizada de modales manejados por el hook genérico `useModal`                                      |
| `hooks/`                   | Hooks utilitarios globales (`useModal`, `useMetricsCalculations`)                                             |
| `services/api.js`          | Cliente Axios centralizado (Single Source of Truth para networking)                                           |

---

## 🔄 Flujo de Datos Principal

### 1. Búsqueda de Leads (Search Flow)

```
Usuario → SearchForm → POST /api/search
   ↓
SearchController.startSearch()
   ├── Crea SearchHistory (status: 'processing')
   ├── Retorna searchId al frontend (polling begins)
   └── runProcessing() en background:
       ├── [Standard Mode] → GooglePlacesService.searchPlaces()
       ├── [Grid Mode] → GridService.generateGrid() → N cells → dedup
       ├── Filtro de adquisición (phone/web required)
       ├── SpiderEngine.js (verdicts determinísticos)
       ├── ScoringService.calculateScore()
       ├── AIService.chatWithSpiderContext() → Battlecard MARIO
       └── QueueService → EnrichmentWorker (Vortex Pipeline)
```

### 2. Pipeline Vortex (Enrichment)

```
EnrichmentWorker receives job:
   ├── FASE 1: ScraperService.getRawHtml() (WAF evasion)
   ├── FASE 2: ParserService.parse() (SEO audit + markdown)
   ├── FASE 2.5: ParserService.extractContacts() (emails, phones, social)
   ├── FASE 3: ProfilerService (tech detection + performance)
   └── FASE 4: Consolidation → MongoDB + Supabase/pgvector
```

### 3. Entrada Manual de Leads

```
Usuario → ManualLeadModal → POST /api/leads/manual
   ↓
ManualLeadController.createManualLead()
   ├── Genera placeId sintético (manual_<timestamp>)
   ├── source: 'manual' | 'referido' | 'red_social' | 'evento' | 'otro'
   ├── ScoringService.calculateScore() (auto-scoring)
   └── Retorna lead con score calculado
```

---

## 🗺️ Grid Search — Expansión Geográfica

### Concepto

Google Places API tiene un límite duro de **60 resultados por query**. Grid Search divide el área de búsqueda en una grilla NxN, desplazando las coordenadas del centro de cada celda para forzar a la API a devolver resultados diferentes.

### Implementación (`GridService.js`)

```
Radio Total = R
Lado de Celda = 2R / gridSize
Radio de Celda = (lado/2) × 1.415  ← Factor √2 para cobertura 100%

Desplazamiento geodésico:
  1° latitud ≈ 111,320m (constante)
  1° longitud ≈ 111,320m × cos(latitud)
```

### Costo Estimado

| Grid | Celdas | Requests Máx | Costo Máx USD |
| ---- | ------ | ------------ | ------------- |
| 3×3  | 9      | 27           | $0.86         |
| 5×5  | 25     | 75           | $2.40         |
| 7×7  | 49     | 147          | $4.70         |

### Deduplicación

- Set local de `placeId` por sesión de Grid
- Pre-carga de placeIds existentes en DB para evitar duplicados globales

---

## 🏁 Campaign State Machine

### Estados

| Estado           | Trigger                                |
| ---------------- | -------------------------------------- |
| `nueva`          | Campaña recién creada, 0 leads tocados |
| `en_proceso`     | ≥1 lead con status ≠ "Nuevo"           |
| `en_seguimiento` | ≥30% leads en seguimiento activo       |
| `completada`     | ≥80% leads en estado terminal          |
| `archivada`      | Manual (no auto-transiciona)           |

### Evaluación Automática

`CampaignService.evaluateCampaignStatus()` se ejecuta automáticamente cada vez que se actualiza el estado de un lead desde `SearchController.updateLeadStatus()`.

---

## 📊 Data Intelligence — Tracking de APIs

### Pricing Exacto

| API                    | SKU               | Costo         |
| ---------------------- | ----------------- | ------------- |
| Google Places V1       | Text Search (Pro) | $0.032/req    |
| Google Places V1       | Free Tier         | 5,000 req/mes |
| OpenAI GPT-4o (input)  | Per token         | $2.50/1M      |
| OpenAI GPT-4o (output) | Per token         | $10.00/1M     |

### Endpoints

- `GET /api/intelligence/usage` — Resumen mensual completo con breakdown diario
- `GET /api/intelligence/alerts` — Alertas de umbral (70% free tier, $20/$50 cost)

### Esquema `ApiUsage`

```javascript
{
  month: "2026-03",
  textSearchCount: 142,
  googlePlacesCostUSD: 4.544,
  openaiCalls: 89,
  openaiTokensInput: 45000,
  openaiTokensOutput: 12000,
  openaiCostUSD: 0.2325,
  dailyBreakdown: [
    { date: "2026-03-01", googleCalls: 12, openaiCalls: 5, ... }
  ]
}
```

---

## 📞 Extracción de Contactos (Vortex Phase 2.5)

`ParserService.extractContacts(html)` analiza el HTML crudo y extrae:

| Tipo      | Método                                                  |
| --------- | ------------------------------------------------------- |
| Emails    | `mailto:` links + regex en texto visible                |
| Teléfonos | `tel:` links + regex internacional                      |
| Redes     | Instagram, Facebook, LinkedIn, Twitter, TikTok, YouTube |

Los contactos se almacenan en `lead.extracted_contacts` y se auto-asignan a `lead.email` y `lead.phoneNumber` si faltan.

---

## 🧠 Motores de IA: SpiderEngine y MARIO

### Jerarquía de Fallos Técnicos (SpiderEngine)

El sistema SPIDER evalúa a los leads basándose en un árbol de prioridades estricto para determinar el "dolor" más crítico:

1. **Latencia (LCP > 3000ms):** "la web tarda demasiado en abrir desde el celular" (Prioridad Máxima).
2. **Performance (Score < 50):** "la web funciona muy mal en celulares".
3. **Visibilidad (Sin Title):** "la web no tiene identificación para Google".
4. **SEO Estructural (Sin H1):** "Google no puede leer bien la web".

### Agregación Natural

Si un lead posee múltiples fallos técnicos, _SpiderEngine_ escoge el más grave según la jerarquía anterior y le concatena la frase literal `", y otros puntos débiles más"`. Esto evita que el LLM recite un listado robótico de problemas de servidor, forzándolo a sonar como un diagnóstico humano.

### Override de Rendimiento (Hard Override)

Si el fallo detectado es de velocidad (LCP o TTFB), _SpiderEngine_ sobreescribe dinámicamente la intención psicológica genérica del `spider_codex`, inyectando un ataque frontal sobre cómo la lentitud espanta a clientes premium hacia la competencia. MARIO queda obligado a usar este ángulo táctico en lugar del predeterminado.

### Directrices Inmutables vs. Mutables (A/B Testing)

El prompt central de MARIO (`AIService.js`) incluye directrices de **Machine Learning Heurístico**:

- **❌ Datos Inmutables:** MARIO tiene terminantemente prohibido alucinar o modificar hechos empíricos. Debe respetar la Puntuación de Google Maps, la cantidad de reseñas, la existencia de web, y la "Falla Técnica Real" (no puede decir que falta diseño si el problema es lentitud).
- **✅ Datos Mutables:** Se le otorga total libertad creativa para alterar el gancho (Hook), la agresividad del mensaje, y el enfoque de la pregunta de cierre, todo con el fin de optimizar el **Win Rate** histórico de la táctica seleccionada.

---

## 🔌 API Reference

### Búsqueda

| Método | Endpoint                  | Descripción                        |
| ------ | ------------------------- | ---------------------------------- |
| POST   | `/api/search`             | Iniciar búsqueda (standard o grid) |
| GET    | `/api/search/status/:id`  | Polling de progreso                |
| GET    | `/api/search/history`     | Historial de campañas              |
| GET    | `/api/search/history/:id` | Detalle de campaña + leads         |
| DELETE | `/api/search/history/:id` | Eliminar campaña + leads           |

### Leads

| Método | Endpoint                | Descripción           |
| ------ | ----------------------- | --------------------- |
| GET    | `/api/search/leads/:id` | Leads de una campaña  |
| PUT    | `/api/leads/:id/status` | Actualizar estado CRM |
| POST   | `/api/leads/manual`     | Crear lead manual     |
| DELETE | `/api/leads`            | Borrado masivo        |

### Vortex

| Método | Endpoint                 | Descripción                 |
| ------ | ------------------------ | --------------------------- |
| POST   | `/api/vortex/enrich/:id` | Enriquecer lead (on-demand) |
| GET    | `/api/vortex/status/:id` | Estado de enriquecimiento   |

### Intelligence

| Método | Endpoint                   | Descripción                 |
| ------ | -------------------------- | --------------------------- |
| GET    | `/api/intelligence/usage`  | Consumo API mensual + daily |
| GET    | `/api/intelligence/alerts` | Alertas de umbral           |

### AI/Chat

| Método | Endpoint            | Descripción                     |
| ------ | ------------------- | ------------------------------- |
| POST   | `/api/chat`         | Chat con AI (RAG)               |
| GET    | `/api/global-stats` | Métricas globales del dashboard |

---

## ⚙️ Variables de Entorno

```env
# APIs
GOOGLE_PLACES_API_KEY=your_key
OPENAI_API_KEY=your_key

# Database
MONGODB_URI=mongodb://localhost:27017/leads-pro
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Frontend
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Despliegue

### Desarrollo Local

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# Workers (en terminal separado)
cd backend && npm run worker
```

### Lead Schema (`Lead.js`) — Campos Principales

| Campo                  | Tipo   | Descripción                        |
| ---------------------- | ------ | ---------------------------------- |
| `name`                 | String | Nombre del negocio                 |
| `placeId`              | String | ID de Google (sparse unique)       |
| `source`               | Enum   | google_maps / manual / referido …  |
| `sourceLabel`          | String | Etiqueta extra de origen           |
| `leadOpportunityScore` | Number | Score 1-10                         |
| `status`               | String | Estado CRM                         |
| `extracted_contacts`   | Object | emails[], phones[], social_links[] |
| `battlecard`           | Object | Estrategia MARIO                   |
| `spider_verdict`       | Object | Veredicto Spider Engine            |
| `enrichmentStatus`     | String | pending/completed/failed/skipped   |

### SearchHistory Schema — Campos Grid

| Campo                | Tipo   | Descripción                       |
| -------------------- | ------ | --------------------------------- |
| `searchMode`         | Enum   | single / grid                     |
| `gridSize`           | Number | Densidad (3, 5, 7)                |
| `gridCellsCompleted` | Number | Progreso                          |
| `gridCellsTotal`     | Number | Total de celdas                   |
| `campaignStatus`     | Enum   | nueva/en_proceso/en_seguimiento/… |
