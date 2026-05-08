import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import FileUploader from '../../components/shared/FileUploader';

const TABS = [
  { id: 'stats', label: 'الإحصائيات', icon: '📊' },
  { id: 'tabs', label: 'التبويبات', icon: '📑' },
  { id: 'stores', label: 'المتاجر', icon: '🏪' },
  { id: 'ads', label: 'الإعلانات', icon: '📢' },
  { id: 'users', label: 'الأعضاء', icon: '👥' },
  { id: 'moderation', label: 'الرقابة', icon: '🛡️' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
  { id: 'trash', label: 'المحذوفات', icon: '🗑️' },
  { id: 'subscriptions', label: 'الاشتراكات', icon: '💎' },
  { id: 'roles', label: 'الصلاحيات', icon: '🔑' },
];

export default function Admin() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'stats';

  if (!user || user.role !== 'admin') {
    return (
      <div className="page-empty">
        <div className="page-empty-icon">🛡️</div>
        <h2>غير مصرح</h2>
        <p>هذه الصفحة للمشرفين فقط</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1>لوحة الإدارة</h1>

      {tab === 'stats' && <StatsSection />}
      {tab === 'tabs' && <TabsSection />}
      {tab === 'stores' && <StoresSection />}
      {tab === 'ads' && <AdsSection />}
      {tab === 'users' && <UsersSection />}
      {tab === 'moderation' && <ModerationSection />}
      {tab === 'settings' && <SettingsSection />}
      {tab === 'trash' && <TrashSection />}
      {tab === 'subscriptions' && <SubscriptionsSection />}
      {tab === 'roles' && <RolesSection />}
    </div>
  );
}

function StatsSection() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    client.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return <div className="home-loading">جاري التحميل...</div>;

  const items = [
    { label: 'إجمالي المتاجر', value: stats.stores?.total || 0, icon: '🏪' },
    { label: 'الإعلانات', value: stats.ads?.total || 0, icon: '📢' },
    { label: 'المنتجات', value: stats.products?.total || 0, icon: '📦' },
    { label: 'المستخدمين', value: stats.users?.total || 0, icon: '👥' },
  ];

  return (
    <div className="admin-stats">
      {items.map(item => (
        <div key={item.label} className="stat-card">
          <div className="stat-icon">{item.icon}</div>
          <span className="stat-number">{item.value}</span>
          <span className="stat-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function TabsSection() {
  const [tabs, setTabs] = useState([]);
  const [editTab, setEditTab] = useState(null);

  useEffect(() => {
    client.get('/tabs').then(r => setTabs(r.data)).catch(() => {});
  }, []);

  const saveTabs = async (newTabs) => {
    try {
      await client.post('/tabs', newTabs);
      setTabs(newTabs);
    } catch (e) {
      alert('فشل الحفظ');
    }
  };

  const toggleVisibility = (id) => {
    saveTabs(tabs.map(t => t.id === id ? { ...t, visible: !t.visible } : t));
  };

  const updateOrder = (id, dir) => {
    const idx = tabs.findIndex(t => t.id === id);
    if (idx === -1) return;
    const newTabs = [...tabs];
    const swap = idx + dir;
    if (swap < 0 || swap >= newTabs.length) return;
    [newTabs[idx], newTabs[swap]] = [newTabs[swap], newTabs[idx]];
    newTabs.forEach((t, i) => (t.order = i + 1));
    saveTabs(newTabs);
  };

  const editTabDetails = (tab) => {
    setEditTab({ ...tab });
  };

  const saveEdit = () => {
    if (!editTab) return;
    saveTabs(tabs.map(t => t.id === editTab.id ? editTab : t));
    setEditTab(null);
  };

  const addNewTab = () => {
    const id = prompt('المعرف (id) بالانجليزي:');
    if (!id) return;
    const label = prompt('الاسم (label):');
    if (!label) return;
    const newTab = { id, label, icon: 'fas fa-star', visible: true, order: tabs.length + 1, type: 'module' };
    saveTabs([...tabs, newTab]);
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>إدارة التبويبات</h2>
        <button className="admin-btn approve" onClick={addNewTab}>+ إضافة تبويب</button>
      </div>

      {editTab && (
        <div className="admin-modal-overlay" onClick={() => setEditTab(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>تعديل التبويب</h3>
            <div className="admin-field">
              <label>المعرف</label>
              <input value={editTab.id} disabled />
            </div>
            <div className="admin-field">
              <label>الاسم</label>
              <input value={editTab.label} onChange={e => setEditTab({ ...editTab, label: e.target.value })} />
            </div>
            <div className="admin-field">
              <label>الأيقونة</label>
              <input value={editTab.icon} onChange={e => setEditTab({ ...editTab, icon: e.target.value })} />
            </div>
            <div className="admin-modal-btns">
              <button className="admin-btn approve" onClick={saveEdit}>حفظ</button>
              <button className="admin-btn delete" onClick={() => setEditTab(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-list">
        {tabs.sort((a, b) => a.order - b.order).map((t, i) => (
          <div key={t.id} className="admin-item">
            <div className="admin-item-info">
              <span className="admin-tab-icon">{t.icon}</span>
              <div>
                <strong>{t.label}</strong>
                <span className="admin-tab-id">{t.id}</span>
              </div>
            </div>
            <div className="admin-item-actions">
              <button className="admin-btn" onClick={() => updateOrder(t.id, -1)} disabled={i === 0}>↑</button>
              <button className="admin-btn" onClick={() => updateOrder(t.id, 1)} disabled={i === tabs.length - 1}>↓</button>
              <button className="admin-btn" onClick={() => editTabDetails(t)}>✏️</button>
              <button className={`admin-btn ${t.visible ? 'approve' : 'delete'}`} onClick={() => toggleVisibility(t.id)}>
                {t.visible ? 'ظاهر' : 'مخفي'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoresSection() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [editStore, setEditStore] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadStores = () => {
    client.get('/stores?admin=true&limit=100').then(r => setStores(r.data)).catch(() => {});
  };

  useEffect(() => { loadStores(); }, []);

  const updateStoreStatus = async (id, status) => {
    try {
      await client.put(`/stores/${id}/status`, { status });
      setStores(prev => prev.map(s => s._id === id ? { ...s, status } : s));
    } catch (e) {
      alert('فشل تحديث الحالة: ' + (e.response?.data?.error || e.message));
    }
  };

  const saveStore = async (storeData) => {
    try {
      if (storeData._id) {
        const { data } = await client.put(`/stores/${storeData._id}`, storeData);
        setStores(prev => prev.map(s => s._id === storeData._id ? data.store : s));
      } else {
        const { data } = await client.post('/stores', { ...storeData, ownerId: storeData.ownerId || undefined });
        setStores(prev => [...prev, data.store]);
      }
      setShowForm(false);
      setEditStore(null);
    } catch (e) {
      alert('فشل الحفظ: ' + (e.response?.data?.error || e.message));
    }
  };

  const openCreate = () => {
    setEditStore(null);
    setShowForm(true);
  };

  const openEdit = (store) => {
    setEditStore({ ...store });
    setShowForm(true);
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>إدارة المتاجر</h2>
        <button className="admin-btn approve" onClick={openCreate}>+ إضافة متجر</button>
      </div>

      {showForm && (
        <StoreFormModal
          store={editStore}
          onSave={saveStore}
          onClose={() => { setShowForm(false); setEditStore(null); }}
        />
      )}

      <div className="admin-list">
        {stores.map(store => (
          <div key={store._id} className="admin-item">
            <div className="admin-item-info">
              {store.imageUrl && <img src={store.imageUrl} alt="" className="admin-thumb" />}
              <div>
                <strong>{store.name}</strong>
                <span className="admin-meta">{store.category}</span>
                <span className={`status-badge status-${store.status}`} style={{ marginRight: 8 }}>
                  {{ pending: 'قيد الانتظار', active: 'نشط', frozen: 'مجمد', deleted: 'محذوف' }[store.status] || store.status}
                </span>
              </div>
            </div>
            <div className="admin-item-actions">
              <button className="admin-btn" onClick={() => window.open(`/store/${store._id}`, '_blank')} title="عرض المتجر">👁️</button>
              <button className="admin-btn" onClick={() => navigate(`/merchant?tab=settings`)} title="إدارة كتاجر">🛠️</button>
              <button className="admin-btn" onClick={() => openEdit(store)} title="تعديل">✏️</button>
              {store.status === 'pending' && (
                <button className="admin-btn approve" onClick={() => updateStoreStatus(store._id, 'active')}>تفعيل</button>
              )}
              {store.status === 'active' && (
                <button className="admin-btn suspend" onClick={() => updateStoreStatus(store._id, 'frozen')}>تجميد</button>
              )}
              {store.status === 'frozen' && (
                <button className="admin-btn approve" onClick={() => updateStoreStatus(store._id, 'active')}>إعادة تفعيل</button>
              )}
              <button className="admin-btn delete" onClick={() => updateStoreStatus(store._id, 'deleted')}>حذف</button>
            </div>
          </div>
        ))}
        {stores.length === 0 && <div className="admin-empty">لا توجد متاجر</div>}
      </div>
    </div>
  );
}

function StoreFormModal({ store, onSave, onClose }) {
  const [form, setForm] = useState(store || { name: '', description: '', category: '', imageUrl: '', whatsappNumber: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || form.name.length < 3) { alert('اسم المتجر قصير جداً'); return; }
    if (!form.category) { alert('التصنيف مطلوب'); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <h3>{store?._id ? 'تعديل المتجر' : 'إضافة متجر جديد'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="admin-field">
            <label>اسم المتجر *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label>الوصف</label>
            <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
          <div className="admin-field">
            <label>التصنيف *</label>
            <input value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required placeholder="الأزياء, التقنية, ..." />
          </div>
          <div className="admin-field">
            <label>رابط الصورة</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={form.imageUrl || ''} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." style={{ flex: 1 }} />
              <FileUploader accept="image" onUpload={(url) => setForm(f => ({ ...f, imageUrl: url }))} label="رفع" />
            </div>
          </div>
          <div className="admin-field">
            <label>رقم واتساب</label>
            <input value={form.whatsappNumber || ''} onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))} />
          </div>
          <div className="admin-modal-btns">
            <button type="submit" className="admin-btn approve" disabled={saving}>
              {saving ? 'جاري الحفظ...' : '💾 حفظ'}
            </button>
            <button type="button" className="admin-btn delete" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdsSection() {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    client.get('/ads?admin=true&limit=100').then(r => setAds(r.data)).catch(() => {});
  }, []);

  const updateAdStatus = async (id, status) => {
    try {
      await client.put(`/ads/${id}/status`, { status });
      setAds(prev => prev.map(a => a._id === id ? { ...a, status } : a));
    } catch (e) {
      alert('فشل تحديث الحالة');
    }
  };

  return (
    <div className="admin-section">
      <h2>إدارة الإعلانات</h2>
      <div className="admin-list">
        {ads.map(ad => (
          <div key={ad._id} className="admin-item">
            <div className="admin-item-info">
              {ad.imageUrl && <img src={ad.imageUrl} alt="" className="admin-thumb" />}
              <div>
                <strong>{ad.title}</strong>
                <span className="admin-meta">{ad.category} · {ad.price} ر.س</span>
              </div>
            </div>
            <div className="admin-item-actions">
              <span className={`status-badge status-${ad.status}`}>{ad.status}</span>
              {ad.status !== 'active' && (
                <button className="admin-btn approve" onClick={() => updateAdStatus(ad._id, 'active')}>نشر</button>
              )}
              {ad.status !== 'rejected' && (
                <button className="admin-btn delete" onClick={() => updateAdStatus(ad._id, 'rejected')}>رفض</button>
              )}
            </div>
          </div>
        ))}
        {ads.length === 0 && <div className="admin-empty">لا توجد إعلانات</div>}
      </div>
    </div>
  );
}

function UsersSection() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    client.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const updateRole = async (id, role) => {
    try {
      await client.put(`/users/${id}/role`, { role });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role } : u));
    } catch (e) {
      alert('فشل تحديث الصلاحية');
    }
  };

  const toggleBan = async (id, currentStatus) => {
    const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
    const action = newStatus === 'banned' ? 'حظر' : 'إلغاء حظر';
    if (!confirm(`تأكيد ${action} هذا المستخدم؟`)) return;
    try {
      await client.put(`/users/${id}/status`, { status: newStatus });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, status: newStatus } : u));
    } catch (e) {
      alert('فشل تحديث الحالة');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('⚠️ حذف المستخدم نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
    try {
      await client.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (e) {
      alert('فشل الحذف');
    }
  };

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>إدارة الأعضاء</h2>
          <select className="admin-filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">الكل</option>
          <option value="admin">مشرف</option>
          <option value="merchant">تاجر</option>
          <option value="customer">مستخدم</option>
        </select>
      </div>
      <div className="admin-list">
        {filtered.map(u => (
          <div key={u._id} className="admin-item">
            <div className="admin-item-info">
              <div className="admin-avatar">{u.username?.charAt(0) || u.email?.charAt(0)}</div>
              <div>
                <strong>{u.username || u.email}</strong>
                <span className="admin-meta">{u.email}</span>
                <span className={`status-badge status-${u.status === 'banned' ? 'deleted' : 'active'}`} style={{ marginRight: 8 }}>
                  {u.status === 'banned' ? 'محظور' : 'نشط'}
                </span>
              </div>
            </div>
            <div className="admin-item-actions">
              <select
                className="admin-role-select"
                value={u.role}
                onChange={e => updateRole(u._id, e.target.value)}
              >
                <option value="customer">مستخدم</option>
                <option value="merchant">تاجر</option>
                <option value="admin">مشرف</option>
              </select>
              <button className="admin-btn" onClick={() => toggleBan(u._id, u.status)}>
                {u.status === 'banned' ? '✓ إلغاء حظر' : '🚫 حظر'}
              </button>
              <button className="admin-btn delete" onClick={() => deleteUser(u._id)}>🗑️</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="admin-empty">لا يوجد أعضاء</div>}
      </div>
    </div>
  );
}

function ModerationSection() {
  const [pending, setPending] = useState({ stores: [], ads: [] });

  useEffect(() => {
    Promise.all([
      client.get('/stores?admin=true&limit=50').then(r => r.data.filter(s => s.status === 'pending')).catch(() => []),
      client.get('/ads?admin=true&limit=50').then(r => r.data.filter(a => a.status === 'pending')).catch(() => []),
    ]).then(([stores, ads]) => setPending({ stores, ads }));
  }, []);

  const approveStore = async (id) => {
    try {
      await client.put(`/stores/${id}/status`, { status: 'active' });
      setPending(p => ({ ...p, stores: p.stores.filter(s => s._id !== id) }));
    } catch (e) { alert('فشل الموافقة'); }
  };

  const approveAd = async (id) => {
    try {
      await client.put(`/ads/${id}/status`, { status: 'active' });
      setPending(p => ({ ...p, ads: p.ads.filter(a => a._id !== id) }));
    } catch (e) { alert('فشل الموافقة'); }
  };

  return (
    <div className="admin-section">
      <h2>الرقابة - طلبات المراجعة</h2>

      <h3 className="admin-subtitle">المتاجر المعلقة ({pending.stores.length})</h3>
      <div className="admin-list">
        {pending.stores.map(store => (
          <div key={store._id} className="admin-item">
            <div className="admin-item-info">
              <strong>{store.name}</strong>
              <span className="admin-meta">{store.ownerId || 'بدون مالك'}</span>
            </div>
            <div className="admin-item-actions">
              <button className="admin-btn approve" onClick={() => approveStore(store._id)}>✓ قبول</button>
            </div>
          </div>
        ))}
        {pending.stores.length === 0 && <div className="admin-empty">لا توجد طلبات معلقة</div>}
      </div>

      <h3 className="admin-subtitle">الإعلانات المعلقة ({pending.ads.length})</h3>
      <div className="admin-list">
        {pending.ads.map(ad => (
          <div key={ad._id} className="admin-item">
            <div className="admin-item-info">
              <strong>{ad.title}</strong>
              <span className="admin-meta">{ad.category}</span>
            </div>
            <div className="admin-item-actions">
              <button className="admin-btn approve" onClick={() => approveAd(ad._id)}>✓ قبول</button>
              <button className="admin-btn delete" onClick={() => client.put(`/ads/${ad._id}/status`, { status: 'rejected' }).then(() => setPending(p => ({ ...p, ads: p.ads.filter(a => a._id !== ad._id) })))}>✕ رفض</button>
            </div>
          </div>
        ))}
        {pending.ads.length === 0 && <div className="admin-empty">لا توجد طلبات معلقة</div>}
      </div>
    </div>
  );
}

function SettingsSection() {
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client.get('/admin/settings').then(r => { setSettings(r.data); setDraft(r.data); }).catch(() => {});
  }, []);

  const updateDraft = (key, value) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const updateDraftNested = (path, value) => {
    const updated = { ...draft };
    const keys = path.split('.');
    let obj = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]] = { ...obj[keys[i]] };
    }
    obj[keys[keys.length - 1]] = value;
    setDraft(updated);
  };

  const save = async () => {
    setSaving(true);
    try {
      await client.put('/admin/settings', draft);
      setSettings(draft);
      alert('✅ تم حفظ الإعدادات بنجاح');
    } catch (e) {
      alert('❌ فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (!draft) return <div className="home-loading">جاري التحميل...</div>;

  return (
    <div className="admin-section">
      <h2>إعدادات النظام</h2>
      <div className="admin-settings">
        <div className="admin-setting-row">
          <div className="admin-setting-info">
            <strong>وضع الصيانة</strong>
            <p>تعطيل الموقع للزوار مع إبقائه متاحاً للمشرفين</p>
          </div>
          <label className="admin-toggle">
            <input type="checkbox" checked={draft.maintenanceMode} onChange={e => updateDraft('maintenanceMode', e.target.checked)} />
            <span className="admin-toggle-slider"></span>
          </label>
        </div>

        <div className="admin-setting-row">
          <div className="admin-setting-info">
            <strong>السماح بتسجيل متاجر جديدة</strong>
            <p>التحكم بإمكانية فتح متاجر جديدة من قبل المستخدمين</p>
          </div>
          <label className="admin-toggle">
            <input type="checkbox" checked={draft.allowNewMerchants} onChange={e => updateDraft('allowNewMerchants', e.target.checked)} />
            <span className="admin-toggle-slider"></span>
          </label>
        </div>

        <div className="admin-setting-row">
          <div className="admin-setting-info">
            <strong>السماح بإعلانات الضيوف</strong>
            <p>نشر إعلانات بدون تسجيل دخول</p>
          </div>
          <label className="admin-toggle">
            <input type="checkbox" checked={draft.allowGuestAds} onChange={e => updateDraft('allowGuestAds', e.target.checked)} />
            <span className="admin-toggle-slider"></span>
          </label>
        </div>

        <div className="admin-setting-field">
          <label>إعلان الموقع (Announcement)</label>
          <textarea value={draft.announcement || ''} onChange={e => updateDraft('announcement', e.target.value)} rows={3} />
        </div>

        <div className="admin-setting-field">
          <label>فيديو ترويجي (رابط YouTube أو MP4)</label>
          <input className="admin-input" value={draft.promoVideoUrl || ''} onChange={e => updateDraft('promoVideoUrl', e.target.value)} placeholder="https://youtube.com/... أو https://example.com/video.mp4" />
        </div>

        <div className="admin-setting-field">
          <label>فيديو صفحة الاشتراكات (رابط YouTube أو MP4)</label>
          <input className="admin-input" value={draft.promoVideoPlansUrl || ''} onChange={e => updateDraft('promoVideoPlansUrl', e.target.value)} placeholder="https://youtube.com/... أو https://example.com/video.mp4" />
        </div>

        <h3 className="admin-subtitle" style={{ marginTop: 24 }}>بوابة الدفع - MyFatoorah</h3>
        <div className="admin-setting-row">
          <div className="admin-setting-info">
            <strong>تفعيل بوابة الدفع</strong>
          </div>
          <label className="admin-toggle">
            <input type="checkbox" checked={draft.enablePaymentGateway} onChange={e => updateDraft('enablePaymentGateway', e.target.checked)} />
            <span className="admin-toggle-slider"></span>
          </label>
        </div>
        <div className="admin-setting-field">
          <label>MyFatoorah API Key</label>
          <input className="admin-input" value={draft.myfatoorah?.apiKey || ''} onChange={e => updateDraftNested('myfatoorah.apiKey', e.target.value)} />
        </div>
        <div className="admin-setting-field">
          <label>Merchant ID</label>
          <input className="admin-input" value={draft.myfatoorah?.merchantId || ''} onChange={e => updateDraftNested('myfatoorah.merchantId', e.target.value)} />
        </div>
        <div className="admin-setting-field">
          <label>البيئة</label>
          <select className="admin-filter-select" value={draft.myfatoorah?.mode || 'test'} onChange={e => updateDraftNested('myfatoorah.mode', e.target.value)}>
            <option value="test">اختبار (Test)</option>
            <option value="live">فعلي (Live)</option>
          </select>
        </div>

        <h3 className="admin-subtitle" style={{ marginTop: 24 }}>الفاتورة الإلكترونية - ZATCA</h3>
        <div className="admin-setting-row">
          <div className="admin-setting-info">
            <strong>تفعيل ZATCA</strong>
          </div>
          <label className="admin-toggle">
            <input type="checkbox" checked={draft.zatca?.enabled || false} onChange={e => updateDraftNested('zatca.enabled', e.target.checked)} />
            <span className="admin-toggle-slider"></span>
          </label>
        </div>
        <div className="admin-setting-field">
          <label>اسم الشركة</label>
          <input className="admin-input" value={draft.zatca?.companyName || ''} onChange={e => updateDraftNested('zatca.companyName', e.target.value)} />
        </div>
        <div className="admin-setting-field">
          <label>الرقم الضريبي</label>
          <input className="admin-input" value={draft.zatca?.taxNumber || ''} onChange={e => updateDraftNested('zatca.taxNumber', e.target.value)} />
        </div>
        <div className="admin-setting-field">
          <label>البيئة</label>
          <select className="admin-filter-select" value={draft.zatca?.environment || 'sandbox'} onChange={e => updateDraftNested('zatca.environment', e.target.value)}>
            <option value="sandbox">اختبار (Sandbox)</option>
            <option value="production">إنتاج (Production)</option>
          </select>
        </div>

        <button className="admin-save-btn" onClick={save} disabled={saving}>
          {saving ? 'جاري الحفظ...' : '💾 حفظ الإعدادات'}
        </button>
      </div>
    </div>
  );
}

function TrashSection() {
  const [items, setItems] = useState({ stores: [], ads: [], users: [] });

  useEffect(() => {
    Promise.all([
      client.get('/stores?admin=true&limit=100').then(r => r.data.filter(s => s.status === 'deleted')).catch(() => []),
      client.get('/ads?admin=true&limit=100').then(r => r.data.filter(a => a.status === 'deleted')).catch(() => []),
    ]).then(([stores, ads]) => setItems({ stores, ads, users: [] }));
  }, []);

  const restoreItem = async (type, id) => {
    const status = type === 'store' ? 'pending' : 'pending';
    const url = type === 'store' ? `/stores/${id}/status` : `/ads/${id}/status`;
    try {
      await client.put(url, { status });
      setItems(prev => ({
        ...prev,
        [type === 'store' ? 'stores' : 'ads']: prev[type === 'store' ? 'stores' : 'ads'].filter(i => i._id !== id)
      }));
    } catch (e) { alert('فشل الاستعادة'); }
  };

  return (
    <div className="admin-section">
      <h2>المحذوفات</h2>

      <h3 className="admin-subtitle">المتاجر المحذوفة ({items.stores.length})</h3>
      <div className="admin-list">
        {items.stores.map(store => (
          <div key={store._id} className="admin-item">
            <div className="admin-item-info">
              <strong>{store.name}</strong>
              <span className="status-badge status-deleted">محذوف</span>
            </div>
            <div className="admin-item-actions">
              <button className="admin-btn approve" onClick={() => restoreItem('store', store._id)}>استعادة</button>
            </div>
          </div>
        ))}
      </div>

      <h3 className="admin-subtitle">الإعلانات المحذوفة ({items.ads.length})</h3>
      <div className="admin-list">
        {items.ads.map(ad => (
          <div key={ad._id} className="admin-item">
            <div className="admin-item-info">
              <strong>{ad.title}</strong>
              <span className="admin-meta">{ad.category}</span>
            </div>
            <div className="admin-item-actions">
              <button className="admin-btn approve" onClick={() => restoreItem('ad', ad._id)}>استعادة</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubscriptionsSection() {
  const [plans, setPlans] = useState([]);
  const [editPlan, setEditPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/subscriptions/admin/plans')
      .then(r => setPlans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const savePlan = async (planData) => {
    try {
      const allowed = ['name', 'slug', 'price', 'originalPrice', 'duration', 'discount', 'features', 'highlighted', 'recommended', 'badge', 'active', 'order'];
      const clean = {};
      allowed.forEach(f => { if (planData[f] !== undefined) clean[f] = planData[f]; });
      if (planData._id) {
        const { data } = await client.put(`/subscriptions/admin/plans/${planData._id}`, clean);
        setPlans(prev => prev.map(p => p._id === planData._id ? data.plan : p));
      } else {
        const { data } = await client.post('/subscriptions/admin/plans', clean);
        setPlans(prev => [...prev, data.plan]);
      }
      setEditPlan(null);
    } catch (e) {
      alert('فشل الحفظ: ' + (e.response?.data?.error || e.message));
    }
  };

  const deletePlan = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;
    try {
      await client.delete(`/subscriptions/admin/plans/${id}`);
      setPlans(prev => prev.filter(p => p._id !== id));
    } catch (e) {
      alert('فشل الحذف');
    }
  };

  const seedPlans = async () => {
    if (!confirm('سيتم إضافة الخطط الافتراضية في حال عدم وجود خطط مسبقة. هل تريد المتابعة؟')) return;
    try {
      const { data } = await client.post('/subscriptions/plans/seed');
      if (data.success) {
        const res = await client.get('/subscriptions/admin/plans');
        setPlans(res.data);
      }
      alert(data.message || '✅ تمت إضافة الخطط الافتراضية');
    } catch (e) {
      alert(e.response?.data?.error || 'فشلت إضافة الخطط');
    }
  };

  if (loading) return <div className="home-loading">جاري التحميل...</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>إدارة خطط الاشتراك</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="admin-btn" onClick={seedPlans}>🌱 الخطط الافتراضية</button>
          <button className="admin-btn approve" onClick={() => setEditPlan({ name: '', slug: '', price: 0, duration: 'monthly', features: [], active: true, order: plans.length + 1 })}>
            + إضافة خطة
          </button>
        </div>
      </div>

      {editPlan && (
        <PlanFormModal
          plan={editPlan}
          onSave={savePlan}
          onClose={() => setEditPlan(null)}
        />
      )}

      <div className="admin-list">
        {plans.sort((a, b) => a.order - b.order).map(plan => (
          <div key={plan._id} className="admin-item">
            <div className="admin-item-info">
              <div>
                <strong>{plan.name}</strong>
                <span className="admin-meta">
                  {plan.price} ر.س / {plan.duration === 'yearly' ? 'سنوي' : 'شهري'}
                  {plan.badge && ` · وسام: ${plan.badge}`}
                </span>
                <span className={`status-badge status-${plan.active ? 'active' : 'deleted'}`}>
                  {plan.active ? 'نشط' : 'معطل'}
                </span>
              </div>
            </div>
            <div className="admin-item-actions">
              <button className="admin-btn" onClick={() => setEditPlan({ ...plan })}>✏️</button>
              <button className="admin-btn delete" onClick={() => deletePlan(plan._id)}>🗑️</button>
            </div>
          </div>
        ))}
        {plans.length === 0 && <div className="admin-empty">لا توجد خطط اشتراك</div>}
      </div>
    </div>
  );
}

function PlanFormModal({ plan, onSave, onClose }) {
  const [form, setForm] = useState(plan);
  const [featureInput, setFeatureInput] = useState('');

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setForm(f => ({ ...f, features: [...(f.features || []), featureInput.trim()] }));
    setFeatureInput('');
  };

  const removeFeature = (idx) => {
    setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <h3>{form._id ? 'تعديل الخطة' : 'إضافة خطة جديدة'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="admin-field">
            <label>الاسم *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label>المعرف (slug) *</label>
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required placeholder="basic, bronze, silver..." />
          </div>
          <div className="admin-field-row">
            <div className="admin-field" style={{ flex: 1 }}>
              <label>السعر (ريال) *</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} required />
            </div>
            <div className="admin-field" style={{ flex: 1 }}>
              <label>السعر الأصلي</label>
              <input type="number" value={form.originalPrice || ''} onChange={e => setForm(f => ({ ...f, originalPrice: Number(e.target.value) || undefined }))} />
            </div>
          </div>
          <div className="admin-field-row">
            <div className="admin-field" style={{ flex: 1 }}>
              <label>المدة</label>
              <select className="admin-filter-select" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}>
                <option value="monthly">شهري</option>
                <option value="yearly">سنوي</option>
              </select>
            </div>
            <div className="admin-field" style={{ flex: 1 }}>
              <label>الترتيب</label>
              <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="admin-field">
            <label>الخصم (نص)</label>
            <input value={form.discount || ''} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} placeholder="50%, مجاني..." />
          </div>
          <div className="admin-field">
            <label>الوسام (badge)</label>
            <input value={form.badge || ''} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="الأكثر مبيعاً, الأفضل..." />
          </div>
          <div className="admin-field-row">
            <label className="admin-toggle" style={{ justifyContent: 'flex-start', gap: 8 }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
              <span>نشط</span>
            </label>
            <label className="admin-toggle" style={{ justifyContent: 'flex-start', gap: 8 }}>
              <input type="checkbox" checked={form.highlighted || false} onChange={e => setForm(f => ({ ...f, highlighted: e.target.checked }))} />
              <span>مميز</span>
            </label>
            <label className="admin-toggle" style={{ justifyContent: 'flex-start', gap: 8 }}>
              <input type="checkbox" checked={form.recommended || false} onChange={e => setForm(f => ({ ...f, recommended: e.target.checked }))} />
              <span>موصى به</span>
            </label>
          </div>
          <div className="admin-field">
            <label>المميزات</label>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              <input value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder="أضف ميزة..."
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }} />
              <button type="button" className="admin-btn approve" onClick={addFeature}>+</button>
            </div>
            <div className="admin-features-list">
              {(form.features || []).map((f, i) => (
                <div key={i} className="admin-feature-tag">
                  <span>{f}</span>
                  <button type="button" onClick={() => removeFeature(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
          <div className="admin-modal-btns">
            <button type="submit" className="admin-btn approve">💾 حفظ</button>
            <button type="button" className="admin-btn delete" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RolesSection() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    client.get('/users').then(r => setUsers(r.data.filter(u => u.role === 'admin' || u.role === 'merchant'))).catch(() => {});
  }, []);

  const updateUserRole = async (id, role) => {
    try {
      await client.put(`/users/${id}/role`, { role });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role } : u));
    } catch (e) {
      alert('فشل تحديث الصلاحية');
    }
  };

  return (
    <div className="admin-section">
      <h2>إدارة الصلاحيات</h2>
      <p className="admin-section-desc">تحديد صلاحيات المشرفين والتجار</p>
      <div className="admin-list">
        {users.map(u => (
          <div key={u._id} className="admin-item">
            <div className="admin-item-info">
              <div className="admin-avatar">{u.username?.charAt(0) || u.email?.charAt(0)}</div>
              <div>
                <strong>{u.username || u.email}</strong>
                <span className="admin-meta">{u.email}</span>
              </div>
            </div>
            <div className="admin-item-actions">
              <select className="admin-role-select" value={u.role} onChange={e => updateUserRole(u._id, e.target.value)}>
                <option value="customer">مستخدم</option>
                <option value="merchant">تاجر</option>
                <option value="admin">مشرف</option>
              </select>
            </div>
          </div>
        ))}
        {users.length === 0 && <div className="admin-empty">لا يوجد مستخدمون بصلاحيات خاصة</div>}
      </div>
    </div>
  );
}
