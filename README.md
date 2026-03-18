# 🧠 Leads Pro AI - MARIO V11.1

Leads Pro AI es un ecosistema diseñado para automatizar la generación de prospectos y la creación de estrategias comerciales personalizadas. A diferencia de los sistemas tradicionales basados exclusivamente en prompts, esta arquitectura **Neuro-Simbólica** utiliza lógica determinista en Node.js para el control de negocio y agentes de IA para la generación del mensaje final.

La versión **V11.1** marca la transición a una comunicación de impacto único (**Single Strike**) y un control de errores más estricto.

---

## 🏗️ 1. Arquitectura: Router Matrix & Single Strike

Esta versión elimina la incertidumbre en la toma de decisiones de la IA mediante dos componentes clave:

### Router Matrix (Cerebro comercial)
El sistema no permite que la IA elija qué ofrecer al cliente. En su lugar, un motor en Node.js analiza los datos obtenidos por el scraper y asigna una **Táctica** y una **Oferta** específicas según el sector y las fallas detectadas. Esto garantiza que la propuesta comercial sea coherente con el catálogo de servicios autorizado.

### Single Strike (Impacto Unificado)
Anteriormente, el sistema generaba múltiples fragmentos de mensaje (base, upsell, etc.). La V11.1 unifica todo en un solo `mensaje_maestro`. Este enfoque de "un solo golpe" elimina la fragmentación y asegura que el lead reciba una propuesta de valor integral y directa en el primer contacto.

---

## 🌪️ 2. Motores de Inspección

### Motor VORTEX: Auditoría de Performance
Este motor realiza una inspección profunda del ecosistema digital del lead:
- **Performance Web**: Medición de métricas reales como LCP (Largest Contentful Paint) y TTFB (Time to First Byte).
- **Inspección Visual**: Uso de modelos multimodales para evaluar la experiencia de usuario (UX) y el diseño de la interfaz (UI).
- **Diagnóstico**: Generación de un reporte técnico que sirve como base para el ángulo de venta.

### Motor SPIDER: Triaje y Heurísticas
El SPIDER es el primer filtro del sistema. Su función es clasificar al lead según su potencial:
- **Vulnerabilidades Técnicas**: Identificación de fallas críticas (ej. falta de SSL, mala optimización móvil).
- **Clasificación de Negocio**: Categorización del lead (ej. `TIERRA_ALQUILADA` para negocios sin sitio propio).
- **Heurísticas**: Aplicación de reglas lógicas para determinar si el lead es apto para el proceso de venta.

---

## 🤖 3. Pipeline Multi-Agente (MARIO V11.1)

El proceso de creación del mensaje se divide en tres etapas especializadas para maximizar la calidad del output:

1.  **Researcher**: Actúa como un analista de datos. Recibe la información cruda de VORTEX y SPIDER para destilar un briefing clínico. Su objetivo es identificar los "puntos de dolor" exactos del lead.
2.  **Strategist**: Toma el briefing del Researcher y la oferta asignada por el Router. Su tarea es diseñar el plan de ataque comercial, asegurando que la solución propuesta resuelva directamente los problemas detectados.
3.  **Copywriter**: Es el responsable de la redacción final. Transforma la estrategia en el **Mensaje Maestro**, aplicando el tono de voz seleccionado (Challenger, Consultivo o Visionario) y respetando las restricciones geográficas y culturales.

---

## ⚔️ 4. Salvaguardas y Filtros de Calidad

### Filtro Guillotina (Ahorro de Recursos)
Para optimizar el uso de la infraestructura, el Filtro Guillotina detiene el pipeline si un lead no presenta fricción técnica suficiente. Si un prospecto ya tiene un ecosistema digital optimizado, el sistema lo descarta automáticamente, evitando el gasto innecesario de tokens y tiempo de procesamiento.

### Protección contra Alucinaciones
El sistema implementa restricciones severas para negocios que no tienen sitio web propio (`TIERRA_ALQUILADA`). El Copywriter tiene prohibido mencionar plataformas que no hayan sido detectadas explícitamente (ej. no inventar que el cliente usa Instagram o Facebook). En su lugar, debe usar términos genéricos como "dependencia de terceros" para mantener la precisión del mensaje.

---

## 🚀 5. Operación y Despliegue

### Configuración del Entorno (.env)
El sistema requiere las siguientes variables para operar:
- `MONGODB_URI`: Persistencia de leads y estrategias.
- `QDRANT_URL`: Base de datos vectorial para el almacenamiento de tácticas mediante RAG.
- `OPENAI_API_KEY`: Acceso a los modelos LLM y Vision.

### Ejecución
El proyecto utiliza Docker para gestionar los servicios de base de datos.
```bash
# Iniciar servicios de persistencia (MongoDB/Qdrant)
docker-compose up -d

# Iniciar servidor de backend y cliente frontend
npm run dev
```

### Pruebas de Sistema
```bash
cd backend
npm test
```

