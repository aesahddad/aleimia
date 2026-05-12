const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { protect, admin, hasPerm } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { validate, settingsUpdateSchema } = require('../middleware/validator');
const Order = require('../models/Order');
const logger = require('../shared/logger');

// All admin routes are protected
router.use(protect);

router.get('/stats', hasPerm('dashboard.view'), (req, res) => AdminController.getStats(req, res));
router.get('/settings', hasPerm('settings.view'), (req, res) => AdminController.getSettings(req, res));
router.put('/settings', hasPerm('settings.manage'), validate(settingsUpdateSchema), (req, res) => AdminController.updateSettings(req, res));
router.post('/register-partner-supplier', hasPerm('settings.manage'), (req, res) => AdminController.registerPartnerSupplier(req, res));

router.get('/reviews', hasPerm('reviews.manage'), async (req, res) => {
    try {
        const products = await Product.find({ 'reviews.0': { $exists: true } }).populate('storeId', 'name');
        const reviews = [];
        products.forEach(product => {
            product.reviews.forEach(r => {
                reviews.push({
                    _id: r._id, user: r.user, rating: r.rating,
                    comment: r.comment, date: r.date,
                    productId: product._id, productName: product.name,
                    storeId: product.storeId?._id, storeName: product.storeId?.name || 'غير معروف'
                });
            });
        });
        reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        return success(res, reviews);
    } catch (e) {
        return error(res, e.message);
    }
});

// --- Orders Management ---
router.get('/orders', hasPerm('subscriptions.view'), async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const query = {};
        if (status && status !== 'all') query.status = status;
        const pg = Math.max(1, parseInt(page));
        const lm = Math.min(100, Math.max(1, parseInt(limit)));
        const [orders, total] = await Promise.all([
            Order.find(query).populate('storeId', 'name').sort('-createdAt').skip((pg - 1) * lm).limit(lm),
            Order.countDocuments(query)
        ]);
        res.set('X-Total-Count', total);
        return success(res, orders);
    } catch (e) {
        return error(res, e.message);
    }
});

router.put('/orders/:id/status', hasPerm('subscriptions.manage'), async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'paid', 'failed', 'cancelled'].includes(status)) {
            return error(res, 'Invalid status', 400);
        }
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) return error(res, 'Order not found', 404);
        return success(res, { order });
    } catch (e) {
        return error(res, e.message);
    }
});

// MyFatoorah Payment Status Check
router.post('/payments/check/:ref', hasPerm('subscriptions.view'), async (req, res) => {
    try {
        const SystemSettings = require('../models/SystemSettings');
        const settings = await SystemSettings.findById('global_settings');
        if (!settings?.enablePaymentGateway || !settings?.myfatoorah?.apiKey) {
            return error(res, 'بوابة الدفع غير مفعلة', 400);
        }
        const baseUrl = settings.myfatoorah.mode === 'live' ? 'https://api.myfatoorah.com' : 'https://apitest.myfatoorah.com';
        const mfRes = await fetch(`${baseUrl}/v2/GetPaymentStatus`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.myfatoorah.apiKey}` },
            body: JSON.stringify({ Key: req.params.ref, KeyType: 'InvoiceId' })
        });
        const mfData = await mfRes.json();
        return success(res, mfData);
    } catch (e) {
        logger.error('Payment Status Check Error:', e);
        return error(res, e.message);
    }
});

router.delete('/reviews/:productId/:reviewId', hasPerm('reviews.delete'), async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.productId,
            { $pull: { reviews: { _id: req.params.reviewId } } },
            { new: true }
        );
        if (!product) return error(res, 'المنتج غير موجود', 404);
        return success(res, { message: 'تم حذف التقييم' });
    } catch (e) {
        return error(res, e.message);
    }
});

module.exports = router;
