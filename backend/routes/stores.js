const express = require('express');
const router = express.Router();
const StoreController = require('../controllers/StoreController');
const { protect, admin } = require('../middleware/auth');

// --- STORE APIs ---
router.get('/', (req, res) => StoreController.getAll(req, res));
router.post('/', protect, (req, res) => StoreController.create(req, res));
router.get('/:id', (req, res) => StoreController.getOne(req, res));
router.put('/:id', protect, (req, res) => StoreController.update(req, res));
router.put('/:id/status', protect, admin, (req, res) => StoreController.updateStatus(req, res));
router.delete('/:id', protect, admin, (req, res) => StoreController.delete(req, res));

// --- PRODUCT APIs ---
const Product = require('../models/Product');
router.get('/:id/products', async (req, res) => {
    try {
        const products = await Product.find({ storeId: req.params.id });
        res.json(products);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/products', protect, async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.json({ success: true, product });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/:id/products/:productId', protect, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.productId, req.body, { new: true });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ success: true, product });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/:id/products/:productId', protect, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ success: true, message: 'Product deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
