const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const Product = require('../models/Product');
const SystemSettings = require('../models/SystemSettings');

const logger = require('../shared/logger');

// 1. Status Check (Maintenance Aware)
router.get('/status', async (req, res) => {
    try {
        const settings = await SystemSettings.findById('global_settings');
        const data = {
            status: 'OK',
            version: process.env.npm_package_version || '4.2.0',
            maintenanceMode: settings?.maintenanceMode || false,
            announcement: settings?.announcement || '',
            promoVideoUrl: settings?.promoVideoUrl || '',
            promoVideoPlansUrl: settings?.promoVideoPlansUrl || ''
        };
        if (settings?.maintenanceMode) {
            return res.status(503).json({ ...data, status: 'Maintenance' });
        }
        res.json(data);
    } catch (e) {
        logger.error('Status Check Failed:', e);
        res.status(500).json({ status: 'Error', message: 'Internal Server Error' });
    }
});

// 2. Global Search
const SearchService = require('../services/SearchService');
router.get('/search', async (req, res) => {
    try {
        const results = await SearchService.globalSearch(req.query.q);
        res.json(results);
    } catch (e) {
        logger.error('Search Failed:', e);
        res.status(500).json({ error: 'حدث خطأ أثناء البحث' });
    }
});

// 3. System Initialization (Singleton)
const ensureSettingsDB = async () => {
    try {
        const exists = await SystemSettings.findById('global_settings');
        if (!exists) {
            logger.info('Initializing Global Settings in DB...');
            await SystemSettings.create({
                _id: 'global_settings',
                maintenanceMode: false,
                announcement: 'مرحباً بكم في منصة العينية - النسخة الاحترافية 4.2',
                allowNewMerchants: true,
                allowGuestAds: true,
                enablePaymentGateway: false,
                enableDeliveryService: false
            });
        }
    } catch (e) {
        logger.error('System Initialization Failed:', e);
    }
};
ensureSettingsDB();

module.exports = router;
