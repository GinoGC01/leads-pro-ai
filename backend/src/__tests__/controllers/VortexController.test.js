import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockFindOneAndUpdate = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockAddLeadToVision = jest.fn();

// Mock Mongoose model BEFORE importing the controller
jest.unstable_mockModule('../../models/Lead.js', () => ({
    default: {
        findOneAndUpdate: mockFindOneAndUpdate,
        findById: mockFindById,
        findByIdAndUpdate: mockFindByIdAndUpdate
    }
}));

// Mock QueueService to prevent real Redis connections
jest.unstable_mockModule('../../services/QueueService.js', () => ({
    addLeadToVision: mockAddLeadToVision,
    addLeadToEnrichment: jest.fn(),
    enrichmentQueue: {},
    visionQueue: {},
    connection: { quit: jest.fn(), disconnect: jest.fn() }
}));

// Dynamic import after mocks to inject them into the module cache
const { default: VortexController } = await import('../../controllers/VortexController.js');

const app = express();
app.use(express.json());
app.post('/api/vortex/deep-vision/:id', VortexController.triggerDeepVision);

describe('VortexController - triggerDeepVision (Phase 2)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reject with 409 Conflict if atomic update fails (race condition or not base_completed)', async () => {
        mockFindOneAndUpdate.mockResolvedValue(null);
        mockFindById.mockResolvedValue({ _id: 'fake-id', vortex_status: 'pending' });

        const response = await request(app).post('/api/vortex/deep-vision/fake-id');

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/Conflicto de estado/);
        expect(mockAddLeadToVision).not.toHaveBeenCalled();
    });

    it('should reject with 404 if lead does not exist at all', async () => {
        mockFindOneAndUpdate.mockResolvedValue(null);
        mockFindById.mockResolvedValue(null);

        const response = await request(app).post('/api/vortex/deep-vision/fake-id');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(mockAddLeadToVision).not.toHaveBeenCalled();
    });

    it('should accept with 202 and enqueue if atomic update succeeds', async () => {
        const fakeLead = { _id: 'fake-id', name: 'Test Lead', vortex_status: 'vision_processing' };
        mockFindOneAndUpdate.mockResolvedValue(fakeLead);

        const response = await request(app).post('/api/vortex/deep-vision/fake-id');

        expect(response.status).toBe(202);
        expect(response.body.success).toBe(true);
        expect(mockAddLeadToVision).toHaveBeenCalledWith(fakeLead);
    });

    it('should return 503 and rollback if queueing fails', async () => {
        const fakeLead = { _id: 'fake-id', name: 'Test Lead', vortex_status: 'vision_processing' };
        mockFindOneAndUpdate.mockResolvedValue(fakeLead);
        mockAddLeadToVision.mockRejectedValue(new Error('Redis connection failed'));

        const response = await request(app).post('/api/vortex/deep-vision/fake-id');

        expect(response.status).toBe(503);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/temporalmente saturado/);
        
        // Assert rollback to base_completed
        expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('fake-id', { $set: { vortex_status: 'base_completed' } });
    });
});
