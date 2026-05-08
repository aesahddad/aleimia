import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

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
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h2>{store.name}</h2>
              <span className="sidebar-badge">{store.category || 'متجر'}</span>
            </div>
            {store.branding?.logo && (
              <div className="sidebar-logo-wrap">
                <img src={store.branding.logo} alt={store.name} className="sidebar-logo" />
              </div>
            )}
            {store.description && (
              <p className="sidebar-desc">{store.description}</p>
            )}
          </div>

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

          <div className="sidebar-section">
            <h3 className="sidebar-section-title">المنتجات</h3>
            <div className="sidebar-products">
              {products.map(p => (
                <div key={p._id} className={`sidebar-product ${p._id === product._id ? 'active' : ''}`} onClick={() => onSelectProduct(p)}>
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} />}
                  <div className="sidebar-product-info">
                    <div className="sidebar-product-name">{p.name}</div>
                    {p.price && <div className="sidebar-product-price">{p.price} ر.س</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-section-title">التقييمات</h3>
            <div className="sidebar-reviews">
              {product.reviews?.length > 0 ? product.reviews.map((r, i) => (
                <div key={i} className="review-item">
                  <div className="review-header">
                    <span className="review-user">{r.user}</span>
                    <span className="review-stars">{'★'.repeat(r.rating || 5)}</span>
                  </div>
                  <p className="review-text">{r.comment}</p>
                </div>
              )) : <div className="sidebar-empty">لا توجد تقييمات بعد</div>}
            </div>
          </div>

          <div className="sidebar-section">
            <button className="sidebar-add-btn" onClick={onAddToCart}>
              🛒 إضافة للسلة — {product.price || 0} ر.س
            </button>
          </div>

          <div className="sidebar-section">
            <button className="sidebar-whatsapp-btn" onClick={() => window.open(`https://wa.me/${store.financial?.whatsapp || ''}`, '_blank')}>
              💬 تواصل مع المتجر
            </button>
          </div>
        </div>
      </aside>
    );
  }

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

        {(() => {
          const base = '/' + location.pathname.split('/')[1];
          const videoUrl = base === '/plans' ? settings?.promoVideoPlansUrl : settings?.promoVideoUrl;
          const label = base === '/plans' ? 'فيديو الاشتراكات' : 'فيديو ترويجي';
          return (
            <div className="sidebar-section sidebar-promo-video">
              {videoUrl ? (
                videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? (
                  <iframe src={`https://www.youtube-nocookie.com/embed/${extractYoutubeId(videoUrl)}`} allowFullScreen title={label} />
                ) : (
                  <video controls playsInline><source src={videoUrl} /></video>
                )
              ) : (
                <div className="sidebar-promo-placeholder">
                  <span>📹</span>
                  <p>مساحة الفيديو الدعائي<br /><small>يمكنك التحكم به من لوحة الإدارة</small></p>
                </div>
              )}
            </div>
          );
        })()}

        {location.pathname !== '/plans' && (
          <div className="sidebar-section">
            <button className="sidebar-action-btn primary" onClick={() => closeAndNav('/plans')}>
              💎 خطط الاشتراك
            </button>
          </div>
        )}

        {(() => {
          const base = '/' + location.pathname.split('/')[1];
          let links = PAGE_LINKS[base];
          if (!links) {
            if (base === '/merchant')
              links = [{ label: '🏪 لوحة التاجر', path: '/merchant' }];
            else
              links = PAGE_LINKS['/'];
          }
          const currentQuery = location.search.replace('?', '');
          links = links.filter(l => {
            const linkBase = l.path.split('?')[0];
            const linkQuery = l.path.split('?')[1] || '';
            if (linkBase !== location.pathname) return true;
            if (linkQuery === currentQuery) return false;
            if (!linkQuery && !currentQuery) return false;
            return true;
          });
          if (links.length === 0) return null;
          return (
            <div className="sidebar-section">
              {links.map(link => (
                <button key={link.path + link.label} className="sidebar-action-btn" onClick={() => closeAndNav(link.path)} style={{ marginTop: 4 }}>
                  {link.label}
                </button>
              ))}
            </div>
          );
        })()}

        {(() => {
          const base = '/' + location.pathname.split('/')[1];
          const info = PAGE_INFO[base];
          if (!info) return null;
          return (
            <div className="sidebar-section sidebar-page-info">
              <h3 className="sidebar-section-title">{info.title}</h3>
              {info.items.map((item, i) => (
                <div key={i} className="sidebar-info-item">
                  <span className="sidebar-info-icon">{item.icon}</span>
                  <span className="sidebar-info-text">{item.text}</span>
                </div>
              ))}
            </div>
          );
        })()}

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

function extractYoutubeId(url) {
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0];
  if (url.includes('shorts/')) return url.split('shorts/')[1]?.split('?')[0];
  if (url.includes('watch?v=')) return url.split('watch?v=')[1]?.split('&')[0];
  if (url.includes('embed/')) return url.split('embed/')[1]?.split('?')[0];
  return '';
}
