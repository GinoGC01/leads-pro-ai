# SPIDER ENGINE: Arquitectura Neuro-Simbólica

![Spider Engine Architecture](../images/spider.png)

**SPIDER (Strategic Pipeline for Intelligent Data-driven Evaluation and Routing)** es el núcleo lógico y determinista de "Leads Pro AI". A diferencia de un LLM tradicional que "adivina" o alucina estrategias basado en prompts, SPIDER actúa como la **Capa Simbólica** del sistema. Toma la data dura extraída de la web, aplica matemáticas, heurísticas de negocio y Machine Learning básico para escupir un Veredicto Frío (un JSON inmutable).

Este Veredicto es la única verdad absoluta que el LLM (MARIO) tiene permitido leer y acatar.

---

## ⚙️ 1. Anatomía y Componentes de SPIDER

El motor se desglosa en los siguientes componentes principales:

### A. El Códice de Nichos (`spider_codex.js`)
Es el "cerebro reptiliano" del sistema. Un diccionario en código duro que mapea palabras clave (ej: "dentist", "plumber") a niveles de rentabilidad (Tiers), dolores de mercado (Pains), servicios a ofrecer, tácticas y **Cadencias Estructuradas**.
* **Tier 1 (High Ticket):** Profesiones de alto valor (Abogados, Médicos). SPIDER les receta "Software a Medida" y cadencias agresivas.
* **Tier 2 (Volume Local):** Oficios (Plomeros, Mecánicos). SPIDER receta "Web + SEO Local" apuntando a la invisibilidad en Google.
* **Tier 3 (Low Margin):** Kioscos, panaderías. Filtro implacable: SPIDER los marca como `NO-GO` directamente para ahorrar tokens y tiempo.

### B. El Motor de Fricción (`SpiderEngine.calculateFriction`)
Calcula el **Costo Hundido** tecnológico del prospecto. Lee el Array de `tech_stack` provisto por Wappalyzer via VORTEX.
* **Alta Fricción (HIGH):** Si detecta tecnologías caras (React, AWS, Magento, Shopify Plus), SPIDER asume que el cliente pagó miles de dólares por su web. *Instrucción a MARIO:* "No insultes su web, ofrécele una auditoría para reparalarla o extenderla".
* **Baja Fricción (LOW):** Si detecta constructores baratos (Wix, Blogger, WordPress sin stack moderno), asume nulo apego financiero. *Instrucción a MARIO:* "Ofrécele quemar su web actual y hacer un reemplazo total".
* **El Cortafuegos de Existencia:** Si el lead NO tiene web, se aborta el cálculo técnico, la Fricción pasa a ser "N/A (Sin Web)" y se inyecta la táctica `NO_WEB_FOMO`.

### C. El Bucle de Feedback (Machine Learning Heurístico)
SPIDER no es estático; evoluciona leyendo tu propio CRM.
Posee un agregador de MongoDB que, en tiempo real, calcula el **Win Rate (Confianza Histórica)** de la táctica que está a punto de recomendar.
1. SPIDER ve que el lead es un "Médico" y decide usar la táctica `SOFTWARE_MEDIDA_PREMIUM`.
2. Lee en MongoDB todas las veces que usaste esa táctica y ganaste o perdiste.
3. Si el Win Rate es **menor al 15%** (y tienes más de 5 muestras validando el fracaso), SPIDER muta espontáneamente.
4. Anula el servicio principal y envía a MARIO por la **ruta de Contingencia** (ej: "No ofrezcas Software porque nadie lo está comprando, ofréceles una Auditoría Técnica de bajo costo").

---

## 🌪️ 2. Relación y Sinergia con VORTEX

**VORTEX** es la capa de Adquisición y Sensorial (Los ojos del sistema). SPIDER es ciego sin él.

1. **VORTEX Extrae:** Pasa por Google Places, raspa correos con Cheerio, levanta un navegador oculto (Puppeteer Stealth) para auditar TTFB/LCP, y usa Wappalyzer para ver qué tecnologías están vivas en el servidor del lead.
2. **SPIDER Cruza los Datos:** Agarra el JSON masivo de VORTEX y lo destila.
   * Si VORTEX dice: `lcp: 4000`, SPIDER concluye: `Dolor Técnico: Carga Lenta (LCP > 3s)`.
   * Si VORTEX dice: `tech_stack: ['Wix']`, SPIDER concluye: `Fricción: BAJA`.
   * Si VORTEX dice: `website: null`, SPIDER intercepta (Cortafuegos) y concluye: `Táctica: NO_WEB_FOMO`.

VORTEX recolecta los ingredientes crudos. SPIDER cocina el platillo maestro y dictamina si el lead es un GO o un NO-GO.

---

## 🍄 3. Integración con MARIO (La Capa Neuronal)

**MARIO (LLM Asistido mediante OpenAI)** es la "boca" del sistema, la interfaz sociópata y agresiva B2B que habla contigo.
El paradigma de este sistema es aislar la creatividad del LLM de la toma de decisiones.

1. SPIDER emite un Veredicto JSON donde **ya está todo decidido** (Angulo, Dolor, Tier, Fricción, Táctica y Cadencia).
2. SPIDER le pasa este JSON inmutable al System Prompt de MARIO en `AIService.js`.
3. Todo lo que MARIO hace es **traducir al lenguaje persuasivo humano** usando directivas rígidas.
   * Módulo de Fricción: MARIO lee la "Fricción" calculada por SPIDER y adapta su narrativa (Atacar sin piedad o auditar suavemente).
   * Módulo de Inexistencia (Phantom Web): SPIDER le inyecta un Prompt Negativo a MARIO (`has_website_flag: false`) apagándole la capacidad de sugerir mejoras técnicas, obligándolo a enfocarse solo en la Identidad Digital.
   * Cadencias: MARIO desempaqueta el array de `cadence_structure` dictado por SPIDER y te redacta en Markdown el Paso 1, Paso 2 y Paso 3 listos para Copy-Paste táctico.

---

## 🚀 4. Roadmap (El Futuro de SPIDER V3)

Para hacer que SPIDER pase de ser un "Asistente Estratégico" a un **Skynet de Ventas Autónomo**, debe absorber nuevas métricas:

### A. Fricción por Nivel de Madurez SEO (Autoridad de Dominio)
Inyectar un módulo que compruebe la edad del dominio, los backlinks y el volumen de tráfico actual. No es lo mismo un lead de "Fricción Baja" con 10 visitas mensuales, que uno con 100,000. El daño de migrar una web de alta autoridad es masivo, lo que elevaría radicalmente su Fricción Técnica y cambiaría de inmediato el ángulo del Códice por uno de "Solo CRO (Conversion Rate Optimization)".

### B. Machine Learning Basado en Semántica (Reinforcement Learning from Human Feedback - RLHF)
Actualmente, el ML evalúa solo variables binarias de MongoDB (Ganado vs Perdido). SPIDER V3 debería leer la `tactical_response` (El texto redactado) comparado con el rechazo del cliente (Si el humano anota la objeción en el CRM). 
Si el lead objetó "Es muy caro", SPIDER debe mutar el "Ángulo de Fricción" hacia modelos de financiamiento antes de recomendar la cadencia para el siguiente prospecto del mismo nicho.

### C. Generación de Payload Híbrido Dinámico (Auto-Webhooks)
En una versión final, cuando SPIDER dictamine un "GO" con "Confianza > 80%", el humano no debería ni siquiera hacer Copy-Paste. SPIDER debe disparar un Webhook empaquetando el JSON final a Make.com o n8n para que desencadenen un Cold Email automático desde múltiples cuentas calentadas al unísono, o manden la estructura de la web a un clonador como HTTrack o un sistema de Puppeteer que genere un Mockup instantáneo como "Cebo" (Lead Magnet) real.

---
*Fin del Manifiesto Spider.*
