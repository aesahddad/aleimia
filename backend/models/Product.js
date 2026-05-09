const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    // Security / Isolation Link
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },

    name: { type: String, required: true },
    price: Number,
    oldPrice: Number,
    description: String,

    // Assets
    imageUrl: String, // 2D Fallback / Smart Frame Texture
    galleryImages: [{ type: String }], // معرض الصور
    modelUrl: String, // GLB/GLTF 3D Model
    videoUrl: String, // YouTube or Local
    displayMode: { type: String }, // frame | model

    // Metadata
    specs: [{ label: String, value: String }],
    reviews: [{
        user: String,
        rating: Number,
        comment: String,
        date: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
