const express = require('express');
const router = express.Router();
const StoreController = require('../controllers/StoreController');
const Store = require('../models/Store');
const { protect, admin, hasPerm } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { validate, storeSchema, storeUpdateSchema, productSchema, reviewSchema, memberAddSchema } = require('../middleware/validator');

// --- STORE APIs ---
router.get('/', (req, res) => StoreController.getAll(req, res));
router.post('/', protect, validate(storeSchema), (req, res) => StoreController.create(req, res));
router.get('/:id', (req, res) => StoreController.getOne(req, res));
router.put('/:id', protect, validate(storeUpdateSchema), (req, res) => StoreController.update(req, res));
router.put('/:id/status', protect, admin, (req, res) => StoreController.updateStatus(req, res));
router.delete('/:id', protect, admin, (req, res) => StoreController.delete(req, res));

// --- PRODUCT APIs ---
const Product = require('../models/Product');
router.get('/:id/products', async (req, res) => {
    try {
        const products = await Product.find({ storeId: req.params.id });
        return success(res, products);
    } catch (e) {
        return error(res, e.message);
    }
});

router.post('/products', protect, validate(productSchema), async (req, res) => {
    try {
        const store = await Store.findById(req.body.storeId);
        if (!store) return error(res, 'Store not found', 404);
        if (store.ownerId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return error(res, 'غير مصرح لك بإضافة منتجات لهذا المتجر', 403);
        }
        const product = await Product.create(req.body);
        return success(res, { product }, 201);
    } catch (e) {
        return error(res, e.message);
    }
});

router.put('/:id/products/:productId', protect, validate(productSchema), async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) return error(res, 'Store not found', 404);
        if (store.ownerId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return error(res, 'غير مصرح لك بتعديل هذا المنتج', 403);
        }
        const product = await Product.findById(req.params.productId);
        if (!product) return error(res, 'Product not found', 404);
        Object.assign(product, req.body);
        await product.save();
        return success(res, { product });
    } catch (e) {
        return error(res, e.message);
    }
});

router.delete('/:id/products/:productId', protect, async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) return error(res, 'Store not found', 404);
        if (store.ownerId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return error(res, 'غير مصرح لك بحذف هذا المنتج', 403);
        }
        const product = await Product.findByIdAndDelete(req.params.productId);
        if (!product) return error(res, 'Product not found', 404);
        return success(res, { message: 'Product deleted' });
    } catch (e) {
        return error(res, e.message);
    }
});

router.post('/:id/products/:productId/reviews', protect, validate(reviewSchema), async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const user = req.user.username;
        const product = await Product.findByIdAndUpdate(
            req.params.productId,
            { $push: { reviews: { user, rating: Number(rating), comment: comment || '', date: new Date() } } },
            { new: true }
        );
        if (!product) return error(res, 'Product not found', 404);
        return success(res, { product });
    } catch (e) {
        return error(res, e.message);
    }
});

// --- MEMBER APIs ---
router.post('/:id/members', protect, hasPerm('stores.manage'), validate(memberAddSchema), async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return error(res, 'userId required', 400);
        const store = await Store.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { members: userId } },
            { new: true }
        ).populate('members', 'username email');
        if (!store) return error(res, 'Store not found', 404);
        return success(res, { store });
    } catch (e) {
        return error(res, e.message);
    }
});

router.delete('/:id/members/:userId', protect, hasPerm('stores.manage'), async (req, res) => {
    try {
        const store = await Store.findByIdAndUpdate(
            req.params.id,
            { $pull: { members: req.params.userId } },
            { new: true }
        ).populate('members', 'username email');
        if (!store) return error(res, 'Store not found', 404);
        return success(res, { store });
    } catch (e) {
        return error(res, e.message);
    }
});

module.exports = router;
