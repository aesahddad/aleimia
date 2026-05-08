import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStores } from '../../api/client';

export default function Home() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
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
                {['الأزياء', 'التقنية', 'الأغذية', 'الجمال', 'الرياضة', 'الكتب', 'الأثاث', 'السيارات', 'الصحة', 'الترفيه'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="home-toolbar">
        <button className={`home-toolbar-btn ${!showAbout ? 'active' : ''}`} onClick={() => setShowAbout(false)}>
          🏪 المتاجر
        </button>
        <button className={`home-toolbar-btn ${showAbout ? 'active' : ''}`} onClick={() => setShowAbout(true)}>
          ℹ️ من نحن
        </button>
      </div>

      {showAbout ? (
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
