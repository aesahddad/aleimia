const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const { protect } = require('../middleware/auth');
const { validate, paymentInitSchema, paymentCartSchema, registerSupplierSchema } = require('../middleware/validator');

router.post('/initiate', protect, validate(paymentInitSchema), (req, res) => PaymentController.initiate(req, res));
router.post('/cart', protect, validate(paymentCartSchema), (req, res) => PaymentController.cartInitiate(req, res));
router.post('/register-supplier', protect, validate(registerSupplierSchema), (req, res) => PaymentController.registerSupplier(req, res));
router.post('/callback', (req, res) => PaymentController.callback(req, res));

module.exports = router;
