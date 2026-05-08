const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Store = require('../models/Store');
const User = require('../models/User');

let adminToken = '';

describe('Store Management API', () => {
    beforeAll(async () => {
        await Store.deleteMany({});
        await Store.create({ name: 'Active Store', status: 'active', slug: 'active-store' });
        await Store.create({ name: 'Pending Store', status: 'pending', slug: 'pending-store' });
        await Store.create({ name: 'Deleted Store', status: 'deleted', slug: 'deleted-store' });
        const admin = await User.findOne({ email: 'admin@aleinia.com' });
        if (admin) {
            const res = await request(app).post('/api/auth/login').send({ email: 'admin@aleinia.com', password: 'admin123' });
            adminToken = res.body.token || '';
        }
    });

    it('GET /api/stores (Public) should only return active stores', async () => {
        const res = await request(app).get('/api/stores');
        expect(res.statusCode).toEqual(200);
        expect(res.body.every(s => s.status === 'active')).toBe(true);
    });

    it('GET /api/stores?admin=true should return non-deleted stores', async () => {
        const res = await request(app).get('/api/stores?admin=true');
        expect(res.statusCode).toEqual(200);
        const names = res.body.map(s => s.name);
        expect(names).toContain('Active Store');
        expect(names).toContain('Pending Store');
        expect(names).not.toContain('Deleted Store');
    });

    it('PUT /api/stores/:id/status should freeze a store (admin)', async () => {
        if (!adminToken) return;
        const store = await Store.findOne({ name: 'Active Store' });
        const res = await request(app)
            .put(`/api/stores/${store._id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'frozen' });
        expect(res.statusCode).toEqual(200);
        const updated = await Store.findById(store._id);
        expect(updated.status).toBe('frozen');
    });

    it('DELETE /api/stores/:id should soft delete (admin)', async () => {
        if (!adminToken) return;
        const store = await Store.findOne({ name: 'Pending Store' });
        const res = await request(app)
            .delete(`/api/stores/${store._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(200);
        const deleted = await Store.findById(store._id);
        expect(deleted.status).toBe('deleted');
    });
});
