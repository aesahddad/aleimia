const SubscriptionPlan = require('../models/SubscriptionPlan');
const Subscription = require('../models/Subscription');

class SubscriptionController {
    static async getPlans(req, res) {
        try {
            const plans = await SubscriptionPlan.find({ active: true }).sort({ order: 1 });
            res.json(plans);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    static async getAllPlans(req, res) {
        try {
            const plans = await SubscriptionPlan.find().sort({ order: 1 });
            res.json(plans);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    static async createPlan(req, res) {
        try {
            const plan = await SubscriptionPlan.create(req.body);
            res.status(201).json({ success: true, plan });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    static async updatePlan(req, res) {
        try {
            const allowed = ['name', 'slug', 'price', 'originalPrice', 'duration', 'discount', 'features', 'highlighted', 'recommended', 'badge', 'active', 'contactOnly', 'order'];
            const update = {};
            allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
            const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
            if (!plan) return res.status(404).json({ error: 'Plan not found' });
            res.json({ success: true, plan });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    static async deletePlan(req, res) {
        try {
            await SubscriptionPlan.findByIdAndDelete(req.params.id);
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    static async seedPlans(req, res) {
        try {
            const count = await SubscriptionPlan.countDocuments();
            if (count > 0) return res.json({ message: 'Plans already seeded' });

            const plans = [
                { name: 'المتجر الأساسي', slug: 'basic', price: 0, originalPrice: 0, duration: 'monthly', discount: 'مجاني', features: ['متجر واحد', 'منتج واحد', 'دعم عبر البريد'], order: 1 },
                { name: 'المتجر البرونزي', slug: 'bronze', price: 49, originalPrice: 99, duration: 'monthly', discount: '50%', features: ['متجر واحد', 'منتجات غير محدودة', 'دعم فني', 'إحصائيات'], order: 2 },
                { name: 'المتجر الفضي', slug: 'silver', price: 99, originalPrice: 199, duration: 'monthly', discount: '50%', features: ['متجرين', 'منتجات غير محدودة', 'دعم فني فوري', 'إحصائيات متقدمة', 'وسام موثق'], highlighted: true, order: 3 },
                { name: 'المتجر الذهبي', slug: 'gold', price: 199, originalPrice: 399, duration: 'monthly', discount: '50%', features: ['متاجر غير محدودة', 'منتجات غير محدودة', 'دعم فني VIP', 'إحصائيات متقدمة', 'وسام موثق', 'إعلانات مجانية'], recommended: true, badge: 'الأكثر مبيعاً', order: 4 },
                { name: 'الباقة السنوية البرونزية', slug: 'bronze-yearly', price: 399, originalPrice: 588, duration: 'yearly', discount: '32%', features: ['متجر واحد', 'منتجات غير محدودة', 'دعم فني', 'توفير 189 ريال'], order: 5 },
                { name: 'الباقة السنوية الذهبية', slug: 'gold-yearly', price: 1499, originalPrice: 2388, duration: 'yearly', discount: '37%', features: ['متاجر غير محدودة', 'منتجات غير محدودة', 'دعم VIP', 'توفير 889 ريال'], highlighted: true, badge: 'الأفضل', order: 6 },
                { name: 'الشركات والبرندات', slug: 'enterprise', price: 4999, originalPrice: 9999, duration: 'monthly', discount: '50%', features: ['متاجر غير محدودة', 'منتجات غير محدودة', 'دعم VIP مخصص', 'إعلانات ممولة', 'رفع أولوية', 'استشارات تسويقية', 'مساحة تخزين إضافية', 'تقارير متقدمة', 'حساب مسؤولين متعدد'], highlighted: true, badge: 'للشركات', contactOnly: true, order: 7 },
            ];

            await SubscriptionPlan.insertMany(plans);
            res.json({ success: true, count: plans.length });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    static async getUserSubscription(req, res) {
        try {
            const sub = await Subscription.findOne({ userId: req.user._id }).sort({ createdAt: -1 }).populate('planId');
            res.json(sub || null);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    static async subscribe(req, res) {
        try {
            const { planId, storeId } = req.body;
            const plan = await SubscriptionPlan.findById(planId);
            if (!plan) return res.status(404).json({ error: 'Plan not found' });

            const sub = await Subscription.create({
                userId: req.user._id,
                planId,
                storeId,
                status: 'pending',
                startDate: new Date()
            });

            res.json({ success: true, subscription: sub });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = SubscriptionController;
