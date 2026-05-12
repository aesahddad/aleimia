const express = require('express');
const router = express.Router();
const AdController = require('../controllers/AdController');
const { protect, admin } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { validate, adSchema } = require('../middleware/validator');
const multer = require('multer');
const fs = require('fs-extra');

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = 'backend/uploads/';
        fs.ensureDirSync(dest);
        cb(null, dest);
    },
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// --- AD APIs ---
router.get('/', (req, res) => AdController.getAll(req, res));
router.get('/:id', (req, res) => AdController.getOne(req, res));

router.post('/', protect, (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (err) return error(res, err.message, 400);
        next();
    });
}, validate(adSchema), (req, res) => AdController.create(req, res));

router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'pending', 'rejected', 'deleted'].includes(status)) return error(res, 'Invalid status', 400);
        const ad = await require('../models/Ad').findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!ad) return error(res, 'Ad not found', 404);
        return success(res, { ad });
    } catch (e) {
        return error(res, e.message);
    }
});
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const ad = await require('../models/Ad').findByIdAndUpdate(req.params.id, { status: 'deleted' }, { new: true });
        if (!ad) return error(res, 'Ad not found', 404);
        return success(res, { message: 'Ad deleted' });
    } catch (e) {
        return error(res, e.message);
    }
});

module.exports = router;
