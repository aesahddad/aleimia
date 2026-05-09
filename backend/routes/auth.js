const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const SocialAuthController = require('../controllers/SocialAuthController');
const rateLimiter = require('../middleware/rateLimiter');

router.post('/register', (req, res) => AuthController.register(req, res));
router.post('/login', rateLimiter, (req, res) => AuthController.login(req, res));
router.post('/refresh', (req, res) => AuthController.refresh(req, res));
router.post('/forgot-password', (req, res) => AuthController.forgotPassword(req, res));
router.post('/reset-password', (req, res) => AuthController.resetPassword(req, res));

// Social Auth
router.get('/callback', (req, res) => SocialAuthController.handleToken(req, res));

router.get('/facebook', SocialAuthController.authenticate('facebook'));
router.get('/facebook/callback', SocialAuthController.callback('facebook'));

router.get('/linkedin', SocialAuthController.authenticate('linkedin'));
router.get('/linkedin/callback', SocialAuthController.callback('linkedin'));

router.get('/google', SocialAuthController.authenticate('google'));
router.get('/google/callback', SocialAuthController.callback('google'));



module.exports = router;
