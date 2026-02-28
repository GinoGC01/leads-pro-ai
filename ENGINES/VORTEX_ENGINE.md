# 🌪️ Vortex Intelligence Engine
**Documentación de Arquitectura de Inteligencia de Extracción y Perfilado (Deep-Scraping Engine)**

Vortex es un motor asíncrono, concurrente y tolerante a fallos diseñado para el enriquecimiento B2B automatizado en "Leads Pro AI". Su objetivo es ingerir un registro inicial de Google Places (Nombre, Teléfono) e inyectarle metadatos técnicos, inteligencia lingüística y embeddings semánticos para uso posterior en un modelo RAG avanzado.

Esta documentación detalla a bajo nivel los servicios y el ciclo de vida del *Pipeline* de 5 Fases gobernado por `EnrichmentWorker.js`.

---

## 🏗️ Orquestación y Concurrencia (`QueueService.js` & `EnrichmentWorker.js`)

Vortex no bloquea el hilo principal (Main Thread) de la API Node.js. Utiliza **BullMQ** apoyado sobre **Redis** (`QueueService`). 
- **Concurrencia Estricta**: Limitado intencionalmente a `concurrency: 3`. Procesar concurrentemente más páginas podría disparar alarmas en servicios WAF como Cloudflare, bloqueando la IP del servidor permanentemente.
- **Fallbacks Integrados**: BullMQ está configurado con **Exponential Backoff**: si el scraping de un prospecto falla temporalmente por carga de servidor (ej. HTTP 520, Timeout), espera 5 segundos y vuelve a intentar, escalando exponencialmente el tiempo (`attempts: 3`).
- **Short-Circuits por DNS**: Si el error devuelto por la fase de red es `ENOTFOUND` o `ERR_NAME_NOT_RESOLVED` (Dominio inexistente / expirado), el Worker *interrumpe* silenciosamente el ciclo de retries de BullMQ mediante un condicional (en lugar de re-arrojar el error), evitando gastar slots de concurrencia en dominios muertos. Cambia el estado en MongoDB a `failed` de inmediato.

---

## 🕸️ FASE 1: Motor Extractor & Evasión WAF (`ScraperService.js`)

Se trata de un módulo híbrido de doble capa (*Two-Tier Extraction*).

1. **Level 1 (Rápido - `got-scraping`)**: Intenta emular "HTTP Fingerprints" de navegadores Chrome legítimos utilizando `got-scraping`. 
   - Pasa un array de *header generators* (Locales: en-US, es-ES | Platform: Desktop).
   - Analiza el `<title>` inicial o el Status Code buscando los strings `Just a moment` o `Cloudflare`, o los códigos `403` y `520`. Si los detecta, arroja un `WAF_CHALLENGE_DETECTED`.
   
2. **Level 2 (Pesado - Puppeteer Stealth Fallback)**: Si el Nivel 1 falla, instancia un Chromium headless inyectado con `puppeteer-extra-plugin-stealth`.
   - **Optimización de Memoria (RAM):** Establece una intercepción de solicitudes de red al vuelo (`setRequestInterception(true)`). Lee el `resourceType()`, y aborta/filtra imágenes, fuentes, CSS (`stylesheet`) y multimedia. Solo renderiza el DOM estructural y la ejecución JS necesaria para bypassear Single Page Applications (SPAs).

---

## 🧹 FASE 2: Parsing & Purificación Estructural (`ParserService.js`)

Recibe el HTML crudo descargado por la capa anterior y delega el análisis en memoria al motor **Cheerio**.

1. **Auditoría SEO Determinista**: 
   - Cuenta las ocurrencias matemáticas básicas desde el DOM. 
   - Verifica existencia de `<title>` y `<meta name="description">`.
   - Suma la cantidad de elementos `<h1>`.
2. **Poda de Ruido Semántico**: El modelo IA vectorizador (fase 4) pierde precisión (*Context Window Drowning*) si se incrustan menús, links irrelevantes o CSS.
   - `$('script, style, noscript, nav, footer, header, iframe, svg, aside').remove();`
3. **Conversión a Markdown Absoluta**: Utiliza la librería `turndown`. Localiza la etiqueta `<main>` o `<article>`. Si no existe, recurre al `<body>`. Todo se transforma de HTML crudo a Markdown puro y comprimido, reduciendo masivamente el impacto de tokens LLM.

---

## 🔬 FASE 3: Perfilado Analítico (`ProfilerService.js`)

Ejecuta el análisis métrico real cruzando datos entre el HTML local y APIs de terceros.

1. **Detección Heurística de Tecnologías (Tech Stack)**:
   - Utiliza expresiones regulares (Regex) e inspección de Atributos sobre el HTML *minificado* pre-podado.
   - Analiza `script src=""` y `link href=""`: Si encuentra `wp-` marca "WordPress", si ve `_reactroot` marca "React".
   - Analiza el `meta[name="generator"]` para confirmar constructores como Wix.
2. **API de Rendimiento (PageSpeed Insights vía Protocolo REST)**:
   - Invoca una Request HTTP real contra la API oficial de `Google PageSpeed V5`. Pide exclusivamente la categoría `PERFORMANCE`.
   - Mapea de la respuesta masiva JSON solo tres números críticos: 
     - *Performance Score* (Normalizado 0-100 del Score Fractional `lighthouse.categories.performance.score`).
     - *LCP* (Largest Contentful Paint).
     - *TTFB* (Rápida resolución en backend parseando `server-response-time`).
   - Setea en `true` el campo relacional `performance_issue` si el valor es menor a 50 puntos.

---

## 🧠 FASE 4: Extracción de Inteligencia IA & Vectores (`AIService.js`)

Una vez recopilados: *Teléfono, Maps, SEO Audit, Markdown y Tech Stack*, Vortex llama al módulo `AIService` y construye el String de Semántica Maestra (`ragConfig.ingestion.buildSemanticContent`).

1. **Generación de Embeddings**: Usa la API del LLM (Ej. `text-embedding-3-small`) que emite un vector matemáticamente preciso flotante de altas dimensiones basado en todo lo anterior (Principalmente del texto del Markdown extraído del Landing).
2. **Vectorización Permanente**: Envía el vector generado hacia una tabla relacional en PostgreSQL optimizada a través de la Extensión **pgvector** gestionada por `SupabaseService`. Inyecta el texto Markdown junto con metadatos clave (`rating`, `performanceScore`, tech array) para soporte de búsquedas posteriores (*Macro-RAG*).

---

## 💿 FASE 5: Persistencia CRM Final

Toda la estructura analizada del lead actualiza en silencio y permanentemente la base de datos local `MongoDB`:
- Guarda en subdocumentos complejos los reportes de rendimiento (`performance_metrics`) y de indexación (`seo_audit`).
- Escribe el resultado del LLM en los campos de ventas.
- Pasa el estado del motor a `enrichmentStatus: 'completed'`.

El frontend, que implementó una solicitud temporal de Polling a `/api/vortex/status/:id`, lee este cambio y despliega renderizando los coloridos Dashboards Split y visualizaciones de Dona asíncronas de manera mágica para el usuario.
