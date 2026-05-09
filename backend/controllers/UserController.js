const User = require('../models/User');

/**
 * @class UserController
 * @description Controller for User/Member management.
 */
class UserController {
    /**
     * @route GET /api/users
     */
    static async getAll(req, res) {
        try {
            const { q, role, status, page = 1, limit = 20 } = req.query;
            let query = {};

            if (role && role !== 'all') query.role = role;
            if (status && status !== 'all') query.status = status;

            if (q) {
                query.$or = [
                    { username: new RegExp(q, 'i') },
                    { email: new RegExp(q, 'i') }
                ];
            }

            const pg = Math.max(1, parseInt(page));
            const lm = Math.min(100, Math.max(1, parseInt(limit)));
            const skip = (pg - 1) * lm;
            const [users, total] = await Promise.all([
                User.find(query).select('-password').sort('-createdAt').skip(skip).limit(lm),
                User.countDocuments(query)
            ]);
            res.set('X-Total-Count', total);
            res.set('X-Total-Pages', Math.ceil(total / lm));
            res.json(users);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route PUT /api/users/:id/role
     */
    static async updateRole(req, res) {
        try {
            const { role } = req.body;
            if (!['customer', 'merchant', 'admin'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }

            const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
            if (!user) return res.status(404).json({ error: 'User not found' });

            res.json({ success: true, user });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route PUT /api/users/:id/permissions
     */
    static async updatePermissions(req, res) {
        try {
            const { permissions } = req.body;
            if (!permissions || typeof permissions !== 'object') {
                return res.status(400).json({ error: 'Permissions object required' });
            }
            const user = await User.findByIdAndUpdate(req.params.id, { permissions }, { new: true }).select('-password');
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json({ success: true, user });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route PUT /api/users/:id/status
     */
    static async updateStatus(req, res) {
        try {
            const { status } = req.body;
            if (!['active', 'banned'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
            if (!user) return res.status(404).json({ error: 'User not found' });

            res.json({ success: true, user });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * @route DELETE /api/users/:id
     */
    static async delete(req, res) {
        try {
            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json({ success: true, message: 'User deleted successfully' });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = UserController;
