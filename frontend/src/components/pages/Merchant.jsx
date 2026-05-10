import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import FileUploader from '../../components/shared/FileUploader';
import { openWhatsApp } from '../../utils/whatsapp';
import CATEGORIES from '../../config/categories';

export const MERCHANT_TABS = [
  { id: 'dashboard', label: 'الرئيسية', icon: '📊' },
  { id: 'stores', label: 'متاجري', icon: '🏪' },
  { id: 'products', label: 'المنتجات', icon: '📦' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
];

export default function Merchant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'dashboard';

  if (!user) {
    return (
      <div className="page-empty">
        <div className="page-empty-icon">🏪</div>
        <h2>تسجيل الدخول مطلوب</h2>
        <p>يرجى تسجيل الدخول للوصول للوحة التاجر</p>
      </div>
    );
  }

  return (
    <div className="merchant-page">
      <h1>لوحة التاجر</h1>

      {tab === 'dashboard' && <MerchantDashboard user={user} />}
      {tab === 'stores' && <MerchantStores user={user} />}
      {tab === 'products' && <MerchantProducts user={user} />}
      {tab === 'settings' && <MerchantSettings user={user} />}
    </div>
  );
}

function MerchantDashboard({ user }) {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    client.get('/stores?admin=true&limit=100').then(r => {
      const myStores = r.data.filter(s => s.ownerId?._id?.toString() === user.id || s.ownerId?.toString() === user.id || user.role === 'admin');
      setStores(myStores);
    }).catch(() => {});

    client.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  }, [user]);

  const totalProducts = stores.reduce((sum, s) => sum + (s.productCount || 0), 0);
  const activeStores = stores.filter(s => s.status === 'active').length;

  return (
    <div className="admin-section">
      <div className="merchant-dashboard">
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon">🏪</div>
            <span className="stat-number">{stores.length}</span>
            <span className="stat-label">إجمالي المتاجر</span>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <span className="stat-number">{activeStores}</span>
            <span className="stat-label">المتاجر النشطة</span>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <span className="stat-number">{totalProducts}</span>
            <span className="stat-label">إجمالي المنتجات</span>
          </div>
        </div>

        <div className="merchant-quick-actions">
          <h3>إجراءات سريعة</h3>
          <div className="merchant-actions-grid">
            <div className="merchant-action-card" onClick={() => navigate('/merchant?tab=stores')}>
              <span className="merchant-action-icon">➕</span>
              <span>متجر جديد</span>
            </div>
            <div className="merchant-action-card" onClick={() => navigate('/merchant?tab=products')}>
              <span className="merchant-action-icon">📦</span>
              <span>إضافة منتج</span>
            </div>
            {stores.length > 0 && (
              <div className="merchant-action-card" onClick={() => navigate(`/store/${stores[0]._id}`)}>
                <span className="merchant-action-icon">👁️</span>
                <span>معاينة متجري</span>
              </div>
            )}
            <div className="merchant-action-card" onClick={() => navigate('/merchant?tab=settings')}>
              <span className="merchant-action-icon">⚙️</span>
              <span>الإعدادات</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MerchantStores({ user }) {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editStore, setEditStore] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', category: '', logoUrl: '', coverUrl: '', whatsappNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [pendingStore, setPendingStore] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activationMode, setActivationMode] = useState('manual');
  const [activating, setActivating] = useState(false);
  const [adminWhatsapp, setAdminWhatsapp] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');

  const loadStores = () => {
    client.get('/stores?admin=true&limit=100').then(r => {
      setStores(r.data.filter(s => s.ownerId?._id?.toString() === user.id || s.ownerId?.toString() === user.id || user.role === 'admin'));
    }).catch(() => {});
  };

  useEffect(() => { loadStores(); }, [user]);
  useEffect(() => {
    client.get('/subscriptions/plans').then(r => setPlans(r.data)).catch(() => {});
    client.get('/status').then(r => setAdminWhatsapp(r.data.adminWhatsapp || '')).catch(() => {});
  }, []);

  const openCreate = () => {
    setForm({ name: '', description: '', category: '', logoUrl: '', coverUrl: '', whatsappNumber: '' });
    setEditStore(null);
    setShowForm(true);
  };

  const openEdit = (store) => {
    setForm({
      name: store.name || '',
      description: store.description || '',
      category: store.category || '',
      logoUrl: store.logoUrl || store.branding?.logo || '',
      coverUrl: store.coverUrl || store.branding?.cover || '',
      whatsappNumber: store.whatsappNumber || store.financial?.whatsapp || '',
    });
    setEditStore(store);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      let store;
      if (editStore) {
        const { data } = await client.put(`/stores/${editStore._id}`, payload);
        store = data.store;
      } else {
        const { data } = await client.post('/stores', payload);
        store = data.store;
      }
      setShowForm(false);
      loadStores();
      if (!editStore) {
        setPendingStore(store);
        setSelectedPlan(null);
        setActivationMode('manual');
      }
    } catch (err) {
      alert('فشل الحفظ: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmActivation = async () => {
    if (!pendingStore || !selectedPlan) return;
    setActivating(true);

    // Open WhatsApp synchronously (before await) while user gesture is active
    let whatsappSent = false;
    let fallbackUrl = '';
    if (activationMode === 'manual' && adminWhatsapp) {
      const userName = user?.username || user?.email || 'تاجر';
      const msg = `مرحباً، أنا ${userName}، قمت بإنشاء متجر "${pendingStore.name}" وأرغب في تفعيل باقة "${selectedPlan.name}" (${selectedPlan.price} ريال/${selectedPlan.duration === 'yearly' ? 'سنوي' : 'شهر'}). الرجاء التواصل للتفعيل.`;
      whatsappSent = openWhatsApp(adminWhatsapp, msg);
      const clean = adminWhatsapp.replace(/[^0-9]/g, '');
      fallbackUrl = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
    }

    try {
      if (activationMode === 'paid') {
        const callback = `${window.location.origin}/api/payments/callback`;
        const { data } = await client.post('/payments/initiate', {
          planId: selectedPlan._id,
          storeId: pendingStore._id,
          callbackUrl: callback
        });
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
          return;
        }
        if (data.paid === false) {
          setPendingStore(null);
          loadStores();
          return;
        }
      }
      await client.post('/subscriptions', { planId: selectedPlan._id, storeId: pendingStore._id });
      setWhatsappLink(fallbackUrl);
      setPendingStore(null);
      loadStores();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || err.message));
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>متاجري</h2>
        <button className="admin-btn approve" onClick={openCreate}>+ متجر جديد</button>
      </div>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal merchant-form-modal" onClick={e => e.stopPropagation()}>
            <h3>{editStore ? 'تعديل المتجر' : 'متجر جديد'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="admin-field">
                <label>اسم المتجر *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="admin-field">
                <label>الوصف</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="admin-textarea" />
              </div>
              <div className="admin-field">
                <label>التصنيف *</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required className="admin-input" style={{ width: '100%', padding: '8px' }}>
                  <option value="">اختر تصنيفاً</option>
                  {CATEGORIES.map(c => <option key={c.id} value={c.label}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label>رابط الشعار (Logo)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." style={{ flex: 1 }} />
                  <FileUploader accept="image" onUpload={(url) => setForm(f => ({ ...f, logoUrl: url }))} onError={(msg) => alert(msg)} label="رفع" />
                </div>
                {form.logoUrl && <img src={form.logoUrl} alt="" style={{ width: 60, height: 60, borderRadius: 8, marginTop: 4, objectFit: 'cover' }} />}
              </div>
              <div className="admin-field">
                <label>رابط صورة الغلاف (Cover)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={form.coverUrl} onChange={e => setForm({ ...form, coverUrl: e.target.value })} placeholder="https://..." style={{ flex: 1 }} />
                  <FileUploader accept="image" onUpload={(url) => setForm(f => ({ ...f, coverUrl: url }))} onError={(msg) => alert(msg)} label="رفع" />
                </div>
                {form.coverUrl && <img src={form.coverUrl} alt="" style={{ width: '100%', maxHeight: 80, borderRadius: 8, marginTop: 4, objectFit: 'cover' }} />}
              </div>
              <div className="admin-field">
                <label>رقم واتساب</label>
                <input value={form.whatsappNumber} onChange={e => setForm({ ...form, whatsappNumber: e.target.value })} />
              </div>
              <div className="admin-modal-btns">
                <button type="submit" className="admin-btn approve" disabled={submitting}>
                  {submitting ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button type="button" className="admin-btn delete" onClick={() => setShowForm(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingStore && (
        <div className="admin-modal-overlay" onClick={() => setPendingStore(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3>🎉 تم إنشاء المتجر! اختر خطة التفعيل</h3>
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 16 }}>اختر الباقة المناسبة لمتجر "{pendingStore.name}"</p>

            <div className="plans-mini-list">
              {plans.filter(p => p.active).sort((a, b) => a.order - b.order).map(plan => (
                <div key={plan._id} className={`plan-mini-card ${selectedPlan?._id === plan._id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan(plan)} style={{ cursor: 'pointer' }}>
                  <div className="plan-mini-header">
                    <strong>{plan.name}</strong>
                    <span>{plan.price === 0 ? 'مجاني' : `${plan.price} ر.س/${plan.duration === 'yearly' ? 'سنوي' : 'شهر'}`}</span>
                  </div>
                  {plan.features?.length > 0 && (
                    <div className="plan-mini-features">
                      {plan.features.slice(0, 3).map((f, i) => <small key={i}>✓ {f}</small>)}
                      {plan.features.length > 3 && <small>+{plan.features.length - 3}</small>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedPlan && selectedPlan.price > 0 && (
              <div className="activation-mode-select" style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>طريقة التفعيل</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`admin-btn ${activationMode === 'manual' ? 'approve' : ''}`}
                    onClick={() => setActivationMode('manual')}>
                    📩 يدوي (مراسلة الإدارة)
                  </button>
                  <button className={`admin-btn ${activationMode === 'paid' ? 'approve' : ''}`}
                    onClick={() => setActivationMode('paid')}>
                    💳 دفع إلكتروني (تفعيل فوري)
                  </button>
                </div>
                {activationMode === 'manual' && (
                  <div style={{ marginTop: 6, padding: 10, borderRadius: 8, background: '#fef3c7', fontSize: 12, lineHeight: 1.6 }}>
                    <p style={{ fontWeight: 700, color: '#92400e' }}>⚠️ تعليمات إرسال رسالة واتساب:</p>
                    <p style={{ color: '#92400e', margin: '4px 0' }}>
                      • سيتم فتح واتساب ويب لإرسال طلب التفعيل للإدارة
                    </p>
                    <p style={{ color: '#92400e', margin: '4px 0' }}>
                      • تأكد من أن رقم واتساب الإدارة يبدأ بـ <strong dir="ltr">+966</strong> (أو مفتاح دولتك)
                    </p>
                    <p style={{ color: '#92400e', margin: '4px 0' }}>
                      • إذا لم يتم إرسال الرسالة تلقائياً، يرجى نسخ الرابط وفتحه يدوياً
                    </p>
                  </div>
                )}
                {activationMode === 'paid' && (
                  <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6 }}>سيتم توجيهك إلى بوابة الدفع. بعد الدفع، سيتم تفعيل المتجر فوراً.</p>
                )}
              </div>
            )}

            {selectedPlan && (
              <div className="admin-modal-btns" style={{ marginTop: 16 }}>
                <button className="admin-btn approve" onClick={confirmActivation} disabled={activating}>
                  {activating ? 'جاري...' : activationMode === 'paid' && selectedPlan.price > 0 ? '💳 ادفع الآن' : '✅ تأكيد'}
                </button>
                <button className="admin-btn delete" onClick={() => setPendingStore(null)}>لاحقاً</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="merchant-stores-list">
        {stores.length === 0 ? (
          <div className="admin-empty">
            <p>ليس لديك متاجر بعد. <button className="admin-btn approve" onClick={openCreate}>افتح متجرك الآن</button></p>
          </div>
        ) : stores.map(store => (
          <div key={store._id} className="merchant-store-card">
            <div className="merchant-store-header">
              <div className="merchant-store-info">
                {(store.logoUrl || store.branding?.logo) && <img src={store.logoUrl || store.branding?.logo} alt="" className="merchant-store-logo" />}
                <div>
                  <h2>{store.name}</h2>
                  <span className={`status-badge status-${store.status}`}>
                    {{ pending: 'قيد الانتظار', active: 'نشط', frozen: 'مجمد', deleted: 'محذوف' }[store.status] || store.status}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="admin-btn" onClick={() => navigate(`/store/${store._id}`)}>👁️ معاينة</button>
                <button className="admin-btn" onClick={() => openEdit(store)}>✏️</button>
              </div>
            </div>
            {store.description && <p>{store.description}</p>}
          </div>
        ))}
      </div>

      {whatsappLink && (
        <div className="admin-notification" style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 12, padding: '16px 20px', maxWidth: 520, width: '90%', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,.15)', direction: 'rtl' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontWeight: 700, color: '#92400e', marginBottom: 6 }}>📩 تم إنشاء طلب التفعيل</p>
              <p style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>تم إنشاء الاشتراك. إذا لم يتم فتح واتساب تلقائياً، اضغط على الرابط أدناه:</p>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 4, padding: '6px 14px', background: '#25D366', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                📱 فتح واتساب
              </a>
            </div>
            <button onClick={() => setWhatsappLink('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: 18, padding: 0, lineHeight: 1 }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MerchantProducts({ user }) {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState({});
  const [selectedStore, setSelectedStore] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', imageUrl: '', category: '', modelUrl: '', videoUrl: '', displayMode: '', specs: [], galleryImages: [], reviews: [] });
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    client.get('/stores?admin=true&limit=100').then(r => {
      const myStores = r.data.filter(s => s.ownerId?._id?.toString() === user.id || s.ownerId?.toString() === user.id || user.role === 'admin');
      setStores(myStores);
      if (myStores.length > 0 && !selectedStore) {
        setSelectedStore(myStores[0]._id);
      }
      myStores.forEach(s => {
        client.get(`/stores/${s._id}/products`).then(r => setProducts(prev => ({ ...prev, [s._id]: r.data })));
      });
    }).catch(() => {});
  };

  useEffect(() => { loadData(); }, [user]);

  const openCreate = (storeId) => {
    setSelectedStore(storeId);
    setForm({ name: '', description: '', price: '', imageUrl: '', category: '', modelUrl: '', videoUrl: '', displayMode: '', specs: [], galleryImages: [], reviews: [] });
    setEditProduct(null);
    setShowForm(true);
  };

  const openEdit = (product, storeId) => {
    setSelectedStore(storeId);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      imageUrl: product.imageUrl || '',
      category: product.category || '',
      modelUrl: product.modelUrl || '',
      videoUrl: product.videoUrl || '',
      displayMode: product.displayMode || '',
      specs: product.specs || [],
      galleryImages: product.galleryImages || [],
      reviews: product.reviews || [],
    });
    setEditProduct(product);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, storeId: selectedStore, price: Number(form.price) };
      if (editProduct) {
        await client.put(`/stores/${selectedStore}/products/${editProduct._id}`, payload);
      } else {
        await client.post('/stores/products', payload);
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      alert('فشل الحفظ: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('تأكيد حذف المنتج؟')) return;
    try {
      await client.delete(`/stores/${selectedStore}/products/${productId}`);
      loadData();
    } catch (e) {
      alert('فشل الحذف');
    }
  };

  return (
    <div className="admin-section">
      <h2>إدارة المنتجات</h2>

      {stores.length === 0 ? (
        <div className="admin-empty">ليس لديك متاجر. أنشئ متجراً أولاً.</div>
      ) : (
        <div className="merchant-store-tabs">
          {stores.map(s => (
            <button
              key={s._id}
              className={`admin-tab ${selectedStore === s._id ? 'active' : ''}`}
              onClick={() => setSelectedStore(s._id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {selectedStore && (
        <div className="admin-section-header" style={{ marginTop: 12 }}>
          <h3>منتجات {stores.find(s => s._id === selectedStore)?.name}</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="admin-btn" onClick={() => window.open(`/store/${selectedStore}`, '_blank')}>👁️ معاينة</button>
            <button className="admin-btn approve" onClick={() => openCreate(selectedStore)}>+ إضافة منتج</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>{editProduct ? 'تعديل المنتج' : 'منتج جديد'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="admin-field">
                <label>اسم المنتج *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="admin-field">
                <label>الوصف</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="admin-textarea" />
              </div>
              <div className="admin-field">
                <label>السعر (ريال) *</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="admin-field">
                <label>رابط الصورة</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." style={{ flex: 1 }} />
                  <FileUploader accept="image" onUpload={(url) => setForm(f => ({ ...f, imageUrl: url }))} onError={(msg) => alert(msg)} label="رفع" />
                </div>
                {form.imageUrl && <img src={form.imageUrl} alt="" style={{ width: 60, height: 60, borderRadius: 8, marginTop: 4, objectFit: 'cover' }} />}
              </div>
              <div className="admin-field">
                <label>معرض الصور (صور إضافية)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <input value={form.galleryInput || ''} onChange={e => setForm(f => ({ ...f, galleryInput: e.target.value }))} placeholder="https://..." style={{ flex: 1 }} />
                  <FileUploader accept="image" onUpload={(url) => setForm(f => ({ ...f, galleryImages: [...(f.galleryImages || []), url], galleryInput: '' }))} onError={(msg) => alert(msg)} label="رفع" />
                  <button type="button" className="admin-btn approve" onClick={() => { if (form.galleryInput?.trim()) { setForm(f => ({ ...f, galleryImages: [...(f.galleryImages || []), f.galleryInput.trim()], galleryInput: '' })); } }}>+</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(form.galleryImages || []).map((url, i) => (
                    <div key={i} style={{ position: 'relative', width: 60, height: 60 }}>
                      <img src={url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                      <button type="button" className="admin-btn delete" style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, fontSize: 10, padding: 0, borderRadius: '50%' }}
                        onClick={() => setForm(f => ({ ...f, galleryImages: f.galleryImages.filter((_, j) => j !== i) }))}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="admin-field">
                <label>التصنيف</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="admin-field">
                <label>رابط النموذج ثلاثي الأبعاد (GLB/GLTF)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={form.modelUrl} onChange={e => setForm({ ...form, modelUrl: e.target.value })} placeholder="https://..." style={{ flex: 1 }} />
                  <FileUploader accept="model" onUpload={(url) => setForm(f => ({ ...f, modelUrl: url }))} onError={(msg) => alert(msg)} label="رفع" />
                </div>
              </div>
              <div className="admin-field">
                <label>وضع العرض</label>
                <select value={form.displayMode} onChange={e => setForm({ ...form, displayMode: e.target.value })} className="admin-input" style={{ width: '100%', padding: '8px' }}>
                  <option value="">تلقائي (نموذج 3D إن وجد، وإلا الإطار الذكي)</option>
                  <option value="frame">إطار ذكي (صورة + مواصفات)</option>
                  <option value="model">نموذج ثلاثي الأبعاد</option>
                </select>
              </div>
              <div className="admin-field">
                <label>رابط الفيديو (YouTube أو MP4)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/..." style={{ flex: 1 }} />
                  <FileUploader accept="video" onUpload={(url) => setForm(f => ({ ...f, videoUrl: url }))} onError={(msg) => alert(msg)} label="رفع" />
                </div>
              </div>
              <div className="admin-field">
                <label>المواصفات</label>
                <div className="admin-specs-list">
                  {form.specs.map((spec, i) => (
                    <div key={i} className="admin-spec-row" style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      <input value={spec.label} onChange={e => {
                        const newSpecs = [...form.specs];
                        newSpecs[i] = { ...newSpecs[i], label: e.target.value };
                        setForm({ ...form, specs: newSpecs });
                      }} placeholder="المواصفة" style={{ flex: 1 }} />
                      <input value={spec.value} onChange={e => {
                        const newSpecs = [...form.specs];
                        newSpecs[i] = { ...newSpecs[i], value: e.target.value };
                        setForm({ ...form, specs: newSpecs });
                      }} placeholder="القيمة" style={{ flex: 1 }} />
                      <button type="button" className="admin-btn delete" onClick={() => setForm({ ...form, specs: form.specs.filter((_, j) => j !== i) })}>✕</button>
                    </div>
                  ))}
                  <button type="button" className="admin-btn" onClick={() => setForm({ ...form, specs: [...form.specs, { label: '', value: '' }] })}>+ إضافة مواصفة</button>
                </div>
              </div>
              <div className="admin-field">
                <label>آراء العملاء (تقييمات)</label>
                <div className="admin-reviews-list">
                  {(form.reviews || []).map((r, i) => (
                    <div key={i} className="admin-review-row" style={{ display: 'flex', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
                      <input value={r.user} onChange={e => { const n = [...form.reviews]; n[i] = { ...n[i], user: e.target.value }; setForm({ ...form, reviews: n }); }} placeholder="الاسم" style={{ flex: 1, minWidth: 60 }} />
                      <input type="number" min={1} max={5} value={r.rating} onChange={e => { const n = [...form.reviews]; n[i] = { ...n[i], rating: Number(e.target.value) }; setForm({ ...form, reviews: n }); }} placeholder="تقييم (1-5)" style={{ width: 70 }} />
                      <input value={r.comment || ''} onChange={e => { const n = [...form.reviews]; n[i] = { ...n[i], comment: e.target.value }; setForm({ ...form, reviews: n }); }} placeholder="تعليق" style={{ flex: 2, minWidth: 80 }} />
                      <button type="button" className="admin-btn delete" onClick={() => setForm({ ...form, reviews: form.reviews.filter((_, j) => j !== i) })}>✕</button>
                    </div>
                  ))}
                  <button type="button" className="admin-btn" onClick={() => setForm({ ...form, reviews: [...(form.reviews || []), { user: '', rating: 5, comment: '', date: new Date().toISOString() }] })}>+ إضافة تقييم</button>
                </div>
              </div>
              <div className="admin-modal-btns">
                <button type="submit" className="admin-btn approve" disabled={submitting}>
                  {submitting ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button type="button" className="admin-btn delete" onClick={() => setShowForm(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStore && (
        <div className="admin-list">
          {(products[selectedStore] || []).map(p => (
            <div key={p._id} className="admin-item">
              <div className="admin-item-info">
                {p.imageUrl && <img src={p.imageUrl} alt="" className="admin-thumb" />}
                <div>
                  <strong>{p.name}</strong>
                  <span className="admin-meta">{p.price} ر.س {p.category ? `· ${p.category}` : ''}</span>
                </div>
              </div>
              <div className="admin-item-actions">
                <button className="admin-btn" onClick={() => openEdit(p, selectedStore)}>✏️</button>
                <button className="admin-btn delete" onClick={() => deleteProduct(p._id)}>🗑️</button>
              </div>
            </div>
          ))}
          {(products[selectedStore] || []).length === 0 && (
            <div className="admin-empty">لا توجد منتجات في هذا المتجر</div>
          )}
        </div>
      )}
    </div>
  );
}

function MerchantSettings({ user }) {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [supplierInfo, setSupplierInfo] = useState({});
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    client.get('/status').then(r => setSettings(r.data)).catch(() => {});
    client.get('/stores?admin=true&limit=100').then(r => {
      const myStores = r.data.filter(s => s.ownerId?._id?.toString() === user.id || s.ownerId?.toString() === user.id || user.role === 'admin');
      setStores(myStores);
      if (myStores.length > 0) {
        const s = myStores[0];
        setSelectedStore(s._id);
        setSupplierInfo({ code: s.financial?.supplierCode, registered: s.financial?.supplierRegistered });
        setForm({ name: s.name || '', description: s.description || '', logoUrl: s.logoUrl || s.branding?.logo || '', coverUrl: s.coverUrl || s.branding?.cover || '', whatsappNumber: s.whatsappNumber || s.financial?.whatsapp || '', 'financial.iban': s.financial?.iban || '', 'financial.crNumber': s.financial?.crNumber || '', 'financial.taxNumber': s.financial?.taxNumber || '', 'branding.promoVideo': s.branding?.promoVideo || '', 'branding.specifications': s.branding?.specifications || '' });
      }
    }).catch(() => {});
  }, [user]);

  const selectStore = (id) => {
    setSelectedStore(id);
    const store = stores.find(s => s._id === id);
    if (store) {
      setSupplierInfo({ code: store.financial?.supplierCode, registered: store.financial?.supplierRegistered });
      setForm({ name: store.name || '', description: store.description || '', logoUrl: store.logoUrl || store.branding?.logo || '', coverUrl: store.coverUrl || store.branding?.cover || '', whatsappNumber: store.whatsappNumber || store.financial?.whatsapp || '', 'financial.iban': store.financial?.iban || '', 'financial.crNumber': store.financial?.crNumber || '', 'financial.taxNumber': store.financial?.taxNumber || '', 'branding.promoVideo': store.branding?.promoVideo || '', 'branding.specifications': store.branding?.specifications || '' });
    }
    setSaved(false);
  };

  const handleRegisterSupplier = async () => {
    if (!selectedStore) return;
    setRegistering(true);
    try {
      const { data } = await client.post('/payments/register-supplier', {
        storeId: selectedStore,
        mobile: form.whatsappNumber
      });
      setSupplierInfo({ code: data.supplierCode, registered: true });
      alert('✅ تم تسجيل المورد بنجاح في ماي فاتورة');
    } catch (e) {
      alert(e.response?.data?.error || 'فشل تسجيل المورد');
    } finally {
      setRegistering(false);
    }
  };

  const updateField = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    if (!selectedStore) return;
    try {
      const payload = {
        name: form.name,
        description: form.description,
        logoUrl: form.logoUrl,
        coverUrl: form.coverUrl,
        whatsappNumber: form.whatsappNumber,
        financial: {
          iban: form['financial.iban'],
          crNumber: form['financial.crNumber'],
          taxNumber: form['financial.taxNumber'],
          whatsapp: form.whatsappNumber
        },
        branding: {
          promoVideo: form['branding.promoVideo'],
          specifications: form['branding.specifications']
        }
      };
      await client.put(`/stores/${selectedStore}`, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('فشل الحفظ');
    }
  };

  if (stores.length === 0) {
    return <div className="admin-empty">ليس لديك متاجر بعد</div>;
  }

  return (
    <div className="admin-section">
      <h2>إعدادات المتجر</h2>

      <div className="merchant-store-tabs">
        {stores.map(s => (
          <button
            key={s._id}
            className={`admin-tab ${selectedStore === s._id ? 'active' : ''}`}
            onClick={() => selectStore(s._id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {selectedStore && (
        <div className="admin-settings" style={{ marginTop: 16 }}>
          <div className="admin-setting-field">
            <label>اسم المتجر</label>
            <input value={form.name} onChange={e => updateField('name', e.target.value)} className="admin-input" />
          </div>
          <div className="admin-setting-field">
            <label>الوصف</label>
            <textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={3} className="admin-textarea" />
          </div>

          <h3 className="admin-subtitle" style={{ marginTop: 24 }}>العلامة التجارية</h3>
          <div className="admin-setting-field">
            <label>رابط الشعار (Logo)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={form.logoUrl} onChange={e => updateField('logoUrl', e.target.value)} className="admin-input" placeholder="https://..." style={{ flex: 1 }} />
              <FileUploader accept="image" onUpload={(url) => updateField('logoUrl', url)} onError={(msg) => alert(msg)} label="رفع" />
            </div>
            {form.logoUrl && <img src={form.logoUrl} alt="الشعار" style={{ width: 60, height: 60, borderRadius: 8, marginTop: 4, objectFit: 'cover' }} />}
          </div>
          <div className="admin-setting-field">
            <label>رابط الغلاف (Cover)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={form.coverUrl} onChange={e => updateField('coverUrl', e.target.value)} className="admin-input" placeholder="https://..." style={{ flex: 1 }} />
              <FileUploader accept="image" onUpload={(url) => updateField('coverUrl', url)} onError={(msg) => alert(msg)} label="رفع" />
            </div>
            {form.coverUrl && <img src={form.coverUrl} alt="الغلاف" style={{ width: '100%', maxHeight: 80, borderRadius: 8, marginTop: 4, objectFit: 'cover' }} />}
          </div>
          <div className="admin-setting-field">
            <label>فيديو ترويجي (YouTube أو MP4)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={form['branding.promoVideo']} onChange={e => updateField('branding.promoVideo', e.target.value)} className="admin-input" placeholder="https://youtube.com/..." style={{ flex: 1 }} />
              <FileUploader accept="video" onUpload={(url) => updateField('branding.promoVideo', url)} label="رفع" />
            </div>
          </div>
          <div className="admin-setting-field">
            <label>مواصفات المتجر</label>
            <textarea value={form['branding.specifications']} onChange={e => updateField('branding.specifications', e.target.value)} rows={3} className="admin-textarea" placeholder="وصف كامل للمتجر ليظهر في الشريط الجانبي" />
          </div>

          <h3 className="admin-subtitle" style={{ marginTop: 24 }}>معلومات التواصل</h3>
          <div className="admin-setting-field">
            <label>رقم واتساب</label>
            <input value={form.whatsappNumber} onChange={e => updateField('whatsappNumber', e.target.value)} className="admin-input" />
          </div>

          <h3 className="admin-subtitle" style={{ marginTop: 24 }}>المعلومات المالية</h3>
          <div className="admin-setting-field">
            <label>رقم الآيبان (IBAN)</label>
            <input value={form['financial.iban']} onChange={e => updateField('financial.iban', e.target.value)} className="admin-input" placeholder="SA..." />
          </div>
          <div className="admin-setting-field">
            <label>رقم السجل التجاري</label>
            <input value={form['financial.crNumber']} onChange={e => updateField('financial.crNumber', e.target.value)} className="admin-input" />
          </div>
          <div className="admin-setting-field">
            <label>الرقم الضريبي</label>
            <input value={form['financial.taxNumber']} onChange={e => updateField('financial.taxNumber', e.target.value)} className="admin-input" />
          </div>

          <h3 className="admin-subtitle" style={{ marginTop: 24 }}>الدفع الإلكتروني - MyFatoorah</h3>
          {settings?.enablePaymentGateway ? (
            <div className="admin-setting-field">
              {supplierInfo.registered ? (
                <div style={{ padding: 12, borderRadius: 8, background: '#dcfce7', color: '#166534', fontSize: 13, fontWeight: 700 }}>
                  ✅ تم تسجيل المورد - الكود: {supplierInfo.code}
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 8 }}>
                    سجل متجركم كمورد في ماي فاتورة لاستقبال المدفوعات الإلكترونية مباشرة
                  </p>
                  <button className="admin-btn approve" onClick={handleRegisterSupplier} disabled={registering} style={{ padding: '10px 20px' }}>
                    {registering ? 'جاري التسجيل...' : '📝 تسجيل مورد في ماي فاتورة'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-light)' }}>بوابة الدفع غير مفعلة من قبل الإدارة</p>
          )}

          <button className="admin-btn approve" onClick={handleSave} style={{ padding: '10px 24px', marginTop: 16 }}>
            {saved ? '✓ تم الحفظ' : 'حفظ الإعدادات'}
          </button>
        </div>
      )}
    </div>
  );
}
