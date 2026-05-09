const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const { protect } = require('../middleware/auth');

router.post('/initiate', protect, (req, res) => PaymentController.initiate(req, res));
router.post('/cart', protect, (req, res) => PaymentController.cartInitiate(req, res));
router.post('/register-supplier', protect, (req, res) => PaymentController.registerSupplier(req, res));
router.post('/callback', (req, res) => PaymentController.callback(req, res));

module.exports = router;
