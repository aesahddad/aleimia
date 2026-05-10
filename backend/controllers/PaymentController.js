const SystemSettings = require('../models/SystemSettings');
const Store = require('../models/Store');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Order = require('../models/Order');
const logger = require('../shared/logger');

const ALLOWED_DOMAINS = ['aleinia.com', 'www.aleinia.com', 'localhost:3000', 'localhost:3001'];
const getSafeHost = (req) => {
    const host = req.get('host') || 'aleinia.com';
    const isAllowed = ALLOWED_DOMAINS.some(d => host === d || host.endsWith('.' + d));
    return isAllowed ? host : 'aleinia.com';
};

function getMfApiUrl(settings) {
  return settings.myfatoorah?.mode === 'live'
    ? 'https://api.myfatoorah.com'
    : 'https://apitest.myfatoorah.com';
}

function mfHeaders(settings) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${settings.myfatoorah.apiKey}`
  };
}

class PaymentController {
    static async registerSupplier(req, res) {
        try {
            const { storeId, mobile, email } = req.body;
            if (!storeId) return res.status(400).json({ error: 'storeId is required' });

            const store = await Store.findById(storeId);
            if (!store) return res.status(404).json({ error: 'Store not found' });

            if (store.financial?.supplierRegistered && store.financial?.supplierCode > 0) {
                return res.json({ success: true, supplierCode: store.financial.supplierCode, message: 'المورد مسجل مسبقاً' });
            }

            const settings = await SystemSettings.findById('global_settings');
            if (!settings?.enablePaymentGateway || !settings?.myfatoorah?.apiKey) {
                return res.status(400).json({ error: 'بوابة الدفع غير مفعلة' });
            }

            const baseUrl = getMfApiUrl(settings);
            const mfRes = await fetch(`${baseUrl}/v2/CreateSupplier`, {
                method: 'POST',
                headers: mfHeaders(settings),
                body: JSON.stringify({
                    SupplierName: store.name,
                    SupplierMobile: mobile || store.financial?.whatsapp || '',
                    SupplierEmail: email || req.user?.email || ''
                })
            });

            const mfData = await mfRes.json();
            if (!mfRes.ok) {
                logger.error('MyFatoorah CreateSupplier Error:', mfData);
                return res.status(500).json({
                    error: mfData.Message || mfData.ValidationErrors?.[0]?.Name || 'فشل تسجيل المورد في ماي فاتورة'
                });
            }

            const supplierCode = mfData.SupplierCode || mfData.Data?.SupplierCode;
            if (!supplierCode) {
                return res.status(500).json({ error: 'لم يتم الحصول على كود المورد من ماي فاتورة' });
            }

            await Store.findByIdAndUpdate(storeId, {
                'financial.supplierCode': supplierCode,
                'financial.supplierRegistered': true
            });

            res.json({ success: true, supplierCode, message: 'تم تسجيل المورد بنجاح في ماي فاتورة' });
        } catch (e) {
            logger.error('Register Supplier Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

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
            const baseUrl = getMfApiUrl(settings);

            const body = {
                CustomerName: req.user.username || req.user.email,
                NotificationOption: 'Lnk',
                InvoiceValue: amount,
                CallbackUrl: callbackUrl || `${req.protocol}://${getSafeHost(req)}/api/payments/callback`,
                ErrorUrl: `${req.protocol}://${getSafeHost(req)}/merchant?tab=stores`,
                Language: 'ar',
                CustomerEmail: req.user.email,
                MobileCountryCode: '+966',
                CustomerMobile: '',
                DisplayCurrencyIso: 'SAR',
                OrderReference: orderId
            };

            // Multi-supplier: partner receives the subscription amount
            if (settings.myfatoorah?.partnerSupplierCode > 0) {
                body.Suppliers = [{
                    SupplierCode: settings.myfatoorah.partnerSupplierCode,
                    InvoiceShare: 100,
                    ProposedShare: 100
                }];
            }

            const myfatoorahRes = await fetch(`${baseUrl}/v2/SendPayment`, {
                method: 'POST',
                headers: mfHeaders(settings),
                body: JSON.stringify(body)
            });

            const mfData = await myfatoorahRes.json();
            if (!myfatoorahRes.ok) {
                logger.error('MyFatoorah Subscription Error:', mfData);
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
            logger.error('Subscription Payment Init Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    static async cartInitiate(req, res) {
        try {
            const { storeId, items, total, customerName, customerPhone } = req.body;
            if (!storeId || !items || !items.length) return res.status(400).json({ error: 'storeId and items are required' });

            const store = await Store.findById(storeId);
            if (!store) return res.status(404).json({ error: 'Store not found' });

            const settings = await SystemSettings.findById('global_settings');
            if (!settings?.enablePaymentGateway || !settings?.myfatoorah?.apiKey) {
                return res.status(400).json({ error: 'بوابة الدفع غير مفعلة' });
            }

            const orderId = `CART-${storeId}-${Date.now()}`;
            const amount = Math.max(total, 1);
            const baseUrl = getMfApiUrl(settings);

            const body = {
                CustomerName: customerName || req.user?.username || 'عميل',
                NotificationOption: 'Lnk',
                InvoiceValue: amount,
                CallbackUrl: `${req.protocol}://${getSafeHost(req)}/api/payments/callback`,
                ErrorUrl: `${req.protocol}://${getSafeHost(req)}/store/${storeId}?payment=failed`,
                Language: 'ar',
                CustomerEmail: req.user?.email || '',
                MobileCountryCode: '+966',
                CustomerMobile: customerPhone || '',
                DisplayCurrencyIso: 'SAR',
                OrderReference: orderId
            };

            // Multi-supplier: store gets (100 - commission)%, platform gets commission%
            const suppliers = [];
            const commissionPct = settings.commissionPercent || 0;
            const platformCode = settings.myfatoorah?.platformSupplierCode;
            const storeCode = store.financial?.supplierCode;

            if (storeCode > 0) {
                suppliers.push({
                    SupplierCode: storeCode,
                    InvoiceShare: 100 - commissionPct,
                    ProposedShare: 100 - commissionPct
                });
            }
            if (platformCode > 0 && commissionPct > 0) {
                suppliers.push({
                    SupplierCode: platformCode,
                    InvoiceShare: commissionPct,
                    ProposedShare: commissionPct
                });
            }
            if (suppliers.length > 0) {
                body.Suppliers = suppliers;
            }

            const myfatoorahRes = await fetch(`${baseUrl}/v2/SendPayment`, {
                method: 'POST',
                headers: mfHeaders(settings),
                body: JSON.stringify(body)
            });

            const mfData = await myfatoorahRes.json();
            if (!myfatoorahRes.ok) {
                logger.error('MyFatoorah Cart Error:', mfData);
                return res.status(500).json({ error: mfData.Message || 'فشل الاتصال ببوابة الدفع' });
            }

            const order = await Order.create({
                userId: req.user?._id,
                storeId,
                customerName: customerName || req.user?.username,
                customerEmail: req.user?.email,
                customerPhone,
                items,
                total: amount,
                status: 'pending',
                paymentReference: mfData.InvoiceId?.toString() || orderId,
                paymentUrl: mfData.InvoiceURL
            });

            res.json({ success: true, paymentUrl: mfData.InvoiceURL, orderId: order._id });
        } catch (e) {
            logger.error('Cart Payment Init Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    static async callback(req, res) {
        try {
            const { paymentId, OrderReference, InvoiceId } = req.body;
            const ref = InvoiceId?.toString() || paymentId || '';
            const settings = await SystemSettings.findById('global_settings');
            const baseUrl = getMfApiUrl(settings);
            const isCartOrder = OrderReference?.startsWith('CART-');

            if (!ref) {
                const id = OrderReference?.replace(/^(STORE-|CART-)/, '')?.split('-')[0];
                if (id) {
                    if (isCartOrder) {
                        await Order.findOneAndUpdate({ storeId: id, status: 'pending' }, { status: 'failed' });
                        return res.redirect(`${req.protocol}://${getSafeHost(req)}/store/${id}?payment=failed`);
                    }
                    await Store.findByIdAndUpdate(id, { status: 'pending' });
                }
                    return res.redirect(`${req.protocol}://${getSafeHost(req)}/merchant?tab=stores&payment=failed`);
            }

            let mfData;
            if (settings?.enablePaymentGateway && settings?.myfatoorah?.apiKey) {
                const mfRes = await fetch(`${baseUrl}/v2/GetPaymentStatus`, {
                    method: 'POST',
                    headers: mfHeaders(settings),
                    body: JSON.stringify({ Key: ref, KeyType: 'InvoiceId' })
                });
                mfData = await mfRes.json();
            }

            const isPaid = mfData?.Data?.InvoiceStatus === 'Paid' || mfData?.Data?.InvoiceStatus === 'Completed';

            if (isCartOrder) {
                const order = await Order.findOneAndUpdate(
                    { paymentReference: ref },
                    { status: isPaid ? 'paid' : 'failed' },
                    { new: true }
                );
                const sid = order?.storeId || OrderReference?.replace('CART-', '')?.split('-')[0];
                return res.redirect(`${req.protocol}://${getSafeHost(req)}/store/${sid}?payment=${isPaid ? 'success' : 'failed'}`);
            }

            const subscription = await Subscription.findOne({ paymentReference: ref });
            if (!subscription) return res.redirect(`${req.protocol}://${getSafeHost(req)}/merchant?tab=stores&payment=notfound`);

            if (isPaid) {
                subscription.status = 'active';
                await subscription.save();
                await Store.findByIdAndUpdate(subscription.storeId, { status: 'active' });
                return res.redirect(`${req.protocol}://${getSafeHost(req)}/merchant?tab=stores&payment=success`);
            }

            await Store.findByIdAndUpdate(subscription.storeId, { status: 'pending' });
            res.redirect(`${req.protocol}://${getSafeHost(req)}/merchant?tab=stores&payment=failed`);
        } catch (e) {
            logger.error('Payment Callback Error:', e);
            res.redirect(`${req.protocol}://${getSafeHost(req)}/merchant?tab=stores&payment=error`);
        }
    }
}

module.exports = PaymentController;
