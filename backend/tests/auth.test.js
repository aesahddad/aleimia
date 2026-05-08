const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

let testToken = '';
let testRefreshToken = '';

describe('Auth Endpoints', () => {
    beforeAll(async () => {
        await User.deleteMany({ email: /test@/ });
    });

    it('should register a new customer', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'TestUser', email: 'test@example.com', password: 'password123' });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('refreshToken');
        testToken = res.body.token;
        testRefreshToken = res.body.refreshToken;
    });

    it('should login the user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'password123' });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.role).toBe('customer');
    });

    it('should refresh the access token', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: testRefreshToken });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });
});
