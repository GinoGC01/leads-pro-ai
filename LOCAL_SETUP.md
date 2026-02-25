# Guía de Configuración Local y Resolución de Problemas

Sigue estos pasos si encuentras problemas al ejecutar el sistema en tu entorno local.

## 1. Configuración de MongoDB
El sistema espera que MongoDB se esté ejecutando en `localhost:27017`.
- **Si usas MongoDB Community Edition:** Asegúrate de que el servicio `MongoDB` esté iniciado en tu panel de servicios de Windows.
- **Si usas Docker:** `docker run -d -p 27017:27017 --name mongo-leads mongo`
- **Si usas MongoDB Atlas:** Cambia la variable `MONGODB_URI` en `backend/.env` por tu cadena de conexión (Connection String).

## 2. Puertos Utilizados
- **5000:** Backend API.
- **5173:** Frontend (Vite).
Asegúrate de que no haya otros programas ocupando estos puertos.

## 3. Errores Comunes
### "Google API Error: REQUEST_DENIED"
- Revisa que tu clave de API sea correcta y no tenga restricciones de IP que impidan el acceso desde `localhost`.
- Verifica que la **Places API** esté habilitada en el proyecto de Google Cloud.

### "Prueba de Scraping: Email no encontrado"
- Algunos sitios web protegen sus emails o los cargan dinámicamente. El scraper utiliza `axios` y `cheerio`, lo cual es rápido pero no ejecuta JavaScript.
- Si necesitas un scraping más avanzado, el sistema está preparado para integrar `puppeteer` (ya incluido en las dependencias).

## 4. Scripts de Desarrollo
Desde la raíz del proyecto:
- `npm run dev`: Inicia todo.
- `npm run dev:backend`: Inicia solo el servidor.
- `npm run dev:frontend`: Inicia solo la interfaz.
