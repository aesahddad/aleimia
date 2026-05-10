const SystemSettings = require('../models/SystemSettings');
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Ad = require('../models/Ad');

/**
 * @class AdminController
 * @description Controller for global administrative operations and system-wide statistics.
 */
class AdminController {
    /**
     * @route GET /api/admin/stats
     */
    static async getStats(req, res) {
        try {
            // "Radical Honesty": Ensure we handle missing models or empty DB gracefully
            const [users, stores, ads, products] = await Promise.all([
                User.countDocuments({}),
                Store.countDocuments({ status: { $ne: 'deleted' } }),
                Ad.countDocuments({ status: { $ne: 'deleted' } }),
                Product.countDocuments({})
            ]);

            res.json({
                users: { total: users },
                stores: { total: stores },
                ads: { total: ads },
                products: { total: products },
                timestamp: new Date()
            });
        } catch (e) {
            console.error('Admin Stats Error:', e);
            res.status(500).json({ error: 'فشل في استخراج إحصائيات النظام' });
        }
    }

    /**
     * @route GET /api/admin/settings
     */
    static async getSettings(req, res) {
        try {
            const settings = await SystemSettings.findById('global_settings');
            res.json(settings || {
                maintenanceMode: false,
                announcement: '',
                allowNewMerchants: true,
                allowGuestAds: true
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route PUT /api/admin/settings
     */
    static async updateSettings(req, res) {
        try {
            const allowed = ['maintenanceMode', 'announcement', 'allowNewMerchants', 'allowGuestAds', 'enablePaymentGateway', 'enableDeliveryService', 'commissionPercent', 'promoVideoUrl', 'promoVideoPlansUrl', 'adminWhatsapp', 'adminEmail', 'websiteUrl'];
            const update = {};
            allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
            const settings = await SystemSettings.findByIdAndUpdate(
                'global_settings',
                update,
                { new: true, upsert: true, runValidators: true }
            );
            res.json({ success: true, settings });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = AdminController;
