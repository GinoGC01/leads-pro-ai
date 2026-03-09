import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { QdrantClient } from '@qdrant/js-client-rest';

// Setup env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import KnowledgeDocument from '../src/models/KnowledgeDocument.js';

const qdrantClient = new QdrantClient({ url: process.env.QDRANT_URL || 'http://127.0.0.1:6333' });
const MARIO_COLLECTION = 'mario_knowledge';

async function sanitizeDatabase() {
    console.log("==========================================");
    console.log("🧹 INICIANDO SANEAMIENTO RAG (METADATA)");
    console.log("==========================================\n");

    try {
        console.log("🟡 Conectando a MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leads_db');
        console.log("✅ MongoDB conectado.\n");

        // 1. Sanitize MongoDB KnowledgeDocuments
        console.log("🟡 Saneando KnowledgeDocuments en MongoDB...");
        const docs = await KnowledgeDocument.find();
        let mongoUpdates = 0;

        for (const doc of docs) {
            let newNiche = 'general';
            let isGlobal = false;
            
            // Derive from previous tags if they exist (doc.get handles paths that might be removed from schema)
            const oldMetadata = doc.get('metadata');
            if (oldMetadata && oldMetadata.tags && oldMetadata.tags.length > 0) {
                newNiche = oldMetadata.tags[0]; // pick first relevant tag as main niche
            } else if (doc.filename) {
                const fname = doc.filename.toLowerCase();
                if (fname.includes('abogad') || fname.includes('legal')) newNiche = 'abogados';
                else if (fname.includes('clinica') || fname.includes('salud')) newNiche = 'clinicas';
                else if (fname.includes('inmobiliaria')) newNiche = 'inmobiliarias';
                else if (fname.includes('seguro')) newNiche = 'seguros';
                else if (fname.includes('ecommerce') || fname.includes('e-commerce') || fname.includes('tienda')) newNiche = 'e-commerce';
            }

            if (doc.filename && doc.filename.toLowerCase().includes('mario')) {
                isGlobal = true;
                newNiche = 'general';
            }

            doc.niche = newNiche;
            doc.is_global = isGlobal;
            
            // Remove old metadata field
            doc.set('metadata', undefined, { strict: false });
            
            await doc.save();
            mongoUpdates++;
        }
        console.log(`✅ MongoDB: ${mongoUpdates} documentos migrados a (niche, is_global).\n`);

        // 2. Sanitize Qdrant payloads
        console.log("🟡 Saneando vectores en Qdrant (mario_knowledge)...");
        try {
            let offset = null;
            let qdrantUpdates = 0;
            
            do {
                const response = await qdrantClient.scroll(MARIO_COLLECTION, {
                    limit: 100,
                    offset: offset,
                    with_payload: true,
                    with_vector: false
                });

                const points = response.points || [];
                if (!points || points.length === 0) break;

                for (const point of points) {
                    const payload = point.payload || {};
                    let newNiche = 'general';
                    let isGlobal = false;

                    // Derive from payload tags or source document name
                    if (payload.tags && payload.tags.length > 0) {
                        newNiche = payload.tags[0];
                    } else if (payload.source) {
                        const fname = payload.source.toLowerCase();
                        if (fname.includes('abogad') || fname.includes('legal')) newNiche = 'abogados';
                        else if (fname.includes('clinica') || fname.includes('salud')) newNiche = 'clinicas';
                        else if (fname.includes('inmobiliaria')) newNiche = 'inmobiliarias';
                        else if (fname.includes('seguro')) newNiche = 'seguros';
                        else if (fname.includes('ecommerce') || fname.includes('e-commerce')) newNiche = 'e-commerce';
                    }

                    if (payload.source && payload.source.toLowerCase().includes('mario')) {
                        isGlobal = true;
                        newNiche = 'general';
                    }

                    // Delete old 'tags' key
                    if (payload.tags !== undefined) {
                        await qdrantClient.deletePayload(MARIO_COLLECTION, {
                            keys: ["tags"],
                            points: [point.id],
                            wait: true
                        });
                    }

                    // Set new 'niche' and 'is_global' keys
                    await qdrantClient.setPayload(MARIO_COLLECTION, {
                        payload: {
                            niche: newNiche,
                            is_global: isGlobal
                        },
                        points: [point.id],
                        wait: true
                    });

                    qdrantUpdates++;
                }

                offset = response.next_page_offset;
            } while (offset);

            console.log(`✅ Qdrant: ${qdrantUpdates} vectores actualizados (tags eliminados, niche/is_global asignado).\n`);
        } catch (qErr) {
            console.warn(`[Qdrant] ⚠️ Error comunicándose con Qdrant (es posible que la colección no exista aún): ${qErr.message}\n`);
        }

        console.log("🚀 ESTADO FINAL: Migración de metadatos RAG finalizada con éxito.");
        process.exit(0);

    } catch (error) {
        console.error("❌ ENTORNO DETENIDO: Error catastrófico en la refactorización:", error);
        process.exit(1);
    }
}

sanitizeDatabase();
