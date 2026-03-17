import { RESTRICCIONES_BASE } from './rules/restricciones_base.js';
import { TONE_CHALLENGER } from './tones/challenger.js';
import { TONE_CONSULTIVO } from './tones/consultivo.js';
import { TONE_VISIONARIO } from './tones/visionario.js';
import { TACTIC_TIERRA_ALQUILADA } from './tactics/tierra_alquilada.js';
import { TACTIC_FRICCION_TECNICA } from './tactics/friccion_tecnica.js';
import { TACTICA_DEFAULT } from './tactics/tactica_default.js';

export const getRules = () => RESTRICCIONES_BASE;

export const getTone = (toneName) => {
    switch (toneName?.toUpperCase()) {
        case 'CHALLENGER': return TONE_CHALLENGER;
        case 'CONSULTIVO': return TONE_CONSULTIVO;
        case 'VISIONARIO': return TONE_VISIONARIO;
        default: return TONE_CHALLENGER; // Fallback seguro
    }
};

export const getTactic = (tacticName) => {
    switch (tacticName?.toUpperCase()) {
        case 'TIERRA_ALQUILADA': return TACTIC_TIERRA_ALQUILADA;
        case 'FRICCION_TECNICA': return TACTIC_FRICCION_TECNICA;
        default: return TACTICA_DEFAULT; // Fallback seguro
    }
};
