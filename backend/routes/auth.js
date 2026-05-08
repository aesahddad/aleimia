const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const rateLimiter = require('../middleware/rateLimiter');

router.post('/register', (req, res) => AuthController.register(req, res));
router.post('/login', rateLimiter, (req, res) => AuthController.login(req, res));
router.post('/refresh', (req, res) => AuthController.refresh(req, res));

module.exports = router;
