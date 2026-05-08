import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { AD_CATEGORIES } from './config';
import AdCard from './AdCard';
import AdDetail from './AdDetail';
import AdForm from './AdForm';

export default function AdBoardPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const config = AD_CATEGORIES[category];

  useEffect(() => {
    if (!config) { navigate('/'); return; }
    setLoading(true);
    client.get(`/ads?category=${category}`)
      .then(r => setAds(r.data))
      .catch(() => setAds([]))
      .finally(() => setLoading(false));
  }, [category]);

  if (!config) return null;

  if (selectedAd) {
    return (
      <div className="page-full">
        <AdDetail ad={selectedAd} onBack={() => setSelectedAd(null)} />
      </div>
    );
  }

  return (
    <div className="ad-board">
      <div className="ad-board-header">
        <div className="ad-board-header-text">
          <h1>{config.icon} {config.label}</h1>
          <p>{config.subtitle}</p>
        </div>
        <button className="ad-board-create-btn" onClick={() => setShowForm(true)}>
          + إعلان جديد
        </button>
      </div>

      <div className="ad-board-layout">
        <div className="ad-board-sidebar">
          <div className="ad-board-benefits">
            <h3>مميزات {config.label}</h3>
            {config.benefits.map((b, i) => (
              <div key={i} className="benefit-item">✓ {b}</div>
            ))}
          </div>
          <button className="ad-board-create-btn secondary" onClick={() => setShowForm(true)}>
            📝 نشر إعلان ({config.label})
          </button>
        </div>

        <div className="ad-board-main">
          {loading ? (
            <div className="home-loading">جاري التحميل...</div>
          ) : ads.length === 0 ? (
            <div className="home-empty">
              <p>لا توجد إعلانات في {config.label} حالياً</p>
              <button className="ad-board-create-btn" onClick={() => setShowForm(true)}>
                كن أول من ينشر
              </button>
            </div>
          ) : (
            <div className="ad-grid">
              {ads.map(ad => (
                <AdCard key={ad._id} ad={ad} onClick={setSelectedAd} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <AdForm
          category={category}
          onClose={() => setShowForm(false)}
          onCreated={(ad) => setAds(prev => [ad, ...prev])}
        />
      )}
    </div>
  );
}
