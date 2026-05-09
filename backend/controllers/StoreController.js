const Store = require('../models/Store');
const Product = require('../models/Product');
const Validator = require('../utils/validator');

/**
 * @class StoreController
 * @description Controller for Store management.
 */
class StoreController {
    /**
     * @route GET /api/stores
     */
    static async getAll(req, res) {
        try {
            const { q, status, admin, page = 1, limit = 20 } = req.query;
            let query = {};

            if (admin === 'true') {
                if (status) query.status = status;
                else query.status = { $ne: 'deleted' };
            } else {
                query.status = 'active';
            }

            if (q) {
                query.$or = [
                    { name: new RegExp(q, 'i') },
                    { slug: new RegExp(q, 'i') }
                ];
            }

            const pg = Math.max(1, parseInt(page));
            const lm = Math.min(100, Math.max(1, parseInt(limit)));
            const skip = (pg - 1) * lm;
            const [stores, total] = await Promise.all([
                Store.find(query).populate('ownerId', 'username email').populate('members', 'username email').sort('-createdAt').skip(skip).limit(lm),
                Store.countDocuments(query)
            ]);

            // Shuffle randomly for public visitors so all stores get fair visibility
            if (admin !== 'true') {
                for (let i = stores.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [stores[i], stores[j]] = [stores[j], stores[i]];
                }
            }

            res.set('X-Total-Count', total);
            res.set('X-Total-Pages', Math.ceil(total / lm));
            res.json(stores);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route POST /api/stores
     */
    static async create(req, res) {
        try {
            const data = req.body;
            const validation = Validator.validateStore(data);
            if (!validation.isValid) {
                return res.status(400).json({ error: validation.errors[0] });
            }

            // Generate Slug
            let slug = data.name.toLowerCase().trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
            slug += '-' + Math.random().toString(36).substr(2, 5);
            data.slug = slug;

            const newStore = await Store.create(data);
            res.status(201).json({ success: true, store: newStore });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route GET /api/stores/:id
     */
    static async getOne(req, res) {
        try {
            const { id } = req.params;
            let store = id.match(/^[0-9a-fA-F]{24}$/) ? await Store.findById(id).populate('members', 'username email') : await Store.findOne({ slug: id }).populate('members', 'username email');
            
            if (!store) return res.status(404).json({ error: 'Store not found' });
            res.json(store);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route PUT /api/stores/:id
     */
    static async update(req, res) {
        try {
            const store = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!store) return res.status(404).json({ error: 'Store not found' });
            res.json({ success: true, store });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route PUT /api/stores/:id/status
     */
    static async updateStatus(req, res) {
        try {
            const { status } = req.body;
            if (!['active', 'frozen', 'deleted'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const store = await Store.findByIdAndUpdate(req.params.id, { status }, { new: true });
            if (!store) return res.status(404).json({ error: 'Store not found' });
            
            res.json({ success: true, store });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route DELETE /api/stores/:id
     */
    static async delete(req, res) {
        try {
            // Soft delete
            const store = await Store.findByIdAndUpdate(req.params.id, { status: 'deleted' }, { new: true });
            if (!store) return res.status(404).json({ error: 'Store not found' });
            res.json({ success: true, message: 'Store marked as deleted' });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = StoreController;
