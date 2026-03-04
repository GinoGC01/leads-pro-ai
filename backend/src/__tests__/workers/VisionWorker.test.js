import { jest } from '@jest/globals';

const mockFindById = jest.fn();
const mockLeadSave = jest.fn();

// Mock Mongoose model
jest.unstable_mockModule('../../models/Lead.js', () => ({
    default: {
        findById: mockFindById
    }
}));

// Mock BullMQ to prevent actual worker instantiation and Redis connections
jest.unstable_mockModule('bullmq', () => {
    return {
        Worker: class {
            constructor(name, processor, opts) {
                this.name = name;
                this.processor = processor;
                this.opts = opts;
                this.on = jest.fn();
            }
            async close() {}
        }
    };
});

// Mock QueueService reference
jest.unstable_mockModule('../../services/QueueService.js', () => ({
    connection: { quit: jest.fn(), disconnect: jest.fn() }
}));

const mockTakeMobileScreenshot = jest.fn();
jest.unstable_mockModule('../../services/VisionScraperService.js', () => ({
    default: {
        takeMobileScreenshot: mockTakeMobileScreenshot
    }
}));

const mockAnalyzeUX = jest.fn();
jest.unstable_mockModule('../../services/AIService.js', () => ({
    default: {
        analyzeUX: mockAnalyzeUX
    }
}));

// Dynamic import
const { default: visionWorker } = await import('../../workers/VisionWorker.js');

describe('VisionWorker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // Stop the worker from picking up jobs to clean up the test
        await visionWorker.close();
    });

    it('should successfully process a lead and update to vision_completed', async () => {
        const fakeLead = {
            _id: 'fake-id',
            name: 'Test Lead',
            website: 'https://test.com',
            save: mockLeadSave
        };
        mockFindById.mockResolvedValue(fakeLead);
        mockTakeMobileScreenshot.mockResolvedValue('fake-base64');
        mockAnalyzeUX.mockResolvedValue({ ux_score_1_to_10: 8 });

        // Access the worker processor function directly for testing
        const processor = visionWorker.processor;
        const job = { data: { leadId: 'fake-id' } };

        // Test the processor logic
        await processor(job);

        expect(mockFindById).toHaveBeenCalledWith('fake-id');
        expect(mockTakeMobileScreenshot).toHaveBeenCalledWith('https://test.com');
        expect(mockAnalyzeUX).toHaveBeenCalledWith('fake-base64', 'https://test.com');
        expect(fakeLead.vortex_status).toBe('vision_completed');
        expect(fakeLead.vision_analysis.ux_score_1_to_10).toBe(8);
        expect(mockLeadSave).toHaveBeenCalled();
    });

    it('should set vortex_status to failed when an error occurs during processing', async () => {
        const fakeLead = {
            _id: 'fake-id',
            name: 'Test Lead',
            website: 'https://test.com',
            save: mockLeadSave
        };
        mockFindById.mockResolvedValue(fakeLead);
        mockTakeMobileScreenshot.mockRejectedValue(new Error('Simulated Puppeteer Error'));

        mockLeadSave.mockResolvedValue(fakeLead); // succeed on the fallback save

        const processor = visionWorker.processor;
        const job = { data: { leadId: 'fake-id' } };

        await expect(processor(job)).rejects.toThrow('Simulated Puppeteer Error');

        expect(fakeLead.vortex_status).toBe('failed');
        expect(fakeLead.vision_analysis.error).toBe('Simulated Puppeteer Error');
        expect(mockLeadSave).toHaveBeenCalledTimes(1); // Call for the fallback
    });
});
