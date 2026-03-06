import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import MarioService from '../../src/services/MarioService.js';
import Lead from '../../src/models/Lead.js';
import Settings from '../../src/models/Settings.js';
import MarioStrategy from '../../src/models/MarioStrategy.js';
import AIService from '../../src/services/AIService.js';
import VectorStoreService from '../../src/services/VectorStoreService.js';
import AIController from '../../src/controllers/AIController.js';

describe('MARIO V2 RLHF Loop Integration Test', () => {
    let dummyLeadId;
    let strategyId;
    let vectorSearchSpy;
    let getEngineSpy;
    let mockOpenAICreate;

    const dummyJsonResponse = {
        internal_reasoning: {
            spider_data_cited: "Falta de SSL",
            rag_sources_cited: "N/A",
            logic_chain: "Ofrecer chat"
        },
        strategic_planning: {
            approach_overview: "Directo",
            recommended_channel: "WHATSAPP",
            channel_justification: "Linea mobile"
        },
        solution_architecture: {
            core_offer: "Desarrollo Web",
            innovative_upsell: "Chatbot",
            technical_rationale: "Mejora conversion"
        },
        sales_funnel_copy: {
            opening_message: "Hola, tu web no tiene SSL.",
            follow_up_pressure: "Te perdiste 10 ventas hoy.",
            objection_handling: "Es barato.",
            closing_script: "Llamame."
        }
    };

    beforeAll(async () => {
        // Conexión a la base de datos de test
        const mongoUri = process.env.MONGODB_URI
            ? process.env.MONGODB_URI.replace(/\/[^/]+$/, '/leads_ai_test_mario_rlhf')
            : 'mongodb://127.0.0.1:27017/leads_ai_test_mario_rlhf';
            
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(mongoUri);
        }

        // Limpieza de colecciones
        await Lead.deleteMany({});
        await Settings.deleteMany({});
        await MarioStrategy.deleteMany({});

        // Crear Lead Dummy
        const lead = new Lead({
            name: 'RLHF Test Corp',
            domain: 'rlhf-test.com',
            whatsapp_valid: true,
            spider_verdict: { pain: 'Sin ventas', technical_flaw: 'Lento' }
        });
        await lead.save();
        dummyLeadId = lead._id;

        // Crear Settings
        const settings = new Settings({
            isSingleton: true,
            agencyName: 'Testing Agency',
            core_services: [{ name: 'Test Service', description: 'Test', ideal_for: 'All' }]
        });
        await settings.save();

        // Configurar spies (MOCKS)
        vectorSearchSpy = jest.spyOn(VectorStoreService, 'searchSimilar')
            .mockResolvedValue([
                { payload: { text_chunk: 'Siempre vende con urgencia.' } }
            ]);

        mockOpenAICreate = jest.fn().mockResolvedValue({
            choices: [{
                message: { content: JSON.stringify(dummyJsonResponse) }
            }]
        });

        getEngineSpy = jest.spyOn(AIService, 'getEngine')
            .mockReturnValue({
                client: {
                    chat: {
                        completions: {
                            create: mockOpenAICreate
                        }
                    }
                },
                config: { active_model: 'gpt-4o-mini' }
            });
            
        jest.spyOn(AIService, 'generateEmbedding').mockResolvedValue([0.1, 0.2]);
        jest.spyOn(AIService, 'trackUsage').mockImplementation(() => {});
    });

    afterAll(async () => {
        vectorSearchSpy.mockRestore();
        getEngineSpy.mockRestore();
        jest.restoreAllMocks();
        await mongoose.connection.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Test 1 (Generación Inicial): Genera estrategia JSON y guarda en PENDING', async () => {
        const result = await MarioService.generateStrategy(dummyLeadId);
        
        // Assert json structure
        expect(result.strategy).toHaveProperty('internal_reasoning');
        expect(result.strategy.sales_funnel_copy.opening_message).toBe("Hola, tu web no tiene SSL.");
        
        // Assert MongoDB persistence
        const savedStrategy = await MarioStrategy.findById(result.strategy_id);
        expect(savedStrategy).not.toBeNull();
        expect(savedStrategy.status).toBe('PENDING');
        expect(savedStrategy.lead_id.toString()).toBe(dummyLeadId.toString());
        
        // Save for next test
        strategyId = savedStrategy._id;
    });

    it('Test 2 (Feedback Humano - El Castigo): Cambia a REJECTED con score 1', async () => {
        // Simulando Req y Res de Express para scoreStrategy
        const req = {
            params: { strategyId: strategyId },
            body: { score: 1, feedback: "El tono es demasiado corporativo, necesito que seas más agresivo." }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await AIController.scoreStrategy(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        
        // Verificar en BD
        const updatedStrategy = await MarioStrategy.findById(strategyId);
        expect(updatedStrategy.status).toBe('REJECTED');
        expect(updatedStrategy.human_score).toBe(1);
        expect(updatedStrategy.human_feedback).toBe("El tono es demasiado corporativo, necesito que seas más agresivo.");
    });

    it('Test 3 (Regeneración y Corrección de Prompt): Prompt incluye el feedback del humano', async () => {
        // Llamada directa al servicio simulando lo que haría el controlador en la regeneración
        // Primero obtener lo rechazado como hace el controller
        const failedStrategies = await MarioStrategy.find({ 
            lead_id: dummyLeadId, 
            status: 'REJECTED' 
        }).sort({ generated_at: -1 }).limit(3);

        expect(failedStrategies.length).toBe(1);

        // Regenerate
        await MarioService.generateStrategy(dummyLeadId, failedStrategies);

        // Assert Crítico: Inspect OpenAI mock arguments
        expect(mockOpenAICreate).toHaveBeenCalledTimes(1);
        const callArgs = mockOpenAICreate.mock.calls[0][0];
        const systemMessage = callArgs.messages.find(m => m.role === 'system').content;

        // Verify the injected negative prompt
        expect(systemMessage).toContain("ALERTA ROJA - CORRECCIÓN RLHF HUMANA");
        expect(systemMessage).toContain("El humano rechazó tu propuesta anterior");
        expect(systemMessage).toContain("El tono es demasiado corporativo, necesito que seas más agresivo.");
    });
});
