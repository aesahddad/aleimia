const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    items: [{
        name: String,
        price: Number,
        qty: Number,
        imageUrl: String,
        productId: String
    }],
    total: Number,
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paymentReference: String,
    paymentUrl: String
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
