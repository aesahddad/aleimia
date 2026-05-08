const Ad = require('../models/Ad');
const fs = require('fs-extra');
const path = require('path');
const Validator = require('../utils/validator');

/**
 * @class AdController
 * @description Controller for Advertisement management.
 */
class AdController {
    /**
     * @route GET /api/ads
     */
    static async getAll(req, res) {
        try {
            const { category, q, admin, page = 1, limit = 20 } = req.query;
            let query = {};

            if (admin === 'true') {
                query.status = { $ne: 'deleted' };
            } else {
                query.status = 'active';
            }

            if (category && category !== 'all') {
                query.category = category;
            }

            if (q) {
                query.$or = [
                    { title: new RegExp(q, 'i') },
                    { description: new RegExp(q, 'i') }
                ];
            }

            const pg = Math.max(1, parseInt(page));
            const lm = Math.min(100, Math.max(1, parseInt(limit)));
            const skip = (pg - 1) * lm;
            const [ads, total] = await Promise.all([
                Ad.find(query).sort({ createdAt: -1 }).skip(skip).limit(lm),
                Ad.countDocuments(query)
            ]);
            res.set('X-Total-Count', total);
            res.set('X-Total-Pages', Math.ceil(total / lm));
            res.json(ads);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route POST /api/ads
     */
    static async create(req, res) {
        try {
            const data = req.body;

            // Handle Uploaded Images (Multer logic is usually in middleware)
            if (req.files && req.files.length > 0) {
                const fileUrls = req.files.map(file => `/api/uploads/${file.filename}`);
                data.images = fileUrls;
                data.imageUrl = fileUrls[0];
            }

            const validation = Validator.validateAd(data);
            if (!validation.isValid) {
                return res.status(400).json({ error: validation.errors[0] });
            }

            const newAd = await Ad.create(data);
            res.status(201).json({ success: true, ad: newAd, message: 'تم نشر إعلانك بنجاح' });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route GET /api/ads/:id
     */
    static async getOne(req, res) {
        try {
            const ad = await Ad.findById(req.params.id);
            if (!ad) return res.status(404).json({ error: 'Ad not found' });

            // Increment Views (Side effect)
            ad.views += 1;
            await ad.save();

            res.json(ad);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route PUT /api/ads/:id/status
     */
    static async updateStatus(req, res) {
        try {
            const { status } = req.body;
            if (!['active', 'pending', 'rejected', 'deleted'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const ad = await Ad.findByIdAndUpdate(req.params.id, { status }, { new: true });
            if (!ad) return res.status(404).json({ error: 'Ad not found' });

            res.json({ success: true, ad });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route DELETE /api/ads/:id
     */
    static async delete(req, res) {
        try {
            // Soft delete
            const ad = await Ad.findByIdAndUpdate(req.params.id, { status: 'deleted' }, { new: true });
            if (!ad) return res.status(404).json({ error: 'Ad not found' });
            res.json({ success: true, message: 'Ad marked as deleted' });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = AdController;
