const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { protect, admin } = require('../middleware/auth');

// All admin routes are protected
router.use(protect, admin);

router.get('/stats', (req, res) => AdminController.getStats(req, res));
router.get('/settings', (req, res) => AdminController.getSettings(req, res));
router.put('/settings', (req, res) => AdminController.updateSettings(req, res));

module.exports = router;
