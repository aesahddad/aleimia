const express = require('express');
const router = express.Router();
const StoreController = require('../controllers/StoreController');
const Store = require('../models/Store');
const { protect, admin, hasPerm } = require('../middleware/auth');
const { validate, storeSchema, productSchema } = require('../middleware/validator');

// --- STORE APIs ---
router.get('/', (req, res) => StoreController.getAll(req, res));
router.post('/', protect, validate(storeSchema), (req, res) => StoreController.create(req, res));
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

router.post('/products', protect, validate(productSchema), async (req, res) => {
    try {
        const store = await Store.findById(req.body.storeId);
        if (!store) return res.status(404).json({ error: 'Store not found' });
        if (store.ownerId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح لك بإضافة منتجات لهذا المتجر' });
        }
        const product = await Product.create(req.body);
        res.json({ success: true, product });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/:id/products/:productId', protect, validate(productSchema), async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) return res.status(404).json({ error: 'Store not found' });
        if (store.ownerId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح لك بتعديل هذا المنتج' });
        }
        const product = await Product.findById(req.params.productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        Object.assign(product, req.body);
        await product.save();
        res.json({ success: true, product });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/:id/products/:productId', protect, async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) return res.status(404).json({ error: 'Store not found' });
        if (store.ownerId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'غير مصرح لك بحذف هذا المنتج' });
        }
        const product = await Product.findByIdAndDelete(req.params.productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ success: true, message: 'Product deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/:id/products/:productId/reviews', protect, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        if (!rating) return res.status(400).json({ error: 'التقييم مطلوب' });
        const user = req.user.username;
        const product = await Product.findByIdAndUpdate(
            req.params.productId,
            { $push: { reviews: { user, rating: Number(rating), comment: comment || '', date: new Date() } } },
            { new: true }
        );
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ success: true, product });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- MEMBER APIs ---
router.post('/:id/members', protect, hasPerm('stores.manage'), async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });
        const store = await Store.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { members: userId } },
            { new: true }
        ).populate('members', 'username email');
        if (!store) return res.status(404).json({ error: 'Store not found' });
        res.json({ success: true, store });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/:id/members/:userId', protect, hasPerm('stores.manage'), async (req, res) => {
    try {
        const store = await Store.findByIdAndUpdate(
            req.params.id,
            { $pull: { members: req.params.userId } },
            { new: true }
        ).populate('members', 'username email');
        if (!store) return res.status(404).json({ error: 'Store not found' });
        res.json({ success: true, store });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
