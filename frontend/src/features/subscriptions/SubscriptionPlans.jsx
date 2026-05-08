import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';

export default function SubscriptionPlans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    client.get('/subscriptions/plans')
      .then(r => setPlans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (plan) => {
    if (!user) {
      navigate('/auth?mode=register');
      return;
    }
    setSelectedPlan(plan);
    setShowConfirm(true);
  };

  const confirmSubscribe = async () => {
    if (!selectedPlan) return;
    try {
      await client.post('/subscriptions', { planId: selectedPlan._id });
      alert('✅ تم الاشتراك بنجاح! سيتم تفعيل باقتك قريباً.');
      setShowConfirm(false);
    } catch (e) {
      alert('❌ فشل الاشتراك: ' + (e.response?.data?.error || e.message));
    }
  };

  if (loading) return <div className="page-loading"><div className="home-loading">جاري التحميل...</div></div>;

  return (
    <div className="subscriptions-page">
      <div className="subscriptions-header">
        <h1>خطط الاشتراك</h1>
        <p>اختر الباقة المناسبة لمتجرك واستمتع بالمميزات الحصرية</p>
      </div>

      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan._id} className={`plan-card ${plan.highlighted ? 'highlighted' : ''} ${plan.recommended ? 'recommended' : ''}`}>
            {plan.badge && <div className="plan-badge">{plan.badge}</div>}

            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="plan-amount">{plan.price}</span>
                <span className="plan-currency">ريال</span>
                <span className="plan-duration">/{plan.duration === 'yearly' ? 'سنوياً' : 'شهرياً'}</span>
              </div>
              {plan.originalPrice > plan.price && (
                <div className="plan-original-price">
                  <del>{plan.originalPrice} ريال</del>
                  <span className="plan-discount-badge">وفر {plan.discount}</span>
                </div>
              )}
            </div>

            <div className="plan-features">
              {plan.features.map((f, i) => (
                <div key={i} className="plan-feature">✓ {f}</div>
              ))}
            </div>

            <button className="plan-select-btn" onClick={() => handleSelect(plan)}>
              {plan.price === 0 ? 'ابدأ مجاناً' : 'اشترك الآن'}
            </button>
          </div>
        ))}
      </div>

      {showConfirm && selectedPlan && (
        <div className="subscription-confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="subscription-confirm" onClick={e => e.stopPropagation()}>
            <h3>تأكيد الاشتراك</h3>
            <p>الباقة: <strong>{selectedPlan.name}</strong></p>
            <p>السعر: <strong>{selectedPlan.price} ريال</strong></p>
            <p>المدة: <strong>{selectedPlan.duration === 'yearly' ? 'سنوية' : 'شهرية'}</strong></p>
            <div className="subscription-confirm-btns">
              <button className="plan-select-btn" onClick={confirmSubscribe}>✓ تأكيد</button>
              <button className="plan-select-btn cancel" onClick={() => setShowConfirm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
