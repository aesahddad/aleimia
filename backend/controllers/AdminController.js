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
            logger.error('Admin Stats Error:', e);
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
     * @route POST /api/admin/register-partner-supplier
     */
    static async registerPartnerSupplier(req, res) {
        try {
            const { name, mobile, email } = req.body;
            const settings = await SystemSettings.findById('global_settings');
            if (!settings?.enablePaymentGateway || !settings?.myfatoorah?.apiKey) {
                return res.status(400).json({ error: 'بوابة الدفع غير مفعلة' });
            }
            const baseUrl = settings.myfatoorah?.mode === 'live'
                ? 'https://api.myfatoorah.com'
                : 'https://apitest.myfatoorah.com';
            const mfRes = await fetch(`${baseUrl}/v2/CreateSupplier`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.myfatoorah.apiKey}`
                },
                body: JSON.stringify({
                    SupplierName: name || 'الشريك',
                    SupplierMobile: mobile || '',
                    SupplierEmail: email || ''
                })
            });
            const mfData = await mfRes.json();
            if (!mfRes.ok) return res.status(500).json({ error: mfData.Message || 'فشل تسجيل الشريك' });
            const supplierCode = mfData.SupplierCode || mfData.Data?.SupplierCode;
            if (!supplierCode) return res.status(500).json({ error: 'لم يتم الحصول على كود الشريك' });
            await SystemSettings.findByIdAndUpdate('global_settings', {
                'myfatoorah.partnerSupplierCode': supplierCode
            }, { new: true, upsert: true });
            res.json({ success: true, supplierCode, message: `✅ تم تسجيل ${name || 'الشريك'} برقم ${supplierCode}` });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route PUT /api/admin/settings
     */
    static async updateSettings(req, res) {
        try {
            const allowed = ['maintenanceMode', 'announcement', 'allowNewMerchants', 'allowGuestAds', 'enablePaymentGateway', 'enableDeliveryService', 'commissionPercent', 'promoVideoUrl', 'promoVideoPlansUrl', 'adminWhatsapp', 'adminEmail', 'websiteUrl', 'myfatoorah'];
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


