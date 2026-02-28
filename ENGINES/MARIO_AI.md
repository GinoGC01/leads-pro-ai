# 🤖 MARIO AI: Intelligence Framework
**Documentación de Arquitectura de Inteligencia Artificial (Micro & Macro RAG)**

MARIO es el asistente de ventas B2B integrado en "Leads Pro AI", diseñado para no alucinar conceptos genéricos de marketing y fundamentarse estrictamente en la extracción de datos reales de MongoDB y Supabase.

Su infraestructura se basa en una técnica matemática conocida como RAG (Retrieval-Augmented Generation), y opera con dos motores cognitivos que se bifurcan según el alcance de la petición del usuario.

## ⚙️ Arquitectura de Componentes
1. **Frontend (`AIChat.jsx` & `api.js`)**: Gestiona la ventana de chat flotante en el Dashboard y en los paneles individuales de Leads. Manteniene un log de las sesiones en `localStorage` y parsea Markdown. Tiene la capacidad inteligente de identificar qué está viendo el usuario e inyectar subrepticiamente el `leadId` o `campaignId` en el payload.
2. **Controlador Puente (`AIController.js`)**: Recibe la pregunta (Query), el historial de chat, y determina por qué "Tubo de Inteligencia" va a rutar la consulta. 
3. **Servicio (`AIService.js`)**: Se comunica con la API de OpenAI (utilizando `gpt-4o-mini`). Construye los "System Prompts" dinámicos y la incrustación de conocimiento o *Embeddings*.
4. **Almacenamiento (MongoDB & Supabase)**: MongoDB es la *Única Fuente de la Verdad* para métricas duras (SEO, Stack, Ratings). Supabase (PostgreSQL + pgvector) actúa como "Memoria a Largo Plazo" para análisis semántico del texto en crudo de la página web.

---

## 📌 Bifurcación de Contexto (Context Switch)

El elemento más avanzado de Mario es cómo procesa la realidad. Existen 3 modos lógicos interconectados en `AIController`:

### MODO 1: Micro-RAG (Táctico Individual)
**Activación**: Cuando la solicitud a la API incluye un `leadId` (pasa cuando se abre el chat desde el cajón lateral de detalles del lead).
- **Proceso**: 
  1. Mario interroga a MongoDB por el documento único del Lead para leer sus fallos y `opportunityScore`.
  2. Luego, consulta la Base Vectorial (Supabase) buscando si el motor Vortex descargó algún artículo de blog o sección 'Quienes Somos' de la web original.
  3. Comprime todo en un prompt con el texto "ESTADO DIGITAL DEL LEAD" y se lo entrega a GPT.
  4. OpenAI devuelve el ángulo de venta (Email en frío, guion de llamada).
  5. **Detección Táctica**: La respuesta se "guarda" en el documento del Lead en MongoDB bajo el campo `tactical_response` para nunca re-consultar a OpenAI por lo mismo.

### MODO 2: Macro-RAG (Analítico Multi-Lead)
**Activación**: Cuando en el Dashboard global le preguntas a Mario (se envía `campaignId` pero NO un lead específico).
- **El Problema que Resuelve**: Al usar modelos de lenguaje grandes, si les pides "revisa mis leads", suelen dar respuestas teóricas y te dicen "Asegúrate de buscar clientes en retail".
- **La Solución Determinista**: Módulo `buildCampaignContext()`. El sistema hace un query global a MongoDB, obtiene TODOS los leads de la campaña actual (con sus puntajes SEO/Lighthouse) y los *comprime* en un string súper denso (ej. `[ID: 1] Nombre: X - Score: 30 - Web: Lenta`). 
- **System Prompt Estricto**: Mario cambia de personalidad y se vuelve un Analista de Datos Restringido. Se le ordena estricta y legalmente que **solo** puede elegir prospectos desde su lista mapeada, justificándolo con las fallas numéricas reales reportadas (cross-match).

### MODO 3: RAG General (Búsqueda Semántica)
**Activación**: Si no se provee ningún ID (chat de configuración o general).
- **Proceso**: Toma la pregunta (ej. *"¿Qué lead se dedica al software de recursos humanos?"*), la convierte en una matriz matemática (Embeddings), y la choca contra Supabase para recuperar los textos más similares y poder responder con memoria del universo de leads.

---

## 🛡️ Identity & The "Nano Banana" Context
Independientemente de si es Micro o Macro, a Mario SIEMPRE se le inyecta un encabezado al inicio de sus pensamientos operacionales con el contexto local de **TU AGENCIA**.
Este archivo `AGENCY_CONTEXT.md` (editable desde la UI) le dicta a Mario firmemente a qué se dedica Nano Banana, impidiéndole que ofrezca al cliente final servicios que tu agencia en realidad no realiza.
