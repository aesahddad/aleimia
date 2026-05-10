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

            const defaultPermissions = {
                stores: { manage: false, simulate: false, activate: false, freeze: false, delete: false },
                ads: { manage: false, approve: false, reject: false, delete: false },
                ops: { manage: false, tickets: false, refunds: false },
                moderation: { manage: false, content_review: false, ban_users: false },
                users: { manage: false, edit_roles: false },
                dashboard: { view: false },
                products: { manage: false, approve: false, delete: false },
                settings: { view: false, manage: false },
                subscriptions: { view: false, manage: false },
                reviews: { manage: false, delete: false },
                tabs: { manage: false },
                trash: { view: false, restore: false }
            };

            let permissions = { ...defaultPermissions };

            if (role === 'admin') {
                permissions = {
                    stores: { manage: true, simulate: true, activate: true, freeze: true, delete: true },
                    ads: { manage: true, approve: true, reject: true, delete: true },
                    ops: { manage: true, tickets: true, refunds: true },
                    moderation: { manage: true, content_review: true, ban_users: true },
                    users: { manage: true, edit_roles: true },
                    dashboard: { view: true },
                    products: { manage: true, approve: true, delete: true },
                    settings: { view: true, manage: true },
                    subscriptions: { view: true, manage: true },
                    reviews: { manage: true, delete: true },
                    tabs: { manage: true },
                    trash: { view: true, restore: true }
                };
            } else if (role === 'merchant') {
                permissions = {
                    ...defaultPermissions,
                    stores: { manage: true, simulate: false, activate: false, freeze: false, delete: false },
                    dashboard: { view: true }
                };
            }

            const user = await User.findByIdAndUpdate(req.params.id, { role, permissions }, { new: true }).select('-password');
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
     * @route PUT /api/users/:id
     */
    static async update(req, res) {
        try {
            const { username, email, password } = req.body;
            const update = {};
            if (username !== undefined) update.username = username;
            if (email !== undefined) update.email = email;
            if (password) update.password = password;

            if (Object.keys(update).length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('-password');
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
