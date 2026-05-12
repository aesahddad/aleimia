const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const { protect, admin } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { validate, tabsSchema } = require('../middleware/validator');
const logger = require('../shared/logger');

const CONFIG_PATH = path.join(__dirname, '../../frontend/config/tabs.json');
const ROUTES_PATH = path.join(__dirname, '../../frontend/config/routes.json');

// Ensure config exists
if (!fs.existsSync(CONFIG_PATH)) {
    const defaultTabs = [
        { id: 'platform', label: 'الرئيسية', type: 'module', visible: true, order: 1, icon: 'fas fa-home' },
        { id: 'haraj', label: 'حراج', type: 'module', visible: true, order: 2, icon: 'fas fa-car' },
        { id: 'estate', label: 'عقار', type: 'module', visible: true, order: 3, icon: 'fas fa-building' },
        { id: 'freelancer', label: 'خدمات', type: 'module', visible: true, order: 4, icon: 'fas fa-laptop' },
        { id: 'jobs', label: 'وظائف', type: 'module', visible: true, order: 5, icon: 'fas fa-briefcase' },
    ];
    fs.outputJsonSync(CONFIG_PATH, defaultTabs, { spaces: 4 });
}

// GET Tabs
router.get('/', async (req, res) => {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const tabs = await fs.readJson(CONFIG_PATH);
            return success(res, tabs.sort((a, b) => a.order - b.order));
        }
        return success(res, [
            { id: 'platform', label: 'الرئيسية', icon: 'fas fa-home', visible: true, order: 1 },
            { id: 'haraj', label: 'حراج', icon: 'fas fa-car', visible: true, order: 2 },
            { id: 'estate', label: 'عقار', icon: 'fas fa-building', visible: true, order: 3 },
            { id: 'freelancer', label: 'فريلانسر', icon: 'fas fa-laptop-code', visible: true, order: 4 },
            { id: 'jobs', label: 'وظائف', icon: 'fas fa-briefcase', visible: true, order: 5 }
        ]);
    } catch (e) {
        logger.error("Tabs Read Error:", e);
        return success(res, [
            { id: 'platform', label: 'الرئيسية', icon: 'fas fa-home', visible: true, order: 1 },
            { id: 'haraj', label: 'حراج', icon: 'fas fa-car', visible: true, order: 2 },
            { id: 'estate', label: 'عقار', icon: 'fas fa-building', visible: true, order: 3 },
            { id: 'error', label: 'خطأ', icon: 'fas fa-exclamation-triangle', visible: true, order: 99 }
        ]);
    }
});

// SAVE Tabs
router.post('/', protect, admin, async (req, res) => {
    try {
        const tabs = req.body;
        if (!Array.isArray(tabs)) return error(res, 'Tabs must be an array', 400);
        await fs.writeJson(CONFIG_PATH, tabs, { spaces: 4 });
        return success(res, { message: 'Tabs saved' });
    } catch (e) {
        return error(res, e.message);
    }
});

module.exports = router;

