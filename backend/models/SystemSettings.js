const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    _id: { type: String, default: 'global_settings' }, // Singleton ID
    maintenanceMode: { type: Boolean, default: false },
    announcement: { type: String, default: 'مرحباً بكم في منصة العينية - النسخة التجريبية 3.0' },
    allowNewMerchants: { type: Boolean, default: true },
    allowGuestAds: { type: Boolean, default: true },
    enablePaymentGateway: { type: Boolean, default: false },
    enableDeliveryService: { type: Boolean, default: false },
    myfatoorah: {
        apiKey: { type: String, default: '' },
        merchantId: { type: String, default: '' },
        mode: { type: String, enum: ['test', 'live'], default: 'test' }
    },
    promoVideoUrl: { type: String, default: '' },
    promoVideoPlansUrl: { type: String, default: '' },
    zatca: {
        enabled: { type: Boolean, default: false },
        companyName: { type: String, default: '' },
        taxNumber: { type: String, default: '' },
        environment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' }
    },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
