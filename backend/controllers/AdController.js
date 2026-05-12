const Ad = require('../models/Ad');
const { success, error } = require('../utils/response');

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
            return success(res, ads);
        } catch (e) {
            return error(res, e.message);
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

            const newAd = await Ad.create(data);
            return success(res, { ad: newAd, message: 'تم نشر إعلانك بنجاح' }, 201);
        } catch (e) {
            return error(res, e.message);
        }
    }

    /**
     * @route GET /api/ads/:id
     */
    static async getOne(req, res) {
        try {
            const ad = await Ad.findById(req.params.id);
            if (!ad) return error(res, 'Ad not found', 404);

            ad.views += 1;
            await ad.save();

            return success(res, ad);
        } catch (e) {
            return error(res, e.message);
        }
    }

    /**
     * @route PUT /api/ads/:id/status
     */
    static async updateStatus(req, res) {
        try {
            const { status } = req.body;
            if (!['active', 'pending', 'rejected', 'deleted'].includes(status)) {
                return error(res, 'Invalid status', 400);
            }

            const ad = await Ad.findByIdAndUpdate(req.params.id, { status }, { new: true });
            if (!ad) return error(res, 'Ad not found', 404);

            return success(res, { ad });
        } catch (e) {
            return error(res, e.message);
        }
    }

    /**
     * @route DELETE /api/ads/:id
     */
    static async delete(req, res) {
        try {
            const ad = await Ad.findByIdAndUpdate(req.params.id, { status: 'deleted' }, { new: true });
            if (!ad) return error(res, 'Ad not found', 404);
            return success(res, { message: 'Ad marked as deleted' });
        } catch (e) {
            return error(res, e.message);
        }
    }
}

module.exports = AdController;
