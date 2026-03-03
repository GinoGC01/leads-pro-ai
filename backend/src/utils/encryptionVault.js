import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY;

/**
 * Bóveda Criptográfica — AES-256-GCM
 * 
 * IMPORTANTE: Define MASTER_ENCRYPTION_KEY en tu .env (exactamente 32 caracteres).
 * Ejemplo: MASTER_ENCRYPTION_KEY=A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6
 */

/**
 * Encripta un texto usando AES-256-GCM.
 * Retorna un string con formato: iv:authTag:encryptedData
 */
export function encrypt(text) {
    if (!text) return null;
    if (!MASTER_KEY || MASTER_KEY.length !== 32) {
        throw new Error('[VAULT] MASTER_ENCRYPTION_KEY inválido en .env (debe ser exactamente 32 caracteres)');
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(MASTER_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Desencripta un hash producido por encrypt().
 * Retorna el texto original o null si falla.
 */
export function decrypt(hash) {
    if (!hash) return null;
    if (!MASTER_KEY || MASTER_KEY.length !== 32) {
        console.error('[VAULT] MASTER_ENCRYPTION_KEY inválido para desencriptar.');
        return null;
    }

    try {
        const parts = hash.split(':');
        if (parts.length !== 3) return null;

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(MASTER_KEY), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('[VAULT ERROR] Fallo al desencriptar:', error.message);
        return null;
    }
}

/**
 * Enmascara una API key para exposición segura al frontend.
 * Ejemplo: "sk-proj-abc123xyz" → "sk-p...xyz"
 */
export function maskKey(key) {
    if (!key) return null;
    if (key.length < 8) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

/**
 * Verifica si un string ya es una versión enmascarada (no editar si ya lo es).
 */
export function isMasked(value) {
    if (!value) return true;
    return value.includes('...');
}
