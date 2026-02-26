# 💎 Leads Pro AI: Reporte Maestro de Ingeniería
## El Futuro de la Prospección Inteligente (v3.2 - No-Web Pivot)

Este documento detalla la arquitectura técnica, las innovaciones y el corazón algorítmico del sistema **Leads Pro AI**. Un ecosistema diseñado no solo para encontrar negocios, sino para transformarlos en oportunidades de venta con precisión táctica y alineación corporativa total.

---

## 🌪️ El Motor Central: Vortex Intelligence Engine (VIE)
El alma del proyecto es el **Vortex Intelligence Engine (VIE)**, un motor de enriquecimiento asíncrono que procesa cada lead de forma profunda.

### Innovaciones v3.0 (Dual-Context RAG):
1.  **Agency Codex Integration**: Ingestión dinámica de `AGENCY_CONTEXT.md`. El sistema ahora posee "Conciencia de Agencia", entendiendo quién eres y qué vendes antes de analizar a cualquier lead.
2.  **Relational Opportunity Scoring**: El algoritmo de puntuación ha evolucionado. Un lead ya no es "bueno" de forma genérica; es puntuado por su **Afinidad de Agencia**. Si el lead tiene un problema técnico que tu agencia soluciona específicamente, su score recibe un bono de +25 pts.
3.  **The Closer's Prompt**: El motor de IA ha sido reconfigurado con un System Prompt de Doble Contexto. La IA tiene estrictamente prohibido ofrecer servicios que no estén en tu códice, garantizando una alineación comercial del 100%.

---

## 🧼 Higiene y Salud de Datos (v3.1)

### 1. Cascading Bulk Deletion Logic
Implementación de un sistema de borrado sincronizado para evitar "vectores fantasma":
*   **Dual-Database Sync**: Cuando eliminas un lead, el sistema destruye primero su registro en **Supabase (pgvector)** y luego en **MongoDB**.
*   **Massive Action UI**: Nueva interfaz de selección masiva con barra de acciones flotante y modal de confirmación destructiva profesional.

---

## 📵 Estrategia de Conversión No-Web (v3.2)

### 1. RAG Strategy Override
Cuando un lead no posee sitio web, el sistema cambia automáticamente su motor RAG:
*   **Enfoque en Reputación**: La IA ignora auditorías técnicas (Lighthouse) y se centra en el **Rating y Reseñas** de Google Places.
*   **Costo de Oportunidad**: Se prioriza vender la captura de "clientes perdidos" que buscan el negocio y no lo encuentran.

### 2. Botones Tácticos Condicionales
El Panel de Detalles se adapta Dinámicamente:
*   **Cold Call Script**: Guion de menos de 60 segundos enfocado en agendar una cita basándose en su reputación offline.
*   **WhatsApp FOMO**: Mensaje corto de alto impacto emocional sobre la demanda desatendida.
*   **Estrategia Local**: Análisis de dolores operativos (ej. agendamiento manual) que una web solucionaría.

---

## 🛠️ Stack Tecnológico de Elite
*   **Backend**: Node.js & Express (Arquitectura modular con Inyección de Dependencias).
*   **Database**: 
    *   **MongoDB**: Almacenamiento primario y motor de persistencia táctica.
    *   **Redis**: Gestión de colas BullMQ para procesos ` Ghost-Mode`.
    *   **Supabase (pgvector)**: Memoria semántica de largo plazo.
*   **Frontend**: React (Vite) + Tailwind CSS.
    *   **Sidebar-Centric Design**: Interfaz optimizada para pantallas densas con tooltips heurísticos de auto-ajuste (anti-clipping).

---

## 📊 Inteligencia Financiera y Operativa

### 1. Sistema de Reconciliación de Facturación por SKU (v2.1)
Hemos abandonado las estimaciones estáticas por una contabilidad de grado bancario:
*   **Rastreo por SKU**: Diferenciación exacta entre llamadas `Text Search` ($0.032) y `Place Details` ($0.025).
*   **Free-Tier Awareness**: El sistema descuenta automáticamente los umbrales gratuitos reales de Google Cloud (5,000 búsquedas y 1,000 detalles mensuales).
*   **Dashboard de Ahorro Real**: Visualización del ROI basada en los USD ahorrados gracias a la cuota gratuita de Google.

### 2. Opportunity Scoring (Heurística de Cierre)
Algoritmo de 4 capas que califica prospectos de 0 a 100:
*   **Bonus "Modo Analógico"**: Máxima puntuación para negocios exitosos sin presencia web.
*   **Detección de Ineficiencia**: Penalización por stacks obsoletos (Wix/GoDaddy) frente a negocios rentables.
*   **Detección Ad-Intent**: Identificación automática de negocios que ya invierten en publicidad.

---

## 🛡️ Defensa y Resiliencia
*   **Heuristic Tooltip System**: Sistema de explicaciones internas que guía al usuario sobre los scores de IA, optimizado para no ocultarse nunca en la interfaz.
*   **Nuclear Defense Logic**: Protección contra inconsistencias de datos de terceras APIs, garantizando el flujo continuo de la aplicación.

---

## 🎯 Conclusión
**Leads Pro AI** ha evolucionado de un simple scraper a una plataforma de **Mercancía Inteligente**. Con la integración de la persistencia táctica y la reconciliación financiera real, el sistema no solo entrega leads, sino un control total sobre el negocio del usuario.

**Ingeniería desarrollada por Antigravity.** ✨💎
