import ApiUsage from '../models/ApiUsage.js';
import SearchHistory from '../models/SearchHistory.js';
import Lead from '../models/Lead.js';
import SystemConfig from '../models/SystemConfig.js';
import { encrypt, decrypt, maskKey, isMasked } from '../utils/encryptionVault.js';
import { LLM_PRICING, AVAILABLE_MODELS } from '../config/llm_pricing.js';

/**
 * Controller for Data Intelligence — API consumption, config, and vault.
 */
class DataIntelligenceController {

    /**
     * GET /api/intelligence/usage — Monthly usage with aggregated totals.
     * Supports ?month=YYYY-MM to view specific months. Defaults to current month.
     * Also returns allTime aggregation across all months for free tier tracking.
     */
    static async getUsage(req, res) {
        try {
            const requestedMonth = req.query.month || new Date().toISOString().slice(0, 7);
            let usage = await ApiUsage.findOne({ month: requestedMonth });
            if (!usage) {
                usage = await ApiUsage.create({ month: requestedMonth });
            }

            const config = await SystemConfig.getInstance();
            const selectedModel = config.ai_engine?.model_name || 'gpt-4o-mini';
            const pricing = LLM_PRICING[selectedModel] || LLM_PRICING['gpt-4o-mini'];

            // All-time aggregation for free tier tracking
            const allUsages = await ApiUsage.find({}).lean();
            const allTimeGoogle = allUsages.reduce((sum, u) => sum + (u.textSearchCount || 0), 0);
            const allTimeGoogleCost = allUsages.reduce((sum, u) => sum + (u.googlePlacesCostUSD || 0), 0);
            const allTimeOpenAICalls = allUsages.reduce((sum, u) => sum + (u.openaiCalls || 0), 0);
            const allTimeOpenAITokensIn = allUsages.reduce((sum, u) => sum + (u.openaiTokensInput || 0), 0);
            const allTimeOpenAITokensOut = allUsages.reduce((sum, u) => sum + (u.openaiTokensOutput || 0), 0);
            const allTimeOpenAICost = allUsages.reduce((sum, u) => sum + (u.openaiCostUSD || 0), 0);
            const allTimeTotalCost = parseFloat((allTimeGoogleCost + allTimeOpenAICost).toFixed(4));

            // Available months for the frontend selector
            const availableMonths = allUsages
                .map(u => u.month)
                .sort((a, b) => b.localeCompare(a));

            // Current month values
            const monthGoogle = usage.textSearchCount || 0;
            const monthGoogleCost = usage.googlePlacesCostUSD || 0;
            const monthOpenAICalls = usage.openaiCalls || 0;
            const monthOpenAIIn = usage.openaiTokensInput || 0;
            const monthOpenAIOut = usage.openaiTokensOutput || 0;
            const monthOpenAICost = usage.openaiCostUSD || 0;
            const monthTotalCost = parseFloat((monthGoogleCost + monthOpenAICost).toFixed(4));

            // Free tier: 5000 per month for current month
            const currentMonth = new Date().toISOString().slice(0, 7);
            const currentMonthUsage = allUsages.find(u => u.month === currentMonth);
            const currentMonthGoogle = currentMonthUsage?.textSearchCount || 0;

            res.json({
                success: true,
                month: usage.month,
                availableMonths,
                google: {
                    textSearchCount: monthGoogle,
                    costUSD: monthGoogleCost,
                    freeTierLimit: 5000,
                    freeTierUsed: Math.min(currentMonthGoogle, 5000),
                    freeTierRemaining: Math.max(0, 5000 - currentMonthGoogle),
                    pricePerRequest: 0.032
                },
                openai: {
                    totalCalls: monthOpenAICalls,
                    tokensInput: monthOpenAIIn,
                    tokensOutput: monthOpenAIOut,
                    tokensTotal: monthOpenAIIn + monthOpenAIOut,
                    costUSD: monthOpenAICost,
                    activeModel: selectedModel,
                    pricing: { input: pricing.input, output: pricing.output }
                },
                totalCostUSD: monthTotalCost,
                allTime: {
                    googleCalls: allTimeGoogle,
                    googleCostUSD: parseFloat(allTimeGoogleCost.toFixed(4)),
                    openaiCalls: allTimeOpenAICalls,
                    openaiTokensInput: allTimeOpenAITokensIn,
                    openaiTokensOutput: allTimeOpenAITokensOut,
                    openaiCostUSD: parseFloat(allTimeOpenAICost.toFixed(4)),
                    totalCostUSD: allTimeTotalCost
                },
                dailyBreakdown: (usage.dailyBreakdown || []).sort((a, b) => a.date.localeCompare(b.date)),
                updatedAt: usage.updatedAt
            });
        } catch (error) {
            console.error('[DataIntelligence] Usage Error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/intelligence/alerts — Consumption threshold alerts
     */
    static async getAlerts(req, res) {
        try {
            const usage = await ApiUsage.getCurrentMonth();
            const alerts = [];

            const googleUsage = usage.textSearchCount || 0;
            if (googleUsage >= 4500) {
                alerts.push({ level: 'critical', api: 'Google Places', message: `Free tier casi agotado: ${googleUsage}/5000 requests usados`, usage: googleUsage, limit: 5000 });
            } else if (googleUsage >= 3500) {
                alerts.push({ level: 'warning', api: 'Google Places', message: `70% del free tier consumido: ${googleUsage}/5000 requests`, usage: googleUsage, limit: 5000 });
            }

            const totalCost = (usage.googlePlacesCostUSD || 0) + (usage.openaiCostUSD || 0);
            if (totalCost >= 50) {
                alerts.push({ level: 'critical', api: 'Total', message: `Costo mensual elevado: $${totalCost.toFixed(2)} USD`, cost: totalCost });
            } else if (totalCost >= 20) {
                alerts.push({ level: 'warning', api: 'Total', message: `Costo mensual en ascenso: $${totalCost.toFixed(2)} USD`, cost: totalCost });
            }

            res.json({ success: true, alerts, totalAlerts: alerts.length });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/intelligence/config — Read config with MASKED keys (never send real keys)
     */
    static async getConfig(req, res) {
        try {
            const config = await SystemConfig.getInstance();

            // Decrypt in memory, then mask for frontend
            const rawOpenAI = decrypt(config.api_keys?.openai_key_encrypted);
            const rawGoogle = decrypt(config.api_keys?.google_places_encrypted);

            res.json({
                success: true,
                ai_engine: config.ai_engine,
                api_keys: {
                    openai_key: maskKey(rawOpenAI) || (process.env.OPENAI_API_KEY ? maskKey(process.env.OPENAI_API_KEY) : null),
                    google_places_key: maskKey(rawGoogle) || (process.env.GOOGLE_PLACES_API_KEY ? maskKey(process.env.GOOGLE_PLACES_API_KEY) : null),
                    openai_source: rawOpenAI ? 'vault' : 'env',
                    google_source: rawGoogle ? 'vault' : 'env'
                },
                available_models: AVAILABLE_MODELS,
                llm_pricing: LLM_PRICING
            });
        } catch (error) {
            console.error('[DataIntelligence] Config Read Error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * PUT /api/intelligence/config — Update config with encrypted key storage
     */
    static async updateConfig(req, res) {
        try {
            const { ai_engine, api_keys } = req.body;
            const config = await SystemConfig.getInstance();

            if (ai_engine) {
                if (ai_engine.model_name && LLM_PRICING[ai_engine.model_name]) {
                    config.ai_engine.model_name = ai_engine.model_name;
                }
                if (ai_engine.temperature !== undefined) {
                    config.ai_engine.temperature = Math.max(0, Math.min(1, parseFloat(ai_engine.temperature)));
                }
                if (ai_engine.max_tokens !== undefined) {
                    config.ai_engine.max_tokens = Math.max(100, Math.min(8000, parseInt(ai_engine.max_tokens)));
                }
            }

            if (api_keys) {
                if (api_keys.openai_key && !isMasked(api_keys.openai_key)) {
                    config.api_keys.openai_key_encrypted = encrypt(api_keys.openai_key);
                    console.log('[VAULT] OpenAI API Key encriptada y almacenada.');
                }
                if (api_keys.google_places_key && !isMasked(api_keys.google_places_key)) {
                    config.api_keys.google_places_encrypted = encrypt(api_keys.google_places_key);
                    console.log('[VAULT] Google Places API Key encriptada y almacenada.');
                }
            }

            config.updatedAt = new Date();
            await config.save();

            const rawOpenAI = decrypt(config.api_keys?.openai_key_encrypted);
            const rawGoogle = decrypt(config.api_keys?.google_places_encrypted);

            res.json({
                success: true,
                message: 'Configuración actualizada correctamente.',
                ai_engine: config.ai_engine,
                api_keys: {
                    openai_key: maskKey(rawOpenAI) || maskKey(process.env.OPENAI_API_KEY),
                    google_places_key: maskKey(rawGoogle) || maskKey(process.env.GOOGLE_PLACES_API_KEY),
                    openai_source: rawOpenAI ? 'vault' : 'env',
                    google_source: rawGoogle ? 'vault' : 'env'
                }
            });
        } catch (error) {
            console.error('[DataIntelligence] Config Update Error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/intelligence/sync-stats — Retroactive stats migration.
     * 
     * Counts ALL historical SearchHistory for Google Places calls,
     * AND counts all leads with AI processing for OpenAI estimates.
     * 
     * OpenAI estimation per lead:
     * - Each lead with battlecard = 1 MARIO call (~800 output tokens avg)
     * - Each lead with spider_verdict = 1 Spider call (~300 output tokens avg)
     * - Each enriched lead = 1 context chat call (~500 output tokens avg)
     * - Input tokens estimated at ~2000 per call (system prompt + context)
     */
    static async syncRetroactiveStats(req, res) {
        try {
            // ═══ PHASE 1: Google Places from SearchHistory ═══
            const histories = await SearchHistory.find({}, {
                createdAt: 1, resultsCount: 1, searchMode: 1,
                gridCellsCompleted: 1
            }).lean();

            const monthlyStats = {};
            const COST_PER_GOOGLE_REQUEST = 0.032;

            for (const h of histories) {
                const date = new Date(h.createdAt);
                const month = date.toISOString().slice(0, 7);
                const day = date.toISOString().slice(0, 10);

                if (!monthlyStats[month]) {
                    monthlyStats[month] = { googleCalls: 0, openaiCalls: 0, openaiTokensIn: 0, openaiTokensOut: 0, openaiCost: 0, days: {} };
                }

                let calls;
                if (h.searchMode === 'grid' && h.gridCellsCompleted) {
                    calls = h.gridCellsCompleted * 3;
                } else {
                    const results = h.resultsCount || 0;
                    calls = results > 40 ? 3 : (results > 20 ? 2 : 1);
                }

                monthlyStats[month].googleCalls += calls;

                if (!monthlyStats[month].days[day]) {
                    monthlyStats[month].days[day] = { googleCalls: 0, openaiCalls: 0, openaiTokens: 0, openaiCost: 0 };
                }
                monthlyStats[month].days[day].googleCalls += calls;
            }

            // ═══ PHASE 2: OpenAI from Leads & Chats ═══
            const leads = await Lead.find({}, {
                createdAt: 1, spider_memory: 1, tactical_response: 1
            }).lean();

            // Default pricing for retroactive estimation (gpt-4o-mini was the default)
            const retroPricing = LLM_PRICING['gpt-4o-mini'];
            const AVG_INPUT_TOKENS = 2500;  // system prompt + vortex context per call
            const AVG_OUTPUT_BATTLECARD = 800; // Average JSON response length

            let totalOpenAICalls = 0;

            for (const lead of leads) {
                const date = new Date(lead.createdAt);
                const month = date.toISOString().slice(0, 7);
                const day = date.toISOString().slice(0, 10);

                if (!monthlyStats[month]) {
                    monthlyStats[month] = { googleCalls: 0, openaiCalls: 0, openaiTokensIn: 0, openaiTokensOut: 0, openaiCost: 0, days: {} };
                }
                if (!monthlyStats[month].days[day]) {
                    monthlyStats[month].days[day] = { googleCalls: 0, openaiCalls: 0, openaiTokens: 0, openaiCost: 0 };
                }

                let aiCalls = 0;
                let tokensOut = 0;

                // Lead with generated playbook / tactical_response → 1 MARIO call
                if ((lead.spider_memory && lead.spider_memory.generated_playbook) || lead.tactical_response) {
                    aiCalls += 1;
                    tokensOut += AVG_OUTPUT_BATTLECARD;
                }

                if (aiCalls > 0) {
                    const tokensIn = aiCalls * AVG_INPUT_TOKENS;
                    const cost = ((tokensIn / 1_000_000) * retroPricing.input) + ((tokensOut / 1_000_000) * retroPricing.output);

                    monthlyStats[month].openaiCalls += aiCalls;
                    monthlyStats[month].openaiTokensIn += tokensIn;
                    monthlyStats[month].openaiTokensOut += tokensOut;
                    monthlyStats[month].openaiCost += cost;

                    monthlyStats[month].days[day].openaiCalls += aiCalls;
                    monthlyStats[month].days[day].openaiTokens += (tokensIn + tokensOut);
                    monthlyStats[month].days[day].openaiCost += cost;

                    totalOpenAICalls += aiCalls;
                }
            }

            // ═══ PHASE 3: Write to ApiUsage ═══
            let totalGoogleSynced = 0;
            for (const [month, data] of Object.entries(monthlyStats)) {
                let usage = await ApiUsage.findOne({ month });
                if (!usage) {
                    usage = await ApiUsage.create({ month });
                }

                // Google
                usage.textSearchCount = data.googleCalls;
                usage.googlePlacesCostUSD = parseFloat((data.googleCalls * COST_PER_GOOGLE_REQUEST).toFixed(4));

                // OpenAI
                usage.openaiCalls = data.openaiCalls;
                usage.openaiTokensInput = data.openaiTokensIn;
                usage.openaiTokensOutput = data.openaiTokensOut;
                usage.openaiTokens = data.openaiTokensIn + data.openaiTokensOut;
                usage.openaiCostUSD = parseFloat(data.openaiCost.toFixed(6));

                // Daily breakdown
                usage.dailyBreakdown = Object.entries(data.days).map(([date, d]) => ({
                    date,
                    googleCalls: d.googleCalls,
                    googleCostUSD: parseFloat((d.googleCalls * COST_PER_GOOGLE_REQUEST).toFixed(4)),
                    openaiCalls: d.openaiCalls,
                    openaiTokens: d.openaiTokens,
                    openaiCostUSD: parseFloat(d.openaiCost.toFixed(6))
                }));

                usage.updatedAt = new Date();
                await usage.save();
                totalGoogleSynced += data.googleCalls;
            }

            console.log(`[DataIntelligence] Retroactive sync: ${histories.length} searches → ${totalGoogleSynced} Google calls, ${leads.length} leads → ${totalOpenAICalls} OpenAI calls.`);

            res.json({
                success: true,
                message: 'Sincronización retroactiva completada.',
                google: { searchesProcessed: histories.length, totalApiCalls: totalGoogleSynced },
                openai: { leadsProcessed: leads.length, estimatedCalls: totalOpenAICalls },
                monthsCovered: Object.keys(monthlyStats).length
            });
        } catch (error) {
            console.error('[DataIntelligence] Sync Error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default DataIntelligenceController;
