import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { MERCHANT_TABS } from '../pages/Merchant';
import { AD_CATEGORIES } from '../../features/ads/config';
import AdCard from '../../features/ads/AdCard';
import client, { submitReview } from '../../api/client';

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

export default function Sidebar({ store, product, products, onSelectProduct, onAddToCart, onOpenGallery, onNavigate, onReviewSubmitted }) {
  const closeAndNav = (path) => { onNavigate?.(); navigate(path); };
  const { user, logout } = useAuth();
  const { settings } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [reviewUser, setReviewUser] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [browseAds, setBrowseAds] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const pageKey = location.pathname.split('/')[1];
  const adSearchParams = new URLSearchParams(location.search);
  const adId = adSearchParams.get('ad');

  useEffect(() => {
    if (AD_CATEGORIES[pageKey] && adId) {
      setBrowseLoading(true);
      client.get(`/ads?category=${pageKey}`)
        .then(r => setBrowseAds(r.data.filter(a => a._id !== adId)))
        .catch(() => setBrowseAds([]))
        .finally(() => setBrowseLoading(false));
    }
  }, [adId, pageKey]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewUser.trim() || reviewRating === 0) return;
    setReviewSubmitting(true);
    try {
      await submitReview(store._id, product._id, { user: reviewUser, rating: reviewRating, comment: reviewComment });
      setReviewSuccess('تم إرسال تقييمك بنجاح!');
      setReviewUser('');
      setReviewRating(0);
      setReviewComment('');
      setTimeout(() => setReviewSuccess(''), 3000);
      onReviewSubmitted?.();
    } catch (err) {
      setReviewSuccess(err.response?.data?.error || 'فشل إرسال التقييم');
      setTimeout(() => setReviewSuccess(''), 4000);
    }
    setReviewSubmitting(false);
  };

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
    if (product.galleryImages) {
      product.galleryImages.forEach(i => { if (!mediaSources.includes(i)) mediaSources.push(i); });
    }

    return (
      <>
        <aside className="sidebar">
          <div className="sidebar-scroll">
            <div className="sidebar-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 14 }}>{store.name}</strong>
              <button className="sidebar-mobile-close" onClick={onNavigate}>✕</button>
            </div>
            <div className="sidebar-section">
              <button className="sidebar-action-btn primary" onClick={onAddToCart} style={{ fontSize: 16, padding: '12px 16px' }}>
                🛒 أضف إلى السلة - {product.price} ريال
              </button>
            </div>
            {store.websiteUrl && (
              <div className="sidebar-section">
                <button className="sidebar-action-btn" onClick={() => window.open(store.websiteUrl, '_blank')} style={{ marginTop: 4 }}>
                  🌐 موقع المتجر
                </button>
              </div>
            )}

          {product.videoUrl && (
            <div className="sidebar-section">
              <div className="sidebar-video">
                {product.videoUrl.includes('youtube') || product.videoUrl.includes('youtu.be') ? (
                  <>
                    <iframe key={product._id} src={`https://www.youtube-nocookie.com/embed/${extractYoutubeId(product.videoUrl)}`} allowFullScreen title="product video" />
                    <a href={product.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--accent)' }}>▶️ مشاهدة على YouTube</a>
                  </>
                ) : (
                  <video key={product._id} controls><source src={product.videoUrl} /></video>
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

          {product.description && (
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">الوصف</h3>
              <p className="sidebar-description">{product.description}</p>
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
            <h3 className="sidebar-section-title">آراء العملاء</h3>
            <form className="sidebar-review-form" onSubmit={handleReviewSubmit}>
              <input type="text" className="sidebar-review-input" placeholder="اسمك" value={reviewUser} onChange={e => setReviewUser(e.target.value)} required />
              <div className="sidebar-review-stars">
                <span>التقييم: </span>
                {[1,2,3,4,5].map(n => (
                  <span key={n} className={`star ${n <= reviewRating ? 'active' : ''}`} onClick={() => setReviewRating(n)} style={{ cursor: 'pointer', fontSize: 20 }}>{n <= reviewRating ? '⭐' : '☆'}</span>
                ))}
              </div>
              <textarea className="sidebar-review-textarea" placeholder="اكتب تعليقك (اختياري)" value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} />
              <button type="submit" className="sidebar-action-btn primary" disabled={reviewSubmitting} style={{ marginTop: 8, padding: '8px 12px', fontSize: 14 }}>
                {reviewSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
              </button>
              {reviewSuccess && <div className="sidebar-review-success">{reviewSuccess}</div>}
            </form>
            <div className="sidebar-reviews">
              {product.reviews?.length > 0 ? product.reviews.map((r, i) => (
                <div key={i} className="sidebar-review">
                  <div className="sidebar-review-header">
                    <strong>{r.user}</strong>
                    <span className="sidebar-review-rating">{'⭐'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  {r.comment && <p className="sidebar-review-comment">{r.comment}</p>}
                  <small className="sidebar-review-date">{new Date(r.date).toLocaleDateString('ar-SA')}</small>
                </div>
              )) : <div className="sidebar-empty">لا توجد تقييمات بعد</div>}
            </div>
          </div>

          <div className="sidebar-section">
            <button className="sidebar-action-btn" onClick={() => window.location.href = '/'} style={{ marginTop: 4 }}>
              ↩️ العودة للمتاجر
            </button>
            <button className="sidebar-action-btn" onClick={() => window.location.href = '/'} style={{ marginTop: 4 }}>
              🏠 الرئيسية
            </button>
          </div>
        </div>
      </aside>
      </>
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

  // --- AD PAGES SIDEBAR ---
  if (AD_CATEGORIES[pageKey]) {
    const config = AD_CATEGORIES[pageKey];

    if (adId) {
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
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">تصفح الإعلانات</h3>
              <div className="ad-sidebar-horizontal">
                {browseLoading ? (
                  <div className="sidebar-empty">جاري التحميل...</div>
                ) : browseAds.length > 0 ? browseAds.map(ad => (
                  <div key={ad._id} className="ad-sidebar-card" onClick={() => closeAndNav(`/${pageKey}?ad=${ad._id}`)}>
                    <AdCard ad={ad} onClick={() => {}} />
                  </div>
                )) : <div className="sidebar-empty">لا توجد إعلانات أخرى</div>}
              </div>
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

          <div className="sidebar-section sidebar-education">
            <h3 className="sidebar-section-title">قوة الإعلانات</h3>
            <p>الإعلانات هي المفتاح الذهبي لنجاح منتجك في السوق الرقمي. من خلال الإعلان، تصل إلى جمهور أوسع، تبني علامة تجارية قوية، وتحقق مبيعات مضاعفة.</p>
            <ul>
              <li>📈 تزيد الوصول إلى العملاء المحتملين بنسبة تصل إلى 300%</li>
              <li>🎯 تستهدف الفئة المناسبة التي تحتاج منتجك</li>
              <li>💰 عائد استثماري يبدأ من اليوم الأول</li>
              <li>🏆 تبني ثقة وولاء للعلامة التجارية</li>
            </ul>
          </div>

          <div className="sidebar-section">
            <button className="sidebar-action-btn primary" onClick={() => closeAndNav(`/${pageKey}`)}>
              {config.icon} {config.label}
            </button>
            <button className="sidebar-action-btn" onClick={() => closeAndNav('/')}>
              🏠 الرئيسية
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

  // --- ADMIN PAGE SIDEBAR ---
  const isSuperAdmin = user?.role === 'admin';
  const perms = user?.permissions || {};
  const TAB_PERM_MAP_S = { stats: 'dashboard', tabs: 'tabs', stores: 'stores', ads: 'ads', users: 'users', moderation: 'moderation', settings: 'settings', trash: 'trash', subscriptions: 'subscriptions', roles: 'users' };
  const canAccessAdminTab = (tabId) => {
    if (isSuperAdmin) return true;
    const group = TAB_PERM_MAP_S[tabId];
    if (!group) return false;
    if (tabId === 'roles') return perms.users?.edit_roles === true;
    const g = perms[group];
    return g && Object.values(g).some(v => v === true);
  };
  if (base === '/admin' && (isSuperAdmin || Object.values(perms).some(g => g && Object.values(g).some(v => v === true)))) {
    const adminLinks = PAGE_LINKS['/admin'].filter(l => canAccessAdminTab(l.path.split('tab=')[1]?.split('&')[0]));
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
