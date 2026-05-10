import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStores } from '../../api/client';
import { useApp } from '../../contexts/AppContext';
import CATEGORIES from '../../config/categories';

export default function Home() {
  const navigate = useNavigate();
  const { settings } = useApp();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [showWebsite, setShowWebsite] = useState(false);
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchStores({ limit: 50, category: category || undefined })
      .then(setStores)
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-hero-bg">
          <div className="home-hero-content">
            <div className="home-hero-tag">جديد اليوم</div>
            <h1>اكتشف أبعاداً جديدة للتسوق الرقمي</h1>
            <div className="home-hero-filter">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="home-filter-select">
                <option value="">جميع التصنيفات</option>
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.label}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="home-toolbar">
        <button className={`home-toolbar-btn ${!showAbout && !showWebsite ? 'active' : ''}`} onClick={() => { setShowAbout(false); setShowWebsite(false); }}>
          🏪 المتاجر
        </button>
        <button className={`home-toolbar-btn ${showAbout ? 'active' : ''}`} onClick={() => { setShowAbout(true); setShowWebsite(false); }}>
          ℹ️ من نحن
        </button>
        {settings?.websiteUrl && (
          <button className={`home-toolbar-btn ${showWebsite ? 'active' : ''}`} onClick={() => { setShowWebsite(true); setShowAbout(false); }}>
            🌐 موقعنا
          </button>
        )}
      </div>

      {showWebsite && settings?.websiteUrl ? (
        <div className="home-website-container">
          <iframe src={settings.websiteUrl} title="موقع المنصة" className="home-website-iframe" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
        </div>
      ) : showAbout ? (
        <div className="home-about">
          <div className="home-about-card">
            <h2>منصة العينية</h2>
            <p>منصة سعودية متخصصة في عرض المنتجات بتقنية الواقع المعزز والثلاثي الأبعاد. نهدف إلى تقديم تجربة تسوق فريدة تجمع بين التكنولوجيا والجمال.</p>
          </div>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="home-loading">جاري التحميل...</div>
          ) : stores.length === 0 ? (
            <div className="home-empty">
              <p>لا توجد متاجر حالياً</p>
            </div>
          ) : (
            <div className="stores-grid">
              {stores.map(store => (
                <div key={store._id} className="store-card" onClick={() => navigate(`/store/${store._id}`)}>
                  <div className="store-card-bg">
                    <img src={store.imageUrl || ''} alt={store.name} />
                    <div className="store-card-overlay" />
                  </div>
                  <div className="store-card-body">
                    <span className="store-card-badge">{store.category || 'متجر'}</span>
                    <h3>{store.name}</h3>
                    {store.description && <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{store.description}</p>}
                    <div className="store-card-meta">
                      <span>★ 4.9</span>
                      <span>•</span>
                      <span>1.2k تقييم</span>
                    </div>
                  </div>
                  <div className="store-card-arrow">←</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
