# Guía de Configuración Local: Leads Pro AI v2.0

Esta guía proporciona los pasos detallados para poner en marcha el sistema completo, incluyendo el nuevo motor de Inteligencia Artificial (RAG).

## 📋 Prerrequisitos
- **Node.js:** v18 o superior.
- **MongoDB:** Instalado localmente o una cuenta en MongoDB Atlas.
- **Cuenta de OpenAI:** Para el modelo `gpt-4o-mini` y embeddings.
- **Proyecto Supabase:** Para el almacenamiento de vectores (pgvector).

---

## 🛠️ Paso 1: Instalación de Dependencias
Desde la raíz del proyecto, ejecuta el comando orquestador para instalar todo el stack (Raíz, Backend y Frontend):
```powershell
npm run install-all
```

---

## 🔑 Paso 2: Configuración del Entorno (.env)
Crea o edita el archivo `backend/.env` con las siguientes claves:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tu_db
GOOGLE_PLACES_API_KEY=tu_google_api_key

# --- AI & RAG CONFIGURATION ---
OPENAI_API_KEY=tu_clave_de_openai_aqui
SUPABASE_URL=tu_url_de_supabase_aqui
SUPABASE_ANON_KEY=tu_clave_anon_de_supabase_aqui
```

---

## 💾 Paso 3: Configuración de Supabase (Vectores)
Leads Pro AI v2.0 utiliza **PostgreSQL con pgvector** para que la IA "recuerde" tus leads.
1. Entra en tu dashboard de Supabase -> **SQL Editor**.
2. Ejecuta el siguiente script para preparar la base de datos:

```sql
-- 1. Habilitar extensión vectorial
create extension if not exists vector;

-- 2. Crear tabla de leads vectorizados
create table if not exists business_leads (
  id uuid primary key default gen_random_uuid(),
  lead_id text unique not null,
  name text not null,
  metadata jsonb default '{}'::jsonb,
  content text not null, 
  embedding vector(1536) not null 
);

-- 3. Índice HNSW para velocidad de búsqueda
create index on business_leads using hnsw (embedding vector_cosine_ops)
with (m = 16, ef_construction = 64);

-- 4. Función de búsqueda (RPC)
create or replace function match_leads (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid, lead_id text, name text, content text, metadata jsonb, similarity float
)
language plpgsql as $$
begin
  return query
  select bl.id, bl.lead_id, bl.name, bl.content, bl.metadata,
    1 - (bl.embedding <=> query_embedding) as similarity
  from business_leads bl
  where 1 - (bl.embedding <=> query_embedding) > match_threshold
  order by bl.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

---

## 🚀 Paso 4: Ejecución del Proyecto
Para iniciar tanto el Backend como el Frontend simultáneamente, ejecuta en la raíz:
```powershell
npm run dev
```

---

## 🧪 Paso 5: Verificación del Sistema IA
Para asegurarte de que la conexión con OpenAI y Supabase es correcta, hemos incluido un script de diagnóstico:
1. Abre una terminal en `backend/`.
2. Ejecuta:
```powershell
node scripts/test-rag-system.js
```

---

## ❓ Resolución de Problemas (Troubleshooting)
- **Error 404 en el Chat:** Asegúrate de que el backend esté corriendo y de haber reiniciado el proceso tras añadir las rutas de IA.
- **RPC match_leads no encontrado:** Verifica que ejecutaste el script del Paso 3 en Supabase.
- **MongoDB Connection Error:** Asegúrate de que el servicio de MongoDB esté iniciado en tu máquina local.
