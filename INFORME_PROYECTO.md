# 💎 Leads Pro AI: Reporte Maestro de Ingeniería
## El Futuro de la Prospección Inteligente (v2.5)

Este documento detalla la arquitectura técnica, las innovaciones y el corazón algorítmico del sistema **Leads Pro AI**. Un ecosistema diseñado no solo para encontrar negocios, sino para transformarlos en oportunidades de venta con precisión táctica.

---

## 🌪️ El Motor Central: Vortex Intelligence Engine (VIE)
El alma del proyecto es el **Vortex Intelligence Engine (VIE)**, un motor de enriquecimiento asíncrono que procesa cada lead de forma profunda.

### Innovaciones v2.5:
1.  **Bimodal Context Retrieval**: El sistema ya no depende solo de la base de datos vectorial. AI Controller ahora fusiona determinísticamente las métricas de **MongoDB** (Scores, Performance, SEO Audit) con el contenido semántico de **Supabase (Scraping)**, eliminando alucinaciones y asegurando que la IA siempre tenga datos, incluso si el scraping es parcial.
2.  **Tactical Persistence Logic**: Cada ángulo de venta, email o estrategia generada por la IA se guarda automáticamente en el CRM del prospecto. Esto crea una memoria corporativa que reduce el consumo de tokens y permite re-abrir leads con su contexto táctico intacto.

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
