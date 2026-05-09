const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    duration: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    discount: { type: String },
    features: [{ type: String }],
    highlighted: { type: Boolean, default: false },
    recommended: { type: Boolean, default: false },
    badge: { type: String },
    active: { type: Boolean, default: true },
    contactOnly: { type: Boolean, default: false }, // true = enterprise/brands, WhatsApp only
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
