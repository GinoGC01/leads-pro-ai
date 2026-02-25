# Leads Pro AI - Generador de Leads Local

Esta herramienta está optimizada para ejecutarse en tu propio equipo. Permite generar leads, enriquecerlos y calificarlos utilizando la API de Google Places.

## 🚀 Inicio Rápido (Entorno Local)

### 1. Requisitos Previos
- **Node.js** instalado.
- **MongoDB** ejecutándose localmente (o una URL de Mongo Atlas).
- Una **API Key de Google Cloud** con "Places API" habilitada.

### 2. Configuración
1. Clona el proyecto y entra en la carpeta.
2. Configura tu API Key:
   - Abre `backend/.env`.
   - Reemplaza `YOUR_API_KEY_HERE` por tu clave real.
3. Instala todas las dependencias:
   ```bash
   npm run install-all
   ```

### 3. Ejecución
Para iniciar tanto el backend como el frontend al mismo tiempo, simplemente ejecuta:
```bash
npm run dev
```
- **Panel de Control:** [http://localhost:5173](http://localhost:5173)
- **API Backend:** [http://localhost:5000](http://localhost:5000)

## 🛠️ Herramientas Incluidas
- **Deduplicación:** Evita leads repetidos por Place ID y Dominio Web.
- **Scoring:** Evalúa automáticamente la oportunidad comercial de cada negocio.
- **Exportación:** Descarga tus leads en formato Excel o CSV directamente desde el dashboard.

## 📄 Guías de Soporte
- [Configuración de Google Cloud](GOOGLE_SETUP.md)
- [Solución de Problemas Locales](LOCAL_SETUP.md)

---
Desarrollado con ❤️ para prospección comercial de alto rendimiento.
