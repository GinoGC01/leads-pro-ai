import { evaluatePerfectLead } from './enrochementWorkerAgents.js';

console.log("=== Testing Guillotina ===");

const perfectLead = {
    website: "https://example.com",
    performance_metrics: { lcp: 2.1 }, // <= 2.5
    seo_audit: { score: 95 }, // >= 90
    tech_stack: ['React', 'Facebook-Pixel', 'Node.js'] // hasPixels
};

const imperfectLead = {
    website: "https://example.com",
    performance_metrics: { lcp: 5.0 }, // > 2.5
    seo_audit: { score: 95 },
    tech_stack: ['React', 'Facebook-Pixel', 'Node.js']
};

const noWebLead = {
    performance_metrics: { lcp: 1.0 },
    seo_audit: { score: 100 },
    tech_stack: ['Meta-Pixel']
};

console.log("Perfect Lead should discard (true):", evaluatePerfectLead(perfectLead));
console.log("Imperfect Lead should pass (false):", evaluatePerfectLead(imperfectLead));
console.log("No Web Lead should pass (false):", evaluatePerfectLead(noWebLead));
