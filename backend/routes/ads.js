const express = require('express');
const router = express.Router();
const AdController = require('../controllers/AdController');
const { protect, admin } = require('../middleware/auth');
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

router.post('/', (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}, validate(adSchema), (req, res) => AdController.create(req, res));

router.put('/:id/status', protect, admin, (req, res) => AdController.updateStatus(req, res));
router.delete('/:id', protect, admin, (req, res) => AdController.delete(req, res));

module.exports = router;
