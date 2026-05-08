import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';

const TABS = [
  { id: 'dashboard', label: 'الرئيسية', icon: '📊' },
  { id: 'stores', label: 'متاجري', icon: '🏪' },
  { id: 'products', label: 'المنتجات', icon: '📦' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
];

export default function Merchant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');

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

      <div className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <MerchantDashboard user={user} onNavigate={setTab} />}
      {tab === 'stores' && <MerchantStores user={user} />}
      {tab === 'products' && <MerchantProducts user={user} />}
      {tab === 'settings' && <MerchantSettings user={user} />}
    </div>
  );
}

function MerchantDashboard({ user, onNavigate }) {
  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    client.get('/stores?admin=true&limit=100').then(r => {
      const myStores = r.data.filter(s => s.ownerId === user._id || user.role === 'admin');
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
            <div className="merchant-action-card" onClick={() => onNavigate('stores')}>
              <span className="merchant-action-icon">➕</span>
              <span>متجر جديد</span>
            </div>
            <div className="merchant-action-card" onClick={() => onNavigate('products')}>
              <span className="merchant-action-icon">📦</span>
              <span>إضافة منتج</span>
            </div>
            <div className="merchant-action-card" onClick={() => onNavigate('settings')}>
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
  const [stores, setStores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editStore, setEditStore] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', logoUrl: '', coverUrl: '', whatsappNumber: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadStores = () => {
    client.get('/stores?admin=true&limit=100').then(r => {
      setStores(r.data.filter(s => s.ownerId === user._id || user.role === 'admin'));
    }).catch(() => {});
  };

  useEffect(() => { loadStores(); }, [user]);

  const openCreate = () => {
    setForm({ name: '', description: '', logoUrl: '', coverUrl: '', whatsappNumber: '' });
    setEditStore(null);
    setShowForm(true);
  };

  const openEdit = (store) => {
    setForm({
      name: store.name || '',
      description: store.description || '',
      logoUrl: store.logoUrl || '',
      coverUrl: store.coverUrl || '',
      whatsappNumber: store.whatsappNumber || '',
    });
    setEditStore(store);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, ownerId: user._id };
      if (editStore) {
        await client.put(`/stores/${editStore._id}`, payload);
      } else {
        await client.post('/stores', payload);
      }
      setShowForm(false);
      loadStores();
    } catch (err) {
      alert('فشل الحفظ: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
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
                <label>رابط الشعار (logo)</label>
                <input value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} />
              </div>
              <div className="admin-field">
                <label>رابط صورة الغلاف</label>
                <input value={form.coverUrl} onChange={e => setForm({ ...form, coverUrl: e.target.value })} />
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

      <div className="merchant-stores-list">
        {stores.length === 0 ? (
          <div className="admin-empty">
            <p>ليس لديك متاجر بعد. <button className="admin-btn approve" onClick={openCreate}>افتح متجرك الآن</button></p>
          </div>
        ) : stores.map(store => (
          <div key={store._id} className="merchant-store-card">
            <div className="merchant-store-header">
              <div className="merchant-store-info">
                {store.logoUrl && <img src={store.logoUrl} alt="" className="merchant-store-logo" />}
                <div>
                  <h2>{store.name}</h2>
                  <span className={`status-badge status-${store.status}`}>{store.status}</span>
                </div>
              </div>
              <button className="admin-btn" onClick={() => openEdit(store)}>✏️</button>
            </div>
            {store.description && <p>{store.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function MerchantProducts({ user }) {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState({});
  const [selectedStore, setSelectedStore] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', imageUrl: '', category: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    client.get('/stores?admin=true&limit=100').then(r => {
      const myStores = r.data.filter(s => s.ownerId === user._id || user.role === 'admin');
      setStores(myStores);
      myStores.forEach(s => {
        client.get(`/stores/${s._id}/products`).then(r => setProducts(prev => ({ ...prev, [s._id]: r.data })));
      });
    }).catch(() => {});
  };

  useEffect(() => { loadData(); }, [user]);

  const openCreate = (storeId) => {
    setSelectedStore(storeId);
    setForm({ name: '', description: '', price: '', imageUrl: '', category: '' });
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
          <button className="admin-btn approve" onClick={() => openCreate(selectedStore)}>+ إضافة منتج</button>
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
                <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
              </div>
              <div className="admin-field">
                <label>التصنيف</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
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

  useEffect(() => {
    client.get('/stores?admin=true&limit=100').then(r => {
      const myStores = r.data.filter(s => s.ownerId === user._id || user.role === 'admin');
      setStores(myStores);
      if (myStores.length > 0) {
        setSelectedStore(myStores[0]._id);
        setForm({
          name: myStores[0].name || '',
          description: myStores[0].description || '',
          logoUrl: myStores[0].logoUrl || '',
          coverUrl: myStores[0].coverUrl || '',
          whatsappNumber: myStores[0].whatsappNumber || '',
        });
      }
    }).catch(() => {});
  }, [user]);

  const selectStore = (id) => {
    setSelectedStore(id);
    const store = stores.find(s => s._id === id);
    if (store) {
      setForm({
        name: store.name || '',
        description: store.description || '',
        logoUrl: store.logoUrl || '',
        coverUrl: store.coverUrl || '',
        whatsappNumber: store.whatsappNumber || '',
      });
    }
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedStore) return;
    try {
      await client.put(`/stores/${selectedStore}`, form);
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
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="admin-input" />
          </div>
          <div className="admin-setting-field">
            <label>الوصف</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="admin-textarea" />
          </div>
          <div className="admin-setting-field">
            <label>رابط الشعار (Logo URL)</label>
            <input value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} className="admin-input" />
          </div>
          <div className="admin-setting-field">
            <label>رابط الغلاف (Cover URL)</label>
            <input value={form.coverUrl} onChange={e => setForm({ ...form, coverUrl: e.target.value })} className="admin-input" />
          </div>
          <div className="admin-setting-field">
            <label>رقم واتساب</label>
            <input value={form.whatsappNumber} onChange={e => setForm({ ...form, whatsappNumber: e.target.value })} className="admin-input" />
          </div>

          <button className="admin-btn approve" onClick={handleSave} style={{ padding: '10px 24px', marginTop: 8 }}>
            {saved ? '✓ تم الحفظ' : 'حفظ الإعدادات'}
          </button>
        </div>
      )}
    </div>
  );
}
