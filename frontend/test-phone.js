import { getWhatsAppLink } from './src/utils/phoneUtils.js';

console.log("TEST 1: 011 15-4321-9876 (AR) ->", getWhatsAppLink("011 15-4321-9876", "AR")); // Debe retornar 5491143219876
console.log("TEST 2: +54 9 11 4321 9876 (AR) ->", getWhatsAppLink("+54 9 11 4321 9876", "AR")); // Debe retornar 5491143219876
console.log("TEST 3: (305) 555-1234 (US) ->", getWhatsAppLink("(305) 555-1234", "US")); // Debe retornar 13055551234
console.log("TEST 4: No tiene teléfono (AR) ->", getWhatsAppLink("No tiene teléfono", "AR")); // Debe retornar null
console.log("TEST 5: 123 (AR) ->", getWhatsAppLink("123", "AR")); // Debe retornar null
