/**
 * LLM Pricing Matrix — Cost per 1M tokens.
 * 
 * Used by AIService for dynamic cost calculation and
 * DataIntelligenceController for the frontend model selector.
 * 
 * EXTRACTED to its own file to avoid circular dependencies.
 */

const LLM_PRICING = {
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'o1-preview': { input: 15.00, output: 60.00 },
    'o1-mini': { input: 3.00, output: 12.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
};

const AVAILABLE_MODELS = Object.keys(LLM_PRICING).map(key => ({
    id: key,
    name: key,
    inputCost: LLM_PRICING[key].input,
    outputCost: LLM_PRICING[key].output,
    label: `${key} ($${LLM_PRICING[key].input}/$${LLM_PRICING[key].output} /1M tokens)`
}));

export { LLM_PRICING, AVAILABLE_MODELS };
