const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/UploadController');
const { protect } = require('../middleware/auth');

router.post('/', protect, (req, res) => {
    UploadController.uploadSingle(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        UploadController.uploadFile(req, res);
    });
});

router.post('/multiple', protect, (req, res) => {
    UploadController.uploadMultipleFiles(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        UploadController.uploadMultiple(req, res);
    });
});

module.exports = router;
