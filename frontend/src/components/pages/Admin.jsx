import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';

const TABS = [
  { id: 'stats', label: 'الإحصائيات', icon: '📊' },
  { id: 'tabs', label: 'التبويبات', icon: '📑' },
  { id: 'stores', label: 'المتاجر', icon: '🏪' },
  { id: 'ads', label: 'الإعلانات', icon: '📢' },
  { id: 'users', label: 'الأعضاء', icon: '👥' },
  { id: 'moderation', label: 'الرقابة', icon: '🛡️' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
  { id: 'trash', label: 'المحذوفات', icon: '🗑️' },
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
  const [stores, setStores] = useState([]);

  useEffect(() => {
    client.get('/stores?admin=true&limit=100').then(r => setStores(r.data)).catch(() => {});
  }, []);

  const updateStoreStatus = async (id, status) => {
    try {
      await client.put(`/stores/${id}/status`, { status });
      setStores(prev => prev.map(s => s._id === id ? { ...s, status } : s));
    } catch (e) {
      alert('فشل تحديث الحالة: ' + (e.response?.data?.error || e.message));
    }
  };

  return (
    <div className="admin-section">
      <h2>إدارة المتاجر</h2>
      <div className="admin-list">
        {stores.map(store => (
          <div key={store._id} className="admin-item">
            <div className="admin-item-info">
              <strong>{store.name}</strong>
              <span className={`status-badge status-${store.status}`}>{store.status}</span>
            </div>
            <div className="admin-item-actions">
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

  useEffect(() => {
    client.get('/admin/settings').then(r => setSettings(r.data)).catch(() => {});
  }, []);

  const update = async (key, value) => {
    let updated;
    if (key === '') {
      updated = value;
    } else {
      updated = { ...settings, [key]: value };
    }
    try {
      await client.put('/admin/settings', updated);
      setSettings(updated);
    } catch (e) {
      alert('فشل حفظ الإعدادات');
    }
  };

  const updateNested = (path, value) => {
    const updated = { ...settings };
    const keys = path.split('.');
    let obj = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]] = { ...obj[keys[i]] };
    }
    obj[keys[keys.length - 1]] = value;
    update('', updated);
  };

  if (!settings) return <div className="home-loading">جاري التحميل...</div>;

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
            <input type="checkbox" checked={settings.maintenanceMode} onChange={e => update('maintenanceMode', e.target.checked)} />
            <span className="admin-toggle-slider"></span>
          </label>
        </div>

        <div className="admin-setting-row">
          <div className="admin-setting-info">
            <strong>السماح بتسجيل متاجر جديدة</strong>
            <p>التحكم بإمكانية فتح متاجر جديدة من قبل المستخدمين</p>
          </div>
          <label className="admin-toggle">
            <input type="checkbox" checked={settings.allowNewMerchants} onChange={e => update('allowNewMerchants', e.target.checked)} />
            <span className="admin-toggle-slider"></span>
          </label>
        </div>

        <div className="admin-setting-row">
          <div className="admin-setting-info">
            <strong>السماح بإعلانات الضيوف</strong>
            <p>نشر إعلانات بدون تسجيل دخول</p>
          </div>
          <label className="admin-toggle">
            <input type="checkbox" checked={settings.allowGuestAds} onChange={e => update('allowGuestAds', e.target.checked)} />
            <span className="admin-toggle-slider"></span>
          </label>
        </div>

        <div className="admin-setting-field">
          <label>إعلان الموقع (Announcement)</label>
          <textarea value={settings.announcement || ''} onChange={e => update('announcement', e.target.value)} rows={3} />
        </div>

        <div className="admin-setting-field">
          <label>فيديو ترويجي (رابط YouTube أو MP4)</label>
          <input className="admin-input" value={settings.promoVideoUrl || ''} onChange={e => update('promoVideoUrl', e.target.value)} placeholder="https://youtube.com/... أو https://example.com/video.mp4" />
        </div>

        <div className="admin-setting-field">
          <label>فيديو صفحة الاشتراكات (رابط YouTube أو MP4)</label>
          <input className="admin-input" value={settings.promoVideoPlansUrl || ''} onChange={e => update('promoVideoPlansUrl', e.target.value)} placeholder="https://youtube.com/... أو https://example.com/video.mp4" />
        </div>

        <h3 className="admin-subtitle" style={{ marginTop: 24 }}>بوابة الدفع - MyFatoorah</h3>
        <div className="admin-setting-row">
          <div className="admin-setting-info">
            <strong>تفعيل بوابة الدفع</strong>
          </div>
          <label className="admin-toggle">
            <input type="checkbox" checked={settings.enablePaymentGateway} onChange={e => update('enablePaymentGateway', e.target.checked)} />
            <span className="admin-toggle-slider"></span>
          </label>
        </div>
        <div className="admin-setting-field">
          <label>MyFatoorah API Key</label>
          <input className="admin-input" value={settings.myfatoorah?.apiKey || ''} onChange={e => updateNested('myfatoorah.apiKey', e.target.value)} />
        </div>
        <div className="admin-setting-field">
          <label>Merchant ID</label>
          <input className="admin-input" value={settings.myfatoorah?.merchantId || ''} onChange={e => updateNested('myfatoorah.merchantId', e.target.value)} />
        </div>
        <div className="admin-setting-field">
          <label>البيئة</label>
          <select className="admin-filter-select" value={settings.myfatoorah?.mode || 'test'} onChange={e => updateNested('myfatoorah.mode', e.target.value)}>
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
            <input type="checkbox" checked={settings.zatca?.enabled || false} onChange={e => updateNested('zatca.enabled', e.target.checked)} />
            <span className="admin-toggle-slider"></span>
          </label>
        </div>
        <div className="admin-setting-field">
          <label>اسم الشركة</label>
          <input className="admin-input" value={settings.zatca?.companyName || ''} onChange={e => updateNested('zatca.companyName', e.target.value)} />
        </div>
        <div className="admin-setting-field">
          <label>الرقم الضريبي</label>
          <input className="admin-input" value={settings.zatca?.taxNumber || ''} onChange={e => updateNested('zatca.taxNumber', e.target.value)} />
        </div>
        <div className="admin-setting-field">
          <label>البيئة</label>
          <select className="admin-filter-select" value={settings.zatca?.environment || 'sandbox'} onChange={e => updateNested('zatca.environment', e.target.value)}>
            <option value="sandbox">اختبار (Sandbox)</option>
            <option value="production">إنتاج (Production)</option>
          </select>
        </div>
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
