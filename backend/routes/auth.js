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

router.get('/callback', (req, res) => SocialAuthController.handleToken(req, res));

router.get('/facebook', SocialAuthController.authenticate('facebook'));
router.get('/facebook/callback', SocialAuthController.callback('facebook'));

router.get('/linkedin', SocialAuthController.authenticate('linkedin'));
router.get('/linkedin/callback', SocialAuthController.callback('linkedin'));

router.get('/google', SocialAuthController.authenticate('google'));
router.get('/google/callback', SocialAuthController.callback('google'));

router.get('/apple', SocialAuthController.authenticate('apple'));
router.get('/apple/callback', SocialAuthController.callback('apple'));

router.get('/tiktok', SocialAuthController.authenticate('tiktok'));
router.get('/tiktok/callback', SocialAuthController.callback('tiktok'));

router.get('/snapchat', SocialAuthController.authenticate('snapchat'));
router.get('/snapchat/callback', SocialAuthController.callback('snapchat'));

module.exports = router;
