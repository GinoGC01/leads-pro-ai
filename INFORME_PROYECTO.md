# Informe Técnico de Ingeniería: Leads Pro AI v2.0

## 1. Visión General
Leads Pro AI v2.0 es una plataforma avanzada de generación y enriquecimiento de prospectos (Lead Generation) diseñada específicamente para agencias de marketing y ventas B2B. El sistema automatiza el descubrimiento de negocios, analiza su presencia digital y asigna una puntuación de oportunidad basada en indicadores técnicos y de rendimiento.

---

## 2. Arquitectura del Sistema
El sistema sigue una arquitectura desacoplada centrada en servicios (SOA):

### Backend (Node.js + Express)
- **Motor Asíncrono:** Utiliza procesamiento en segundo plano para evitar bloqueos del hilo principal durante el scraping intensivo.
- **Base de Datos (MongoDB):** Almacena leads, historial de búsquedas y métricas globales de inversión.
- **Servicios Especializados:** Lógica encapsulada para búsqueda de lugares, scraping web, perfilado técnico y scoring.

### Frontend (React + Vite)
- **Dashboard Glassmorphic:** Interfaz moderna con transparencia y gradientes.
- **Polling en Tiempo Real:** Sistema de consulta de logs de progreso para visualizar el estado de la búsqueda en vivo.
- **Visualización Analítica:** Desglose detallado de costos, cobertura de datos y calidad de leads.

---

## 3. Flujo de Prospección (Workflow)
1.  **Fase de Descubrimiento:** Conexión con Google Places API para localizar negocios por palabra clave y sector.
2.  **Fase de Enriquecimiento Profundo:**
    *   **Scraping Web:** Rastreo del sitio oficial para extraer correos electrónicos, teléfonos y redes sociales.
    *   **Tech Profiling:** Detección de constructores web (WordPress, Wix, etc.) y medición del **TTFB** (Time to First Byte).
3.  **Fase de Auditoría de Places:** Extracción de reseñas, rating y detección de inversión en anuncios (Ads).
4.  **Fase de Scoring:** Cálculo matemático de la oportunidad (0-100) y categorización de prioridad.

---

## 4. Innovaciones Técnicas y Fixes Críticos

### A. Persistencia de Contexto en Paginación (Google Places)
Uno de los retos técnicos más complejos resueltos en esta versión fue el error de `INVALID_REQUEST` en búsquedas masivas.
- **El Problema:** Google invalidaba los tokens de paginación tras el primer lote de 20 resultados.
- **La Solución:** Implementación de **Persistencia de Parámetros**. Descubrimos mediante diagnóstico profundo que ciertas regiones requieren el `query` inicial + `region` + `location` presente junto al `pagetoken`. El sistema ahora inyecta este contexto en cada salto de página, garantizando el acceso a los 60 resultados máximos permitidos.

### B. Motor TechProfiler
Identifica el "stack" tecnológico del lead:
- **Ineficiencia Detectada:** Si un negocio tiene WordPress pero un TTFB > 2s, el sistema lo marca como oportunidad de optimización.
- **Fuga de Inversión:** Detecta leads con **Ads activos** cuya web es deficiente (ej. Wix/GoDaddy lento), indicando que están desperdiciando dinero en publicidad y son candidatos perfectos para una nueva web.

### C. Scoring Dinámico v2.0
Fórmula: `Score = (Social_Bonus) + (Inefficiency_Multiplier) - (Zombie_Penalty)`
- **Bonus Analógico (+80):** leads con buen rating pero sin web (oportunidad máxima).
- **Penalty Zombie (-100):** Negocios sin reseñas en 12 meses, evitándote perder tiempo con empresas muertas.

---

## 5. Gestión y Analíticas
- **Historial Filtrable:** Permite buscar entre cientos de proyecciones pasadas por palabra, fecha, lugar o costo.
- **Control de Inversión:** Rastreo automático del costo por búsqueda (promedio $0.98 USD por búsqueda de 20 leads detallados).
- **CRM Lite integrado:** Seguimiento del estado del lead (Contactado, Interesado, Cerrado) directamente desde la tabla de resultados.

---

**Fecha de Última Actualización:** 25 de Febrero de 2026
**Departamento de Ingeniería - Leads Pro AI Team**
