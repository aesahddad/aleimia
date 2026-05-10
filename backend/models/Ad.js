const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
    title: { type: String },
    description: { type: String },
    category: { type: String, default: 'haraj' }, // haraj, estate, etc.
    price: { type: Number },

    // Media
    imageUrl: { type: String }, // Main Thumbnail (Legacy/Cover)
    images: { type: [String], default: [] }, // All Images
    videoUrl: { type: String },

    // Specific Fields
    valLicense: { type: String }, // For Estate Only
    location: { type: String }, // Google Maps/Earth Link
    enableChat: { type: Boolean, default: false },

    // Contact
    contactNumber: { type: String },
    whatsappLink: { type: String },

    // Status
    status: { type: String, enum: ['pending', 'active', 'expired'], default: 'active' },
    views: { type: Number, default: 0 },

    // Ownership
    userId: { type: String }, // Optional for now

    // Expiry (30 Days Default)
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => Date.now() + 30 * 24 * 60 * 60 * 1000 }
});

AdSchema.index({ category: 1, status: 1 });
AdSchema.index({ title: 1 });
AdSchema.index({ status: 1 });

// "Architecture Hardening": DB Optimization
AdSchema.index({ title: 'text', description: 'text' }); // Efficient text search

module.exports = mongoose.model('Ad', AdSchema);
