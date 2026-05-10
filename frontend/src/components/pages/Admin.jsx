import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import FileUploader from '../../components/shared/FileUploader';
import { openWhatsApp } from '../../utils/whatsapp';

const TABS = [
  { id: 'stats', label: 'الإحصائيات', icon: '📊' },
  { id: 'tabs', label: 'التبويبات', icon: '📑' },
  { id: 'stores', label: 'المتاجر', icon: '🏪' },
  { id: 'ads', label: 'الإعلانات', icon: '📢' },
  { id: 'users', label: 'الأعضاء', icon: '👥' },
  { id: 'orders', label: 'الطلبات', icon: '📋' },
  { id: 'moderation', label: 'الرقابة', icon: '🛡️' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
  { id: 'trash', label: 'المحذوفات', icon: '🗑️' },
  { id: 'subscriptions', label: 'الاشتراكات', icon: '💎' },
  { id: 'roles', label: 'الصلاحيات', icon: '🔑' },
  { id: 'reviews', label: 'التقييمات', icon: '⭐' },
];

const TAB_PERM_MAP = {
  stats: 'dashboard',
  tabs: 'tabs',
  stores: 'stores',
  ads: 'ads',
  users: 'users',
  orders: 'settings',
  moderation: 'moderation',
  settings: 'settings',
  trash: 'trash',
  subscriptions: 'subscriptions',
  roles: 'users',
  reviews: 'reviews',
  products: 'products'
};

function hasAnyPerm(perms, group) {
  const g = perms?.[group];
  if (!g) return false;
  return Object.values(g).some(v => v === true);
}

function canAccessTab(perms, tabId) {
  if (!perms) return false;
  const group = TAB_PERM_MAP[tabId];
  if (!group) return false;
  if (group === 'users' && tabId === 'roles') return perms.users?.edit_roles === true;
  return hasAnyPerm(perms, group);
}

export default function Admin() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'stats';

  const perms = user?.permissions || {};
  const isSuperAdmin = perms.ops?.manage === true;
  const hasAdminAccess = isSuperAdmin || Object.keys(TAB_PERM_MAP).some(t => canAccessTab(perms, t));

  if (!user || !hasAdminAccess) {
    return (
      <div className="page-empty">
        <div className="page-empty-icon">🛡️</div>
        <h2>غير مصرح</h2>
        <p>هذه الصفحة للمشرفين فقط</p>
      </div>
    );
  }

  const allowedTabs = TABS.filter(t => isSuperAdmin || canAccessTab(perms, t.id));

  if (!allowedTabs.some(t => t.id === tab)) {
    return <Navigate to="/admin?tab=stats" replace />;
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
      {tab === 'reviews' && <ReviewsSection />}
      {tab === 'orders' && <OrdersSection />}
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
  const [linkStore, setLinkStore] = useState(null);
  const [users, setUsers] = useState([]);

  const loadStores = () => {
    client.get('/stores?admin=true&limit=100').then(({ data }) => {
      setStores(data);
      if (linkStore) setLinkStore(data.find(s => s._id === linkStore._id) || linkStore);
    }).catch(() => {});
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

  const linkMember = async (storeId, userId) => {
    try {
      await client.post(`/stores/${storeId}/members`, { userId });
      loadStores();
      alert('تم ربط العضو بالمتجر');
    } catch (e) {
      alert('فشل الربط: ' + (e.response?.data?.error || e.message));
    }
  };

  const unlinkMember = async (storeId, userId) => {
    if (!confirm('تأكيد فك الارتباط؟')) return;
    try {
      await client.delete(`/stores/${storeId}/members/${userId}`);
      loadStores();
    } catch (e) {
      alert('فشل فك الارتباط');
    }
  };

  const openLinkModal = async (store) => {
    try {
      const { data } = await client.get('/users');
      setUsers(data);
      setLinkStore(store);
    } catch (e) {
      alert('فشل تحميل المستخدمين');
    }
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
                {store.members?.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                    الأعضاء: {store.members.map(m => m.username || m.email || m).join('، ')}
                  </div>
                )}
              </div>
            </div>
            <div className="admin-item-actions">
              <button className="admin-btn" onClick={() => openLinkModal(store)} title="ربط أعضاء">👥 ربط</button>
              <button className="admin-btn" onClick={() => window.open(`/store/${store._id}`, '_blank')} title="معاينة المتجر">👁️ معاينة</button>
              <button className="admin-btn simulate-btn" onClick={() => navigate(`/store/${store._id}?simulate=true`)} title="محاكاة المتجر">🕹️ محاكاة</button>
              <button className="admin-btn" onClick={() => navigate(`/merchant?tab=settings`)} title="إدارة كتاجر">🛠️</button>
              <button className="admin-btn" onClick={() => openEdit(store)} title="تعديل">✏️</button>
              {(store.financial?.whatsapp || store.whatsappNumber) && (
                <button className="admin-btn" style={{ background: '#25D366', color: '#fff' }}
                  onClick={() => openWhatsApp(store.financial?.whatsapp || store.whatsappNumber, 'مرحباً، من إدارة منصة العينية بخصوص متجرك')}
                  title="واتساب التاجر">📱</button>
              )}
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

      {linkStore && (
        <div className="admin-modal-overlay" onClick={() => setLinkStore(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>👥 ربط أعضاء بـ {linkStore.name}</h3>
            {linkStore.members?.length > 0 && (
              <div className="admin-field">
                <label>الأعضاء الحاليون</label>
                {linkStore.members.map(m => (
                  <div key={m._id || m} className="admin-item" style={{ marginBottom: 4 }}>
                    <span>{m.username || m.email || m}</span>
                    <button className="admin-btn delete" style={{ marginRight: 'auto' }} onClick={() => unlinkMember(linkStore._id, m._id || m)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="admin-field" style={{ marginTop: 12 }}>
              <label>إضافة عضو</label>
              <div className="admin-list" style={{ maxHeight: 300, overflowY: 'auto' }}>
                {users.filter(u => !linkStore.members?.some(m => (m._id || m) === u._id) && linkStore.ownerId !== u._id).map(u => (
                  <div key={u._id} className="admin-item" style={{ cursor: 'pointer' }} onClick={() => linkMember(linkStore._id, u._id)}>
                    <div className="admin-item-info">
                      <div className="admin-avatar">{u.username?.charAt(0) || u.email?.charAt(0)}</div>
                      <div>
                        <strong>{u.username || u.email}</strong>
                        <span className="admin-meta">{u.role === 'merchant' ? 'تاجر' : u.role === 'admin' ? 'مشرف' : 'مستخدم'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {users.filter(u => !linkStore.members?.some(m => (m._id || m) === u._id) && linkStore.ownerId !== u._id).length === 0 && (
                  <div className="admin-empty">جميع المستخدمين مرتبطين بالفعل</div>
                )}
              </div>
            </div>
            <div className="admin-modal-btns">
              <button className="admin-btn" onClick={() => setLinkStore(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
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
  const [stores, setStores] = useState([]);
  const [filter, setFilter] = useState('all');
  const [linkUser, setLinkUser] = useState(null);
  const [permsUser, setPermsUser] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const loadData = async () => {
    const [u, s] = await Promise.all([
      client.get('/users').then(r => r.data).catch(() => []),
      client.get('/stores?admin=true&limit=100').then(r => r.data).catch(() => [])
    ]);
    setUsers(u);
    setStores(s);
  };

  useEffect(() => { loadData(); }, []);

  const updateRole = async (id, role) => {
    try {
      const { data } = await client.put(`/users/${id}/role`, { role });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: data.user.role, permissions: data.user.permissions } : u));
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

  const linkToStore = async (userId, storeId) => {
    try {
      await client.post(`/stores/${storeId}/members`, { userId });
      setLinkUser(null);
      loadData();
      alert('تم ربط العضو بالمتجر بنجاح');
    } catch (e) {
      alert('فشل الربط: ' + (e.response?.data?.error || e.message));
    }
  };

  const unlinkFromStore = async (storeId, userId) => {
    try {
      await client.delete(`/stores/${storeId}/members/${userId}`);
      loadData();
      alert('تم فك الارتباط');
    } catch (e) {
      alert('فشل فك الارتباط');
    }
  };

  const updateUserPerm = async (userId, group, permKey, value) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;
    const newPerms = {
      ...user.permissions,
      [group]: { ...(user.permissions?.[group] || {}), [permKey]: value }
    };
    try {
      await client.put(`/users/${userId}/permissions`, { permissions: newPerms });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, permissions: newPerms } : u));
      if (permsUser?._id === userId) setPermsUser(p => ({ ...p, permissions: newPerms }));
    } catch (e) {
      alert('فشل تحديث الصلاحية');
    }
  };

  const setAllUserPerms = async (userId, group, value) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;
    const groupKeys = Object.keys(PERMISSION_GROUPS[group].perms);
    const newPerms = {
      ...user.permissions,
      [group]: { ...(user.permissions?.[group] || {}), ...Object.fromEntries(groupKeys.map(k => [k, value])) }
    };
    try {
      await client.put(`/users/${userId}/permissions`, { permissions: newPerms });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, permissions: newPerms } : u));
      if (permsUser?._id === userId) setPermsUser(p => ({ ...p, permissions: newPerms }));
    } catch (e) {
      alert('فشل تحديث الصلاحية');
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
        {filtered.map(u => {
          const linkedStores = stores.filter(s => s.members?.some(m => (m._id || m) === u._id) || s.ownerId === u._id);
          return (
          <div key={u._id} className="admin-item">
            <div className="admin-item-info">
              <div className="admin-avatar">{u.username?.charAt(0) || u.email?.charAt(0)}</div>
              <div>
                <strong>{u.username || u.email}</strong>
                <span className="admin-meta">{u.email}</span>
                <span className={`status-badge status-${u.status === 'banned' ? 'deleted' : 'active'}`} style={{ marginRight: 8 }}>
                  {u.status === 'banned' ? 'محظور' : 'نشط'}
                </span>
                {linkedStores.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                    المتاجر: {linkedStores.map(s => s.name).join('، ')}
                  </div>
                )}
              </div>
            </div>
            <div className="admin-item-actions">
              <button className="admin-btn" onClick={() => setLinkUser(u)} title="ربط بمتجر">🔗 ربط</button>
              <button className="admin-btn" onClick={() => setPermsUser({ ...u })} title="الصلاحيات">🔑</button>
              <button className="admin-btn" onClick={() => setEditUser({ _id: u._id, username: u.username, email: u.email })} title="تعديل">✏️</button>
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
          );
        })}
        {filtered.length === 0 && <div className="admin-empty">لا يوجد أعضاء</div>}
      </div>

      {linkUser && (
        <div className="admin-modal-overlay" onClick={() => setLinkUser(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>🔗 ربط {linkUser.username || linkUser.email} بمتجر</h3>
            <div className="admin-list" style={{ maxHeight: 400, overflowY: 'auto' }}>
              {stores.filter(s => !s.members?.some(m => (m._id || m) === linkUser._id) && s.ownerId !== linkUser._id).map(s => (
                <div key={s._id} className="admin-item" style={{ cursor: 'pointer' }} onClick={() => linkToStore(linkUser._id, s._id)}>
                  <div className="admin-item-info">
                    {s.imageUrl && <img src={s.imageUrl} alt="" className="admin-thumb" />}
                    <div>
                      <strong>{s.name}</strong>
                      <span className="admin-meta">{s.category}</span>
                    </div>
                  </div>
                </div>
              ))}
              {stores.filter(s => !s.members?.some(m => (m._id || m) === linkUser._id) && s.ownerId !== linkUser._id).length === 0 && (
                <div className="admin-empty">لا توجد متاجر متاحة للربط</div>
              )}
            </div>
            <div className="admin-modal-btns">
              <button className="admin-btn" onClick={() => setLinkUser(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <EditUserModal user={editUser} onClose={() => { setEditUser(null); loadData(); }} />
      )}

      {permsUser && (
        <div className="admin-modal-overlay" onClick={() => setPermsUser(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3>🔑 صلاحيات {permsUser.username || permsUser.email}</h3>
            <div className="perms-grid" style={{ marginTop: 8 }}>
              {Object.entries(PERMISSION_GROUPS).filter(([, g]) => g.roles.includes(permsUser.role)).map(([groupKey, group]) => (
                <div key={groupKey} className="perms-group">
                  <div className="perms-group-header">
                    <span>{group.icon} {group.label}</span>
                    <div className="perms-quick">
                      <button className="perms-quick-btn" onClick={() => setAllUserPerms(permsUser._id, groupKey, true)} title="تفعيل الكل">✔️</button>
                      <button className="perms-quick-btn" onClick={() => setAllUserPerms(permsUser._id, groupKey, false)} title="تعطيل الكل">✖️</button>
                    </div>
                  </div>
                  {Object.entries(group.perms).map(([permKey, permLabel]) => {
                    const checked = permsUser.permissions?.[groupKey]?.[permKey] || false;
                    return (
                      <label key={permKey} className="perms-checkbox">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => updateUserPerm(permsUser._id, groupKey, permKey, e.target.checked)}
                        />
                        <span>{permLabel}</span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="admin-modal-btns">
              <button className="admin-btn" onClick={() => setPermsUser(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
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

        <h3 className="admin-subtitle" style={{ marginTop: 24 }}>معلومات التواصل مع الإدارة</h3>
        <div className="admin-setting-field">
          <label>رقم واتساب الإدارة</label>
          <input className="admin-input" value={draft.adminWhatsapp || ''} onChange={e => updateDraft('adminWhatsapp', e.target.value)} placeholder="+966501234567" dir="ltr" />
        </div>
        <div className="admin-setting-field">
          <label>البريد الإلكتروني للإدارة</label>
          <input className="admin-input" value={draft.adminEmail || ''} onChange={e => updateDraft('adminEmail', e.target.value)} placeholder="admin@aleinia.com" dir="ltr" />
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

        <h3 className="admin-subtitle" style={{ marginTop: 24 }}>الموردون المتعددون - MultiSupplier</h3>
        <div className="admin-setting-field">
          <label>كود مورد المنصة (حرية ابداع)</label>
          <input className="admin-input" type="number" value={draft.myfatoorah?.platformSupplierCode || 0} onChange={e => updateDraftNested('myfatoorah.platformSupplierCode', Number(e.target.value))} />
        </div>
        <div className="admin-setting-field">
          <label>كود مورد الشريك (رياحين المدينة)</label>
          <input className="admin-input" type="number" value={draft.myfatoorah?.partnerSupplierCode || 0} onChange={e => updateDraftNested('myfatoorah.partnerSupplierCode', Number(e.target.value))} />
        </div>
        <div className="admin-setting-field">
          <label>نسبة عمولة المنصة (%)</label>
          <input className="admin-input" type="number" min={0} max={100} value={draft.commissionPercent || 0} onChange={e => updateDraft('commissionPercent', Number(e.target.value))} />
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
      const allowed = ['name', 'slug', 'price', 'originalPrice', 'duration', 'discount', 'features', 'highlighted', 'recommended', 'badge', 'active', 'contactOnly', 'order'];
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
                {plan.contactOnly && <span className="status-badge" style={{ background: '#25D366', color: '#fff' }}>واتساب فقط</span>}
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
            <label className="admin-toggle" style={{ justifyContent: 'flex-start', gap: 8 }}>
              <input type="checkbox" checked={form.contactOnly || false} onChange={e => setForm(f => ({ ...f, contactOnly: e.target.checked }))} />
              <span>تواصل فقط (للشركات)</span>
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

function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = () => {
    setLoading(true);
    client.get('/admin/reviews').then(r => { setReviews(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, []);

  const deleteReview = async (productId, reviewId) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
    try {
      await client.delete(`/admin/reviews/${productId}/${reviewId}`);
      setReviews(prev => prev.filter(r => r._id !== reviewId));
    } catch (e) {
      alert('فشل حذف التقييم');
    }
  };

  if (loading) return <div className="home-loading">جاري التحميل...</div>;

  return (
    <div className="admin-section">
      <h2>إدارة التقييمات</h2>
      <p className="admin-section-desc">مراجعة وحذف التقييمات المخالفة</p>
      <div className="admin-list">
        {reviews.map(r => (
          <div key={r._id} className="admin-item">
            <div className="admin-item-info">
              <strong>{r.user}</strong>
              <span className="admin-meta">{'⭐'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              {r.comment && <p style={{ fontSize: 12, color: 'var(--text-main)', margin: '2px 0' }}>"{r.comment}"</p>}
              <span className="admin-meta">المنتج: {r.productName} | المتجر: {r.storeName}</span>
              <span className="admin-meta">{new Date(r.date).toLocaleDateString('ar-SA')}</span>
            </div>
            <div className="admin-item-actions">
              <button className="admin-btn delete" onClick={() => deleteReview(r.productId, r._id)}>🗑️ حذف</button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <div className="admin-empty">لا توجد تقييمات</div>}
      </div>
    </div>
  );
}

function OrdersSection() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchOrders = () => {
    setLoading(true);
    client.get('/admin/orders', { params: { status: filterStatus !== 'all' ? filterStatus : undefined } })
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [filterStatus]);

  const updateStatus = async (id, status) => {
    try {
      await client.put(`/admin/orders/${id}/status`, { status });
      fetchOrders();
    } catch { alert('فشل تحديث حالة الطلب'); }
  };

  const checkPayment = async (ref) => {
    try {
      const { data } = await client.post(`/admin/payments/check/${ref}`);
      alert(JSON.stringify(data.Data || data, null, 2));
    } catch { alert('فشل التحقق من حالة الدفع'); }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>الطلبات</h2>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="admin-input" style={{ width: 150 }}>
          <option value="all">كل الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="paid">مدفوع</option>
          <option value="failed">فشل</option>
        </select>
      </div>
      <div className="admin-list">
        {loading ? <div className="admin-empty">جاري التحميل...</div> : orders.length === 0 ? (
          <div className="admin-empty">لا توجد طلبات</div>
        ) : orders.map(order => (
          <div key={order._id} className="admin-item">
            <div className="admin-item-info">
              <strong>{order.customerName || 'غير معروف'}</strong>
              <span className="admin-meta">{order.customerEmail} {order.customerPhone ? `| ${order.customerPhone}` : ''}</span>
              <span className="admin-meta">المبلغ: {order.total} ر.س | المتجر: {order.storeId?.name || 'غير معروف'}</span>
              {order.items?.length > 0 && (
                <span className="admin-meta">المنتجات: {order.items.map(i => i.name).join('، ')}</span>
              )}
              <span className={`status-badge status-${order.status}`}>
                {{ pending: 'قيد الانتظار', paid: 'مدفوع', failed: 'فشل' }[order.status] || order.status}
              </span>
              <span className="admin-meta">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</span>
            </div>
            <div className="admin-item-actions">
              {order.paymentReference && (
                <button className="admin-btn" onClick={() => checkPayment(order.paymentReference)}>🔍 تحقق</button>
              )}
              {order.status === 'pending' && (
                <button className="admin-btn approve" onClick={() => updateStatus(order._id, 'paid')}>✅ تأكيد</button>
              )}
              {order.status !== 'failed' && order.status !== 'cancelled' && (
                <button className="admin-btn delete" onClick={() => updateStatus(order._id, 'cancelled')}>❌ إلغاء</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose }) {
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const body = {};
      if (username !== user.username) body.username = username;
      if (email !== user.email) body.email = email;
      if (password) body.password = password;
      if (Object.keys(body).length === 0) { setError('لا توجد تغييرات'); setLoading(false); return; }
      await client.put(`/users/${user._id}`, body);
      setSuccess('✅ تم الحفظ');
      setTimeout(onClose, 1000);
    } catch (e) {
      setError(e.response?.data?.error || 'فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <h3>✏️ تعديل العضو</h3>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <div className="auth-field">
            <label>الاسم</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="auth-field">
            <label>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="auth-field">
            <label>كلمة المرور الجديدة</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="اترك فارغاً إذا لا تريد التغيير" />
          </div>
          {error && <div className="auth-error">{error}</div>}
          {success && <div style={{ color: '#22c55e', fontSize: 13 }}>{success}</div>}
          <div className="admin-modal-btns">
            <button type="submit" className="admin-btn approve" disabled={loading}>{loading ? 'جاري...' : 'حفظ'}</button>
            <button type="button" className="admin-btn" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const PERMISSION_GROUPS = {
  stores: { label: 'المتاجر', icon: '🏪', perms: { manage: 'إدارة', simulate: 'محاكاة', activate: 'تفعيل', freeze: 'تجميد', delete: 'حذف' }, roles: ['admin', 'merchant'] },
  ads: { label: 'الإعلانات', icon: '📢', perms: { manage: 'إدارة', approve: 'موافقة', reject: 'رفض', delete: 'حذف' }, roles: ['admin', 'merchant'] },
  products: { label: 'المنتجات', icon: '📦', perms: { manage: 'إدارة', approve: 'موافقة', delete: 'حذف' }, roles: ['admin', 'merchant'] },
  reviews: { label: 'التقييمات', icon: '⭐', perms: { manage: 'إدارة', delete: 'حذف' }, roles: ['admin', 'merchant'] },
  dashboard: { label: 'الإحصائيات', icon: '📊', perms: { view: 'عرض' }, roles: ['admin', 'merchant'] },
  ops: { label: 'العمليات', icon: '⚙️', perms: { manage: 'إدارة', tickets: 'التذاكر', refunds: 'المبالغ المستردة' }, roles: ['admin'] },
  moderation: { label: 'الرقابة', icon: '🛡️', perms: { manage: 'إدارة', content_review: 'مراجعة المحتوى', ban_users: 'حظر الأعضاء' }, roles: ['admin'] },
  users: { label: 'الأعضاء', icon: '👥', perms: { manage: 'إدارة', edit_roles: 'تعديل الصلاحيات' }, roles: ['admin'] },
  subscriptions: { label: 'الاشتراكات', icon: '💎', perms: { view: 'عرض', manage: 'إدارة' }, roles: ['admin'] },
  tabs: { label: 'التبويبات', icon: '📑', perms: { manage: 'إدارة' }, roles: ['admin'] },
  settings: { label: 'الإعدادات', icon: '⚙️', perms: { view: 'عرض', manage: 'إدارة' }, roles: ['admin'] },
  trash: { label: 'المحذوفات', icon: '🗑️', perms: { view: 'عرض', restore: 'استعادة' }, roles: ['admin'] }
};

function RolesSection() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    client.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const updatePermissions = async (userId, group, permKey, value) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;
    const newPerms = {
      ...user.permissions,
      [group]: { ...(user.permissions?.[group] || {}), [permKey]: value }
    };
    try {
      await client.put(`/users/${userId}/permissions`, { permissions: newPerms });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, permissions: newPerms } : u));
    } catch (e) {
      alert('فشل تحديث الصلاحية');
    }
  };

  const setAllGroup = async (userId, group, value) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;
    const groupKeys = Object.keys(PERMISSION_GROUPS[group].perms);
    const newPerms = {
      ...user.permissions,
      [group]: { ...(user.permissions?.[group] || {}), ...Object.fromEntries(groupKeys.map(k => [k, value])) }
    };
    try {
      await client.put(`/users/${userId}/permissions`, { permissions: newPerms });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, permissions: newPerms } : u));
    } catch (e) {
      alert('فشل تحديث الصلاحية');
    }
  };

  return (
    <div className="admin-section">
      <h2>إدارة الصلاحيات</h2>
      <p className="admin-section-desc">صلاحيات دقيقة لكل عضو في المنصة</p>
      <div className="admin-list">
        {users.filter(u => u.role === 'admin' || u.role === 'merchant').length === 0 && (
          <div className="admin-empty">لا يوجد مستخدمون بصلاحيات خاصة</div>
        )}
        {users.filter(u => u.role === 'admin' || u.role === 'merchant').map(u => (
          <div key={u._id} className="admin-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="admin-avatar">{u.username?.charAt(0) || u.email?.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <strong>{u.username || u.email}</strong>
                <span className="admin-meta">{u.email}</span>
                <span className={`status-badge ${u.role === 'admin' ? 'status-active' : 'status-pending'}`} style={{ marginRight: 8, fontSize: 10 }}>
                  {u.role === 'admin' ? 'مشرف' : 'تاجر'}
                </span>
              </div>
            </div>
            <div className="perms-grid">
              {Object.entries(PERMISSION_GROUPS).filter(([, g]) => g.roles.includes(u.role)).map(([groupKey, group]) => (
                <div key={groupKey} className="perms-group">
                  <div className="perms-group-header">
                    <span>{group.icon} {group.label}</span>
                    <div className="perms-quick">
                      <button className="perms-quick-btn" onClick={() => setAllGroup(u._id, groupKey, true)} title="تفعيل الكل">✔️</button>
                      <button className="perms-quick-btn" onClick={() => setAllGroup(u._id, groupKey, false)} title="تعطيل الكل">✖️</button>
                    </div>
                  </div>
                  {Object.entries(group.perms).map(([permKey, permLabel]) => {
                    const checked = u.permissions?.[groupKey]?.[permKey] || false;
                    return (
                      <label key={permKey} className="perms-checkbox">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => updatePermissions(u._id, groupKey, permKey, e.target.checked)}
                        />
                        <span>{permLabel}</span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
