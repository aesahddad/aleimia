const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const SocialAuthController = require('../controllers/SocialAuthController');
const rateLimiter = require('../middleware/rateLimiter');
const { validate, registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema } = require('../middleware/validator');

router.post('/register', validate(registerSchema), (req, res) => AuthController.register(req, res));
router.post('/login', rateLimiter, validate(loginSchema), (req, res) => AuthController.login(req, res));
router.post('/refresh', rateLimiter, validate(refreshSchema), (req, res) => AuthController.refresh(req, res));
router.post('/logout', (req, res) => AuthController.logout(req, res));
router.post('/forgot-password', rateLimiter, validate(forgotPasswordSchema), (req, res) => AuthController.forgotPassword(req, res));
router.post('/reset-password', rateLimiter, validate(resetPasswordSchema), (req, res) => AuthController.resetPassword(req, res));

// Social Login
router.get('/social/:provider/url', (req, res) => SocialAuthController.getUrl(req, res));
router.post('/social/:provider/callback', (req, res) => SocialAuthController.callback(req, res));

module.exports = router;
