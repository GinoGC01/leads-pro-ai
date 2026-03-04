import mongoose from 'mongoose';
import Lead from '../../models/Lead.js';

describe('Lead Model', () => {
    beforeAll(() => {
        // Disconnect if already connected to avoid open handles
        if (mongoose.connection.readyState !== 0) {
            mongoose.disconnect();
        }
    });

    it('should have a default vortex_status of "pending"', () => {
        const lead = new Lead({
            name: 'Test Lead',
            website: 'https://test.com'
        });

        expect(lead.vortex_status).toBe('pending');
    });

    it('should throw a ValidationError when vortex_status is invalid', async () => {
        const lead = new Lead({
            name: 'Test Lead',
            vortex_status: 'estado_inventado'
        });

        let err;
        try {
            await lead.validate();
        } catch (error) {
            err = error;
        }

        expect(err).toBeDefined();
        expect(err.name).toBe('ValidationError');
        expect(err.errors['vortex_status']).toBeDefined();
    });
});
