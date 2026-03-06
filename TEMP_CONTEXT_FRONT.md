# 🖥️ Arquitectura Frontend: Leads Pro AI (V2)

Este documento detalla exhaustivamente la estructura, tecnologías y flujos lógicos del frontend basado en React para el sistema "Leads Pro AI".

## 🛠️ Tecnologías Core (Stack)

- **Framework Principal:** React 19.2 (usando hooks modernos y componentes funcionales).
- **Bundler & Dev Server:** Vite 7.3 (ultra-rápido, configurado con soporte ESM nativo).
- **Estilos:** TailwindCSS 4.2 (Vía `@tailwindcss/postcss`). Estilos globales ubicados en `index.css`. Manejo de utilidades dinámicas con `clsx` y `tailwind-merge`.
- **Enrutamiento:** React Router DOM 7.13 (usando `<BrowserRouter>` y `<Routes>` en `App.jsx`).
- **Peticiones HTTP:** Axios 1.13 con un interceptor global para manejar respuestas y errores de red.
- **Iconografía:** Lucide React (Sistema de íconos SVG limpios y ligeros).
- **Gráficos & Métricas:** Recharts 3.7.
- **Validación Telefónica (Client-Side):** `libphonenumber-js`.
- **Notificaciones UI:** `react-hot-toast` para manejo de alertas y pop-ups.
- **Renderizado Markdown:** `react-markdown` (Usado intensivamente para parsear respuestas tácticas de MARIO AI).

---

## 📂 Estructura de Directorios

El código reside en `frontend/src/` y está estructurado en torno a _Features_ y _Components_:

```text
frontend/src/
├── features/
│   └── AcquisitionHub/        # Nuevo buscador avanzado e ingesta masiva (Google Places).
├── components/
│   ├── LeadDetails/           # "La Battlecard" - Inspector detallado del prospecto.
│   │   ├── LeadDetailsPanel.jsx  # Contenedor principal volador/modal.
│   │   └── components/        # Submódulos:
│   │       ├── VortexRadiography.jsx # Render de SEO, Tech Stack, y Performance Metrics.
│   │       ├── MarioPanel.jsx        # Interfaz de la estrategia (JSON crudo que parsea MARIO).
│   │       ├── VisionAnalysisCard.jsx# Resultados estéticos del OCR/Deep Vision.
│   │       ├── ActionCard.jsx        # Acciones CRM (Llamar, Enviar Email, WPP).
│   │       └── VortexLiveConsole.jsx # Terminal simulada con los eventos de BullMQ.
│   ├── LeadsTable/            # Tablas y listas para el CRM (Dashboard).
│   ├── DataIntelligence/      # Panel de control de estadísticas macro.
│   ├── Settings/              # Configuración de agencia (Agency Context, RLHF, etc).
│   ├── Sidebar/               # Navegación izquierda y perfil.
│   ├── AIChat/                # Componente de chat conversacional genérico.
│   ├── Modals/                # Modales flotantes (Config vendedor, etc).
│   └── Metrics/               # Tarjetas numéricas (KPIs).
├── services/
│   ├── api.js                 # Centralización Axios.
│   └── AlertService.js        # Wrapper sobre react-hot-toast.
├── utils/                     # Funciones de formateo y utilidades generales.
├── hooks/                     # Custom hooks para reusabilidad (e.g. useWebSocket).
├── App.jsx                    # Root de rutas (Layout principal + React Router).
├── Dashboard.jsx              # Vista de CRM "Tabular" (Lead Management).
└── main.jsx                   # Entry point de la aplicación React.
```

---

## 🚦 Sistema de Enrutamiento (`App.jsx`)

La aplicación posee un Sidebar lateral de `80px` de ancho colapsado, con el main view tomando el flex restante:

1.  **`/search` (Acquisition Hub):** El punto de partida táctico. Contiene los formularios para escanear `Google Places` con keywords, ubicar leads nuevos y enviarlos a la base de datos backend.
2.  **`/dashboard` (CRM Execution):** La vista principal operativa donde viven los prospectos extraídos. Desde aquí se abren las Battlecards de cada prospecto.
3.  **`/intelligence` (Data Intelligence Command Center):** Visualización global (Charts) sobre rendimientos, nichos más rentables y funnels.
4.  **`/settings`:** Interfaz estricta donde se configuran el "Agency Context" y los "Core Services" requeridos por MARIO V2.

---

## 🧠 Flujo de la Battlecard (`LeadDetailsPanel.jsx`)

Cuando un usuario clica sobre un lead en el `Dashboard`:

1. El estado del layout despliega el `LeadDetailsPanel.jsx` en forma de drawer overlay lateral o expandido.
2. Se disparan peticiones a la API para traer datos extra (`/leads/:id`).
3. **Bloque VORTEX (`VortexRadiography`):**
   - Si el lead no está "enriquecido", el usuario aprieta el botón para iniciar `triggerVortex()`.
   - Este botón llama a `api.enrichLead(id)` e invoca un polling continuo (o WS) a `/vortex/status/:id` que retroalimenta la consola del frontend (`VortexLiveConsole`).
   - Una vez terminado, la interfaz renderiza Métrica de Performance (Lighthouse), SEO On-Page y Stack Tecnológico (MERN, PHP, etc).
4. **Bloque VISION (`VisionAnalysisCard`):** El usuario puede paralelamente apretar "Deep Vision" para extraer capturas de pantalla móviles.
5. **Bloque MARIO (`MarioPanel` / `StrategyGuide`):**
   - Llama al endpoint `/api/ai/spider-analysis/:id` (Que bajo capó corre el nuevo MARIO V2 War Room).
   - Renderiza la táctica (Ej. "Desarrollo Web", canal "Whatsapp", Copys comerciales). Recordatorio: En la Version V2 el backend duevuelve JSON, por ende debe re-mapearse correctamente visualizándolo sin romper.
6. **Interaction Block (`ActionCard`):** Links tipo `mailto:`, `wa.me/` generados procedimentalmente según los datos parseados.

---

## 🌐 Capa de Interconexión (Axios `api.js`)

Configurado para apuntar a `import.meta.env.VITE_API_URL` o `http://localhost:5000/api`.
Posee un interceptor de red global: Si el Backend devuelve Error 500, Automáticamente invoca `toast.error` saltando validaciones de componentes aislando crashes visuales.

### Endpoints críticos mapeados en Frontend:

- `getAgencyContext` / `saveAgencyContext`: Endpoints RLHF/Directrices de MARIO.
- `enrichLead` / `triggerDeepVision` / `getEnrichmentStatus`: Motor VORTEX (BullMQ).
- `getSpiderAnalysis`: Tira de los hilos de SpiderV2 + MarioService para el JSON táctico.
- `askAi` / `getChatSessions`: IA conversacional suplementaria instalada en Widgets flotantes de lado derecho.
