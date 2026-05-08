const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Ad = require('../models/Ad');
const User = require('../models/User');

let adminToken = '';

describe('Ad Management API', () => {
    beforeAll(async () => {
        await Ad.deleteMany({});
        await Ad.create({ title: 'Ad 1', price: 100, status: 'pending', description: 'Test Description', imageUrl: 'http://test.com/image.jpg', contactNumber: '0500000000' });
        await Ad.create({ title: 'Ad 2', price: 200, status: 'active', description: 'Test Description 2', imageUrl: 'http://test.com/image2.jpg', contactNumber: '0500000009' });
        const admin = await User.findOne({ email: 'admin@aleinia.com' });
        if (admin) {
            const res = await request(app).post('/api/auth/login').send({ email: 'admin@aleinia.com', password: 'admin123' });
            adminToken = res.body.token || '';
        }
    });

    it('GET /api/ads should return public active ads', async () => {
        const res = await request(app).get('/api/ads');
        expect(res.statusCode).toEqual(200);
        expect(res.body.every(a => a.status === 'active')).toBe(true);
    });

    it('PUT /api/ads/:id/status should update status', async () => {
        if (!adminToken) return;
        const ad = await Ad.findOne({ title: 'Ad 1' });
        const res = await request(app)
            .put(`/api/ads/${ad._id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'active' });
        expect(res.statusCode).toEqual(200);
        const updated = await Ad.findById(ad._id);
        expect(updated.status).toBe('active');
    });

    it('DELETE /api/ads/:id should soft delete', async () => {
        if (!adminToken) return;
        const ad = await Ad.findOne({ title: 'Ad 2' });
        const res = await request(app)
            .delete(`/api/ads/${ad._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(200);
        const deleted = await Ad.findById(ad._id);
        expect(deleted.status).toBe('deleted');
    });
});
