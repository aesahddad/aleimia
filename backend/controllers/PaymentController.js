const SystemSettings = require('../models/SystemSettings');
const Store = require('../models/Store');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const logger = require('../shared/logger');

class PaymentController {
    static async initiate(req, res) {
        try {
            const { planId, storeId, callbackUrl } = req.body;
            if (!planId || !storeId) return res.status(400).json({ error: 'planId and storeId are required' });

            const plan = await SubscriptionPlan.findById(planId);
            if (!plan) return res.status(404).json({ error: 'Plan not found' });
            if (plan.price === 0) {
                const store = await Store.findByIdAndUpdate(storeId, { status: 'active' }, { new: true });
                await Subscription.create({ userId: req.user._id, planId, storeId, status: 'active', startDate: new Date() });
                return res.json({ success: true, message: 'تم تفعيل المتجر مجاناً', store, paid: false });
            }

            const settings = await SystemSettings.findById('global_settings');
            if (!settings?.enablePaymentGateway || !settings?.myfatoorah?.apiKey) {
                return res.status(400).json({ error: 'بوابة الدفع غير مفعلة. اختر التفعيل اليدوي بدلاً من ذلك.' });
            }

            const amount = plan.price;
            const orderId = `STORE-${storeId}-${Date.now()}`;

            const myfatoorahRes = await fetch('https://api.myfatoorah.com/v2/SendPayment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.myfatoorah.apiKey}`
                },
                body: JSON.stringify({
                    CustomerName: req.user.username || req.user.email,
                    NotificationOption: 'Lnk',
                    InvoiceValue: amount,
                    CallbackUrl: callbackUrl || `${req.protocol}://${req.get('host')}/api/payments/callback`,
                    ErrorUrl: `${req.protocol}://${req.get('host')}/merchant?tab=stores`,
                    Language: 'ar',
                    CustomerEmail: req.user.email,
                    MobileCountryCode: '+966',
                    CustomerMobile: '',
                    DisplayCurrencyIso: 'SAR',
                    OrderReference: orderId
                })
            });

            const mfData = await myfatoorahRes.json();
            if (!myfatoorahRes.ok) {
                logger.error('MyFatoorah Error:', mfData);
                return res.status(500).json({ error: mfData.Message || mfData.ValidationErrors?.[0]?.Name || 'فشل الاتصال ببوابة الدفع' });
            }

            await Subscription.create({
                userId: req.user._id, planId, storeId,
                status: 'pending', paymentMethod: 'myfatoorah',
                paymentReference: mfData.InvoiceId?.toString() || orderId,
                startDate: new Date()
            });

            res.json({ success: true, paymentUrl: mfData.InvoiceURL, invoiceId: mfData.InvoiceId });
        } catch (e) {
            logger.error('Payment Init Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    static async callback(req, res) {
        try {
            const { paymentId, OrderReference, InvoiceId } = req.body;
            const ref = InvoiceId?.toString() || paymentId || '';

            if (!ref) {
                const storeId = OrderReference?.replace('STORE-', '')?.split('-')[0];
                if (storeId) await Store.findByIdAndUpdate(storeId, { status: 'pending' });
                return res.redirect(`${req.protocol}://${req.get('host')}/merchant?tab=stores&payment=failed`);
            }

            const settings = await SystemSettings.findById('global_settings');
            let mfData;
            if (settings?.enablePaymentGateway && settings?.myfatoorah?.apiKey) {
                const mfRes = await fetch('https://api.myfatoorah.com/v2/GetPaymentStatus', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${settings.myfatoorah.apiKey}`
                    },
                    body: JSON.stringify({ Key: ref, KeyType: 'InvoiceId' })
                });
                mfData = await mfRes.json();
            }

            const isPaid = mfData?.Data?.InvoiceStatus === 'Paid' || mfData?.Data?.InvoiceStatus === 'Completed';

            const subscription = await Subscription.findOne({ paymentReference: ref });
            if (!subscription) return res.redirect(`${req.protocol}://${req.get('host')}/merchant?tab=stores&payment=notfound`);

            if (isPaid) {
                subscription.status = 'active';
                await subscription.save();
                await Store.findByIdAndUpdate(subscription.storeId, { status: 'active' });
                return res.redirect(`${req.protocol}://${req.get('host')}/merchant?tab=stores&payment=success`);
            }

            await Store.findByIdAndUpdate(subscription.storeId, { status: 'pending' });
            res.redirect(`${req.protocol}://${req.get('host')}/merchant?tab=stores&payment=failed`);
        } catch (e) {
            logger.error('Payment Callback Error:', e);
            res.redirect(`${req.protocol}://${req.get('host')}/merchant?tab=stores&payment=error`);
        }
    }
}

module.exports = PaymentController;
