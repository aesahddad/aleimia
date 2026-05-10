const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const SocialAuthController = require('../controllers/SocialAuthController');
const rateLimiter = require('../middleware/rateLimiter');
const { validate, registerSchema, loginSchema } = require('../middleware/validator');

router.post('/register', validate(registerSchema), (req, res) => AuthController.register(req, res));
router.post('/login', rateLimiter, validate(loginSchema), (req, res) => AuthController.login(req, res));
router.post('/refresh', rateLimiter, (req, res) => AuthController.refresh(req, res));
router.post('/logout', (req, res) => AuthController.logout(req, res));
router.post('/forgot-password', rateLimiter, (req, res) => AuthController.forgotPassword(req, res));
router.post('/reset-password', rateLimiter, (req, res) => AuthController.resetPassword(req, res));

// Social Login
router.get('/social/:provider/url', (req, res) => SocialAuthController.getUrl(req, res));
router.post('/social/:provider/callback', (req, res) => SocialAuthController.callback(req, res));

module.exports = router;
