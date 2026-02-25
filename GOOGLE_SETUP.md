# Configuración de Google Cloud para Places API

Sigue estos pasos para obtener tu API Key y configurar los permisos necesarios:

## 1. Crear un Proyecto
1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Haz clic en "Seleccionar un proyecto" > "Proyecto nuevo".
3. Dale un nombre (ej: `Leads-Generator`) y haz clic en "Crear".

## 2. Habilitar APIs
Debes habilitar las siguientes APIs:
1. Ve a "APIs y servicios" > "Biblioteca".
2. Busca y habilita:
   - **Places API** (Obligatoria para la búsqueda).
   - **Geocoding API** (Opcional, si usas nombres de ciudades en lugar de lat/lng directamente).

## 3. Crear Credenciales (API Key)
1. Ve a "APIs y servicios" > "Credenciales".
2. Haz clic en "+ CREAR CREDENCIALES" > "Clave de API".
3. **IMPORTANTE:** Restringe la clave para evitar uso no autorizado.
   - En "Restricciones de API", selecciona "Restringir clave" y elige "Places API".

## 4. Facturación
- La API de Places requiere una cuenta de facturación activa.
- Google ofrece un crédito gratuito mensual (usualmente $200 USD) que cubre miles de búsquedas.

## 💡 Tips para ahorrar costos
- El sistema solicita solo los campos necesarios: `name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,geometry,url`.
- Evita pedir `opening_hours` o `photos` si no los necesitas, ya que aumentan el costo por petición.
