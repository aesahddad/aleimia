const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, unique: true }, // For friendly URLs if needed
    category: String,
    imageUrl: String, // Cover/Card Image
    description: String,

    // Store Identity & Config
    theme: { type: Object, default: { color: '#1e3a8a', logo: '' } }, // Blue-900 default
    branding: {
        logo: { type: String, default: '' },
        cover: { type: String, default: '' },
        primaryColor: { type: String, default: '#1e3a8a' },
        promoVideo: { type: String, default: '' }, // YouTube/Video Link
        specifications: { type: String, default: '' } // Full Store Bio/Specs for Sidebar
    },

    // Business & Legal
    financial: {
        iban: { type: String, default: '' },
        crNumber: { type: String, default: '' }, // Commercial Registration
        taxNumber: { type: String, default: '' },
        whatsapp: { type: String, default: '' } // For Customer Chat/Payments
    },

    // Subscription System
    status: { type: String, enum: ['pending', 'active', 'frozen', 'moderation', 'deleted', 'suspended'], default: 'pending' },
    subscription: {
        plan: { type: String, default: 'free' }, // starter, monthly, annual
        startDate: { type: Date },
        endDate: { type: Date }
    },

    // Owner
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Metrics (Simple Counters for now)
    stats: {
        visits: { type: Number, default: 0 },
        sales: { type: Number, default: 0 }
    }
}, { timestamps: true });

StoreSchema.index({ slug: 1 });
StoreSchema.index({ status: 1 });
StoreSchema.index({ category: 1 });
StoreSchema.index({ name: 1 });

module.exports = mongoose.model('Store', StoreSchema);
