import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import client from '../../api/client';
import { AD_CATEGORIES } from './config';
import AdCard from './AdCard';
import AdDetail from './AdDetail';
import AdForm from './AdForm';

export default function AdBoardPage() {
  const { tabId: category } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [ads, setAds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const config = AD_CATEGORIES[category];
  const adId = searchParams.get('ad');
  const selectedAd = adId ? ads.find(a => a._id === adId) || null : null;

  useEffect(() => {
    if (!config) { navigate('/'); return; }
    setLoading(true);
    client.get(`/ads?category=${category}`)
      .then(r => setAds(r.data))
      .catch(() => setAds([]))
      .finally(() => setLoading(false));
  }, [category, navigate]);

  if (!config) return null;

  const otherAds = ads.filter(a => a._id !== adId);

  const selectAd = (ad) => {
    setSearchParams(ad ? { ad: ad._id } : {}, { replace: true });
  };

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
        <div className="ad-board-main">
          {selectedAd ? (
            <AdDetail ad={selectedAd} onBack={() => selectAd(null)} />
          ) : loading ? (
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
                <AdCard key={ad._id} ad={ad} onClick={selectAd} />
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
