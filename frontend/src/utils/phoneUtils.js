import { parsePhoneNumberWithError } from 'libphonenumber-js/max';

export const getWhatsAppLink = (rawNumber, defaultCountry = 'AR') => {
    if (!rawNumber) return null;
    try {
        const phoneNumber = parsePhoneNumberWithError(rawNumber, defaultCountry);
        if (!phoneNumber.isValid()) return null;
        return phoneNumber.format('E.164').replace('+', '');
    } catch (error) {
        return null;
    }
};
