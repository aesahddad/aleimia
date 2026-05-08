const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    status: { type: String, enum: ['active', 'expired', 'canceled', 'pending'], default: 'pending' },
    startDate: { type: Date },
    endDate: { type: Date },
    paymentMethod: { type: String },
    paymentReference: { type: String },
    autoRenew: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
