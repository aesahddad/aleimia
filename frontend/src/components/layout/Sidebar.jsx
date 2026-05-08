import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { MERCHANT_TABS } from '../pages/Merchant';

const PAGE_LINKS = {
  '/': [
    { label: '🏠 الرئيسية', path: '/' },
    { label: '🏪 المتاجر', path: '/' },
  ],
  '/cart': [
    { label: '🛒 سلة المشتريات', path: '/cart' },
  ],
  '/auth': [
    { label: '🔐 تسجيل الدخول', path: '/auth?mode=login' },
    { label: '🚀 مستخدم جديد', path: '/auth?mode=register' },
  ],
  '/plans': [
    { label: '💎 خطط الاشتراك', path: '/plans' },
  ],
  '/admin': [
    { label: '📊 الإحصائيات', path: '/admin?tab=stats' },
    { label: '📑 التبويبات', path: '/admin?tab=tabs' },
    { label: '🏪 المتاجر', path: '/admin?tab=stores' },
    { label: '📢 الإعلانات', path: '/admin?tab=ads' },
    { label: '👥 الأعضاء', path: '/admin?tab=users' },
    { label: '🛡️ الرقابة', path: '/admin?tab=moderation' },
    { label: '⚙️ الإعدادات', path: '/admin?tab=settings' },
    { label: '🗑️ المحذوفات', path: '/admin?tab=trash' },
    { label: '💎 الاشتراكات', path: '/admin?tab=subscriptions' },
    { label: '🔑 الصلاحيات', path: '/admin?tab=roles' },
  ],
  '/merchant': [
    { label: '🏪 لوحة التاجر', path: '/merchant' },
  ],
};

const PAGE_INFO = {
  '/plans': {
    title: 'لماذا العينية؟',
    items: [
      { icon: '🌐', text: 'انتقل إلى عالم Web3 — متاجرك لا تقتصر على الواقع الافتراضي بل تمتد إلى البعد الثالث' },
      { icon: '🛒', text: 'تجربة تسوق تفاعلية ثلاثية الأبعاد تضع منتجاتك في متناول الزوار من كل مكان' },
      { icon: '📈', text: 'لوحات تحكم متقدمة مع إحصائيات دقيقة لنمو متجرك' },
      { icon: '🔒', text: 'تقنية البلوكشين لتوثيق الملكية وحماية المتاجر الرقمية' },
      { icon: '🤝', text: 'مجتمع تجار ومبدعين يدعم بعضه — أنت لست وحدك' },
    ]
  }
};

export default function Sidebar({ store, product, products, onSelectProduct, onAddToCart, onOpenGallery, onNavigate }) {
  const closeAndNav = (path) => { onNavigate?.(); navigate(path); };
  const { user, logout } = useAuth();
  const { settings } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  if (store && product) {
    const mediaSources = [];
    if (product.imageUrl) mediaSources.push(product.imageUrl);
    if (product.catalogImages) {
      if (typeof product.catalogImages === 'string') {
        try { JSON.parse(product.catalogImages).forEach(i => mediaSources.push(i)); }
        catch { mediaSources.push(product.catalogImages); }
      } else if (Array.isArray(product.catalogImages)) {
        product.catalogImages.forEach(i => mediaSources.push(i));
      }
    }

    return (
      <aside className="sidebar">
        <div className="sidebar-scroll">
          {product.videoUrl && (
            <div className="sidebar-section">
              <div className="sidebar-video">
                {product.videoUrl.includes('youtube') || product.videoUrl.includes('youtu.be') ? (
                  <iframe src={`https://www.youtube-nocookie.com/embed/${extractYoutubeId(product.videoUrl)}`} allowFullScreen title="product video" />
                ) : (
                  <video controls><source src={product.videoUrl} /></video>
                )}
              </div>
            </div>
          )}

          {mediaSources.length > 0 && (
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">معرض الصور</h3>
              <div className="sidebar-gallery">
                {mediaSources.map((src, i) => (
                  <button key={i} className="sidebar-gallery-thumb" onClick={() => onOpenGallery && onOpenGallery(i)}>
                    <img src={src} alt={`${product.name} ${i + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="sidebar-section">
            <h3 className="sidebar-section-title">المواصفات</h3>
            <div className="sidebar-specs">
              {product.specs?.length > 0 ? product.specs.map((s, i) => (
                <div key={i} className="spec-row">
                  <span className="spec-label">{s.label}</span>
                  <span className="spec-value">{s.value}</span>
                </div>
              )) : <div className="sidebar-empty">لا توجد مواصفات</div>}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const base = '/' + location.pathname.split('/')[1];

  // --- HOME PAGE SIDEBAR ---
  if (base === '/') {
    return (
      <aside className="sidebar">
        <div className="sidebar-scroll">
          <div className="sidebar-section sidebar-hero">
            <div className="sidebar-logo-wrap">
              <img src="/logo.png" alt="العينية" className="sidebar-logo" />
            </div>
            <div className="sidebar-slogan">
              <h2>فهرس العينية</h2>
              <p>نعطي لحلمك بعداً آخر</p>
            </div>
          </div>

          <div className="sidebar-section sidebar-promo-video">
            {settings?.promoVideoUrl ? (
              settings.promoVideoUrl.includes('youtube') || settings.promoVideoUrl.includes('youtu.be') ? (
                <iframe src={`https://www.youtube-nocookie.com/embed/${extractYoutubeId(settings.promoVideoUrl)}`} allowFullScreen title="فيديو ترويجي" />
              ) : (
                <video controls playsInline><source src={settings.promoVideoUrl} /></video>
              )
            ) : (
              <div className="sidebar-promo-placeholder">
                <span>📹</span>
                <p>مساحة الفيديو الدعائي<br /><small>يمكنك التحكم به من لوحة الإدارة</small></p>
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <button className="sidebar-action-btn primary" onClick={() => closeAndNav('/plans')}>
              💎 خطط الاشتراك
            </button>
          </div>

          {user ? (
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">مرحباً، {user.username || user.email}</h3>
              <button className="sidebar-action-btn" onClick={() => closeAndNav('/')}>
                🏠 الرئيسية
              </button>
              <button className="sidebar-action-btn" onClick={() => closeAndNav('/cart')}>
                🛒 السلة
              </button>
              {(user.role === 'admin' || user.role === 'merchant') && (
                <button className="sidebar-action-btn" onClick={() => closeAndNav('/merchant')}>
                  🏪 لوحة التاجر
                </button>
              )}
              {user.role === 'admin' && (
                <button className="sidebar-action-btn" onClick={() => closeAndNav('/admin')}>
                  🛡️ لوحة الإدارة
                </button>
              )}
              <button className="sidebar-action-btn logout" onClick={logout}>
                🚪 تسجيل الخروج
              </button>
            </div>
          ) : (
            <div className="sidebar-section">
              <button className="sidebar-action-btn primary" onClick={() => closeAndNav('/auth?mode=login')}>
                🔐 تسجيل الدخول
              </button>
              <button className="sidebar-action-btn" onClick={() => closeAndNav('/auth?mode=register')}>
                🚀 افتح متجرك الآن
              </button>
            </div>
          )}
        </div>
      </aside>
    );
  }

  // --- PLANS PAGE SIDEBAR ---
  if (base === '/plans') {
    const info = PAGE_INFO['/plans'];
    return (
      <aside className="sidebar">
        <div className="sidebar-scroll">
          <div className="sidebar-section sidebar-hero">
            <div className="sidebar-logo-wrap">
              <img src="/logo.png" alt="العينية" className="sidebar-logo" />
            </div>
            <div className="sidebar-slogan">
              <h2>فهرس العينية</h2>
              <p>نعطي لحلمك بعداً آخر</p>
            </div>
          </div>

          <div className="sidebar-section sidebar-promo-video">
            {settings?.promoVideoPlansUrl ? (
              settings.promoVideoPlansUrl.includes('youtube') || settings.promoVideoPlansUrl.includes('youtu.be') ? (
                <iframe src={`https://www.youtube-nocookie.com/embed/${extractYoutubeId(settings.promoVideoPlansUrl)}`} allowFullScreen title="فيديو الاشتراكات" />
              ) : (
                <video controls playsInline><source src={settings.promoVideoPlansUrl} /></video>
              )
            ) : (
              <div className="sidebar-promo-placeholder">
                <span>📹</span>
                <p>مساحة الفيديو الدعائي<br /><small>يمكنك التحكم به من لوحة الإدارة</small></p>
              </div>
            )}
          </div>

          {info && (
            <div className="sidebar-section sidebar-page-info">
              <h3 className="sidebar-section-title">{info.title}</h3>
              {info.items.map((item, i) => (
                <div key={i} className="sidebar-info-item">
                  <span className="sidebar-info-icon">{item.icon}</span>
                  <span className="sidebar-info-text">{item.text}</span>
                </div>
              ))}
            </div>
          )}

          {user ? (
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">مرحباً، {user.username || user.email}</h3>
              <button className="sidebar-action-btn" onClick={() => closeAndNav('/')}>
                🏠 الرئيسية
              </button>
              <button className="sidebar-action-btn" onClick={() => closeAndNav('/cart')}>
                🛒 السلة
              </button>
              {(user.role === 'admin' || user.role === 'merchant') && (
                <button className="sidebar-action-btn" onClick={() => closeAndNav('/merchant')}>
                  🏪 لوحة التاجر
                </button>
              )}
              {user.role === 'admin' && (
                <button className="sidebar-action-btn" onClick={() => closeAndNav('/admin')}>
                  🛡️ لوحة الإدارة
                </button>
              )}
              <button className="sidebar-action-btn logout" onClick={logout}>
                🚪 تسجيل الخروج
              </button>
            </div>
          ) : (
            <div className="sidebar-section">
              <button className="sidebar-action-btn primary" onClick={() => closeAndNav('/auth?mode=login')}>
                🔐 تسجيل الدخول
              </button>
              <button className="sidebar-action-btn" onClick={() => closeAndNav('/auth?mode=register')}>
                🚀 افتح متجرك الآن
              </button>
            </div>
          )}
        </div>
      </aside>
    );
  }

  // --- ADMIN PAGE SIDEBAR ---
  if (base === '/admin' && user?.role === 'admin') {
    const adminLinks = PAGE_LINKS['/admin'];
    const currentQuery = location.search.replace('?', '');
    return (
      <aside className="sidebar">
        <div className="sidebar-scroll">
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">لوحة الإدارة</h3>
            {adminLinks.map(link => {
              const linkQuery = link.path.split('?')[1] || '';
              if (linkQuery === currentQuery) return null;
              return (
                <button key={link.path} className="sidebar-action-btn" onClick={() => closeAndNav(link.path)} style={{ marginTop: 4 }}>
                  {link.label}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    );
  }

  // --- MERCHANT PAGE SIDEBAR ---
  if (base === '/merchant') {
    const currentQuery = location.search.replace('?', '');
    return (
      <aside className="sidebar">
        <div className="sidebar-scroll">
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">لوحة التاجر</h3>
            {MERCHANT_TABS.map(t => {
              const linkQuery = `tab=${t.id}`;
              if (linkQuery === currentQuery) return null;
              return (
                <button key={t.id} className="sidebar-action-btn" onClick={() => closeAndNav(`/merchant?tab=${t.id}`)} style={{ marginTop: 4 }}>
                  {t.icon} {t.label}
                </button>
              );
            })}
            <button className="sidebar-action-btn logout" onClick={logout} style={{ marginTop: 8 }}>
              🚪 تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // --- DEFAULT SIDEBAR (cart, auth, other pages) ---
  const defaultLinks = PAGE_LINKS[base] || [];
  return (
    <aside className="sidebar">
      <div className="sidebar-scroll">
        <div className="sidebar-section sidebar-hero">
          <div className="sidebar-slogan">
            <h2>فهرس العينية</h2>
            <p>نعطي لحلمك بعداً آخر</p>
          </div>
        </div>

        {defaultLinks.length > 0 && (
          <div className="sidebar-section">
            {defaultLinks.map(link => (
              <button key={link.path} className="sidebar-action-btn" onClick={() => closeAndNav(link.path)} style={{ marginTop: 4 }}>
                {link.label}
              </button>
            ))}
          </div>
        )}

        {user ? (
          <div className="sidebar-section">
            <button className="sidebar-action-btn" onClick={() => closeAndNav('/')}>
              🏠 الرئيسية
            </button>
            <button className="sidebar-action-btn logout" onClick={logout}>
              🚪 تسجيل الخروج
            </button>
          </div>
        ) : (
          <div className="sidebar-section">
            <button className="sidebar-action-btn primary" onClick={() => closeAndNav('/auth?mode=login')}>
              🔐 تسجيل الدخول
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function extractYoutubeId(url) {
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0];
  if (url.includes('shorts/')) return url.split('shorts/')[1]?.split('?')[0];
  if (url.includes('watch?v=')) return url.split('watch?v=')[1]?.split('&')[0];
  if (url.includes('embed/')) return url.split('embed/')[1]?.split('?')[0];
  return '';
}
