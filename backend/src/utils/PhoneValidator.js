import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

class PhoneValidator {
    /**
     * Valida un número de teléfono e intenta determinar si es móvil.
     * Usa el bundle 'max' de libphonenumber-js para extraer el tipo de línea (mobile, fixed-line, etc).
     * 
     * @param {string} rawPhone - El número de teléfono extraído.
     * @param {string} defaultCountry - Código ISO del país por defecto (ej. 'AR', 'US').
     * @returns {{ isValid: boolean, isMobile: boolean, e164: string|null, country: string|null }}
     */
    static validateMobile(rawPhone, defaultCountry = 'AR') {
        try {
            if (!rawPhone) {
                return { isValid: false, isMobile: false, e164: null, country: null };
            }

            const phoneNumber = parsePhoneNumberFromString(rawPhone, defaultCountry);

            if (!phoneNumber || !phoneNumber.isValid()) {
                return { isValid: false, isMobile: false, e164: null, country: null };
            }

            // Usando getType() del bundle 'max'
            const phoneType = phoneNumber.getType();
            
            // En algunos países o números, el tipo puede ser 'FIXED_LINE_OR_MOBILE'
            // Consideramos válido para WhatsApp si es Mobile o dual.
            const isWhatsappValid = phoneType === 'MOBILE' || phoneType === 'FIXED_LINE_OR_MOBILE';

            return {
                isValid: true,
                isMobile: isWhatsappValid,
                e164: phoneNumber.number, // Formato E.164 (ej. +54911...)
                country: phoneNumber.country
            };
        } catch (error) {
            console.error('[PhoneValidator] Error procesando número:', rawPhone, error.message);
            return { isValid: false, isMobile: false, e164: null, country: null };
        }
    }
}

export default PhoneValidator;
