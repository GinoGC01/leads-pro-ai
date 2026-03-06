import { createRequire } from 'module';
import { createHash } from 'crypto';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

/**
 * DocumentProcessor — Extracts and chunks text from uploaded files.
 * Supports PDF (via pdf-parse) and plain text (TXT).
 * 
 * All processing happens in-memory (no disk I/O).
 */
class DocumentProcessor {

    /**
     * Extract raw text from a file buffer.
     * @param {Buffer} buffer - File contents in memory
     * @param {string} mimetype - MIME type of the file
     * @returns {string} Extracted text
     * @throws {Error} On unsupported type or corrupted file
     */
    static async extractText(buffer, mimetype) {
        if (mimetype === 'text/plain') {
            const text = buffer.toString('utf-8');
            if (!text || text.trim().length === 0) {
                throw new Error('El archivo TXT está vacío.');
            }
            return text;
        }

        if (mimetype === 'application/pdf') {
            try {
                const data = await pdf(buffer);
                if (!data.text || data.text.trim().length === 0) {
                    throw new Error('El PDF no contiene texto extraíble (puede ser un scan/imagen).');
                }
                console.log(`[DocumentProcessor] PDF procesado: ${data.numpages} páginas, ${data.text.length} caracteres.`);
                return data.text;
            } catch (err) {
                if (err.message.includes('no contiene texto')) throw err;
                throw new Error(`Error procesando PDF: ${err.message}`);
            }
        }

        throw new Error(`Tipo de archivo no soportado: ${mimetype}. Solo se aceptan PDF y TXT.`);
    }

    /**
     * Split text into overlapping chunks for semantic embedding.
     * Uses a sliding window approach to maintain context between chunks.
     * 
     * @param {string} text - Raw extracted text
     * @param {number} [chunkSize=1000] - Target characters per chunk
     * @param {number} [overlap=200] - Characters of overlap between chunks
     * @returns {{ chunks: string[], stats: { totalChars: number, chunkCount: number } }}
     */
    static chunkText(text, chunkSize = 1000, overlap = 200) {
        // Normalización inicial: quita basura de PDFs
        const cleaned = text
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/[ \t]+/g, ' ')
            .trim();

        if (cleaned.length <= chunkSize) {
            return {
                chunks: [cleaned],
                stats: { totalChars: cleaned.length, chunkCount: 1 }
            };
        }

        const chunks = [];
        let start = 0;

        while (start < cleaned.length) {
            let end = start + chunkSize;

            if (end < cleaned.length) {
                const slice = cleaned.substring(start, end);
                
                // Prioridad de corte estratégico (de mejor a peor):
                // 1. Doble salto (Párrafos o Títulos)
                // 2. Punto seguido o punto final
                // 3. Espacio en blanco (Para evitar partir palabras si no hay puntuación)
                const lastBreak = Math.max(
                    slice.lastIndexOf('\n\n'), 
                    slice.lastIndexOf('.\n'),
                    slice.lastIndexOf('. '),
                    slice.lastIndexOf(' ') // ¡Nuevo! Salva palabras si no hay puntos
                );

                // Si encontró un break decente más allá del 30% del tamaño, recorta ahí.
                if (lastBreak > chunkSize * 0.3) {
                    end = start + lastBreak + 1;
                }
            } else {
                end = cleaned.length;
            }

            const chunk = cleaned.substring(start, end).trim();
            if (chunk.length > 0) {
                chunks.push(chunk);
            }

            // --- REGLA DE OVERLAP INTELIGENTE ---
            // Asegurarse de que el inicio del próximo chunk no caiga a mitad de una palabra
            let nextStart = end - overlap;
            if (nextStart >= cleaned.length) break;
            
            // Si el overlap cayó en medio de algo, retrocedemos hasta el primer espacio libre
            if (nextStart > start && cleaned[nextStart] !== ' ' && cleaned[nextStart - 1] !== ' ') {
                const indexOfSpace = cleaned.indexOf(' ', nextStart);
                if (indexOfSpace !== -1 && indexOfSpace < end) {
                    nextStart = indexOfSpace + 1;
                }
            }

            // Evitar loops infinitos y asegurar el avance
            if (nextStart <= start) nextStart = end; 
            start = nextStart;
        }

        console.log(`[DocumentProcessor] Texto fragmentado: ${chunks.length} chunks de ~${chunkSize} chars (overlap flexible).`);

        return {
            chunks,
            stats: { totalChars: cleaned.length, chunkCount: chunks.length }
        };
    }
    /**
     * Generate a SHA-256 hash of a file buffer for deduplication.
     * @param {Buffer} buffer - Raw file contents
     * @returns {string} Hex-encoded SHA-256 hash
     */
    static generateHash(buffer) {
        return createHash('sha256').update(buffer).digest('hex');
    }

    /**
     * Extract 3 strategic samples from a text for LLM congruence validation.
     * Samples from: start (0), center (length/2), end (length - sampleSize).
     * Guards against Trojan Horse documents that start valid but inject garbage.
     * 
     * @param {string} text - Full extracted text
     * @param {number} [sampleSize=1000] - Characters per sample
     * @returns {string} Concatenated samples with separators
     */
    static extractStrategicSamples(text, sampleSize = 1000) {
        const cleaned = text.replace(/\r\n/g, '\n').trim();

        // Short documents don't need sampling
        if (cleaned.length <= sampleSize * 3) {
            return cleaned;
        }

        const startSample = cleaned.substring(0, sampleSize);
        const centerIndex = Math.floor(cleaned.length / 2) - Math.floor(sampleSize / 2);
        const centerSample = cleaned.substring(centerIndex, centerIndex + sampleSize);
        const endSample = cleaned.substring(cleaned.length - sampleSize);

        const separator = '\n\n[...SALTO DE PÁGINA...]\n\n';

        return [
            `[FRAGMENTO INICIO]\n${startSample}`,
            `[FRAGMENTO CENTRO]\n${centerSample}`,
            `[FRAGMENTO FINAL]\n${endSample}`
        ].join(separator);
    }
}

export default DocumentProcessor;
