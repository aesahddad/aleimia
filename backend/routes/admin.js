const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { protect, admin, adminOrHasPerm } = require('../middleware/auth');

// All admin routes are protected
router.use(protect, adminOrHasPerm);

router.get('/stats', (req, res) => AdminController.getStats(req, res));
router.get('/settings', (req, res) => AdminController.getSettings(req, res));
router.put('/settings', (req, res) => AdminController.updateSettings(req, res));

router.get('/reviews', async (req, res) => {
    try {
        const products = await Product.find({ 'reviews.0': { $exists: true } }).populate('storeId', 'name');
        const reviews = [];
        products.forEach(product => {
            product.reviews.forEach(r => {
                reviews.push({
                    _id: r._id,
                    user: r.user,
                    rating: r.rating,
                    comment: r.comment,
                    date: r.date,
                    productId: product._id,
                    productName: product.name,
                    storeId: product.storeId?._id,
                    storeName: product.storeId?.name || 'غير معروف'
                });
            });
        });
        reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(reviews);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/reviews/:productId/:reviewId', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.productId,
            { $pull: { reviews: { _id: req.params.reviewId } } },
            { new: true }
        );
        if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });
        res.json({ success: true, message: 'تم حذف التقييم' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
