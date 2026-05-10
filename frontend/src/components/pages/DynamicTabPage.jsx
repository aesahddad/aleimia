import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { fetchStores } from '../../api/client';

export default function DynamicTabPage() {
  const params = useParams();
  const location = useLocation();
  const { tabs } = useApp();
  const tabId = params.tabId || location.pathname.replace('/', '');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const tab = tabs.find(t => t.id === tabId);

  useEffect(() => {
    setLoading(true);
    fetchStores({ limit: 30, category: tab?.label || '' })
      .then(setStores)
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, [tabId, tab]);

  return (
    <div className="dynamic-page">
      <div className="dynamic-page-header">
        <h1>{tab?.label || tabId}</h1>
        {tab?.subtitle && <p className="dynamic-page-subtitle">{tab.subtitle}</p>}
      </div>

      {loading ? (
        <div className="home-loading">جاري التحميل...</div>
      ) : stores.length === 0 ? (
        <div className="dynamic-empty">
          <p>لا توجد متاجر في هذا التصنيف حالياً</p>
        </div>
      ) : (
        <div className="stores-grid">
          {stores.map(store => (
            <div key={store._id} className="store-card" onClick={() => window.location.href = `/store/${store._id}`}>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
