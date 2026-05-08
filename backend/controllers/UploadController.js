const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const UPLOAD_DIR = path.resolve(__dirname, '../uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let subDir = 'images';
        if (file.mimetype.startsWith('video')) subDir = 'videos';
        if (file.mimetype.includes('glb') || file.originalname.endsWith('.glb')) subDir = 'models';
        const dest = path.join(UPLOAD_DIR, subDir);
        fs.ensureDirSync(dest);
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + '-' + Math.random().toString(36).substr(2, 6) + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for GLB files
    fileFilter: (req, file, cb) => {
        const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const allowedVideos = ['video/mp4', 'video/webm'];
        const allowedModels = ['model/gltf-binary', 'model/gltf+json'];
        const ext = path.extname(file.originalname).toLowerCase();
        const isImage = allowedImages.includes(file.mimetype);
        const isVideo = allowedVideos.includes(file.mimetype);
        const isModel = allowedModels.includes(file.mimetype) || ext === '.glb' || ext === '.gltf';
        if (isImage || isVideo || isModel) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: images, videos, GLB models'), false);
        }
    }
});

class UploadController {
    static async uploadFile(req, res) {
        try {
            if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
            const relativePath = path.relative(UPLOAD_DIR, req.file.path).replace(/\\/g, '/');
            const url = `/api/uploads/${relativePath}`;
            res.json({ success: true, url, filename: req.file.filename });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    static async uploadMultiple(req, res) {
        try {
            if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
            const urls = req.files.map(f => {
                const relativePath = path.relative(UPLOAD_DIR, f.path).replace(/\\/g, '/');
                return `/api/uploads/${relativePath}`;
            });
            res.json({ success: true, urls });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}

UploadController.multerUpload = upload;
UploadController.uploadSingle = upload.single('file');
UploadController.uploadMultipleFiles = upload.array('files', 10);

module.exports = UploadController;
