import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import { openWhatsApp } from '../../utils/whatsapp';

export default function SubscriptionPlans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activationMethod, setActivationMethod] = useState(null); // 'online' or 'whatsapp'
  const [adminWhatsapp, setAdminWhatsapp] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    client.get('/subscriptions/plans')
      .then(r => setPlans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    client.get('/status')
      .then(r => {
        setAdminWhatsapp(r.data.adminWhatsapp || '');
        setAdminEmail(r.data.adminEmail || '');
      })
      .catch(() => {});
  }, []);

  const handleSelect = (plan) => {
    if (!user) {
      navigate('/auth?mode=register');
      return;
    }
    setSelectedPlan(plan);
    setActivationMethod(null);
    setShowModal(true);
  };

  const handleWhatsApp = () => {
    if (adminWhatsapp) {
      const userName = user?.username || user?.email || 'عميل';
      const msg = `مرحباً، أنا ${userName}، أرغب في الاشتراك في باقة "${selectedPlan.name}" لمنصة العينية.\nالسعر: ${selectedPlan.price === 0 ? 'مجاني' : `${selectedPlan.price} ريال`}\nالمدة: ${selectedPlan.duration === 'yearly' ? 'سنوية' : 'شهرية'}\nالرجاء التواصل معي للتفعيل.`;
      openWhatsApp(adminWhatsapp, msg);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPlan || !activationMethod) return;
    setActivating(true);
    try {
      if (activationMethod === 'online') {
        // For free plans, auto-activate and redirect
        if (selectedPlan.price === 0) {
          await client.post('/subscriptions', { planId: selectedPlan._id });
          setShowModal(false);
          alert('✅ تم تفعيل الباقة المجانية بنجاح! يمكنك الآن إنشاء متجرك.');
          navigate('/merchant?tab=stores');
          return;
        }
        // For paid plans: redirect to merchant to create store first, then payment flow
        setShowModal(false);
        navigate(`/merchant?tab=stores&planId=${selectedPlan._id}&mode=paid`);
        return;
      }

      if (activationMethod === 'whatsapp') {
        // Create subscription as pending, show WhatsApp info
        await client.post('/subscriptions', { planId: selectedPlan._id });
        setShowModal(false);
        handleWhatsApp();
        navigate('/merchant?tab=stores');
        return;
      }
    } catch (e) {
      alert('❌ ' + (e.response?.data?.error || e.message));
    } finally {
      setActivating(false);
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
              {plan.contactOnly ? 'تواصل مع الإدارة' : plan.price === 0 ? 'ابدأ مجاناً' : 'اشترك الآن'}
            </button>
          </div>
        ))}
      </div>

      {showModal && selectedPlan && (
        <div className="subscription-confirm-overlay" onClick={() => setShowModal(false)}>
          <div className="subscription-confirm" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3>تأكيد الاشتراك</h3>
            <p>الباقة: <strong>{selectedPlan.name}</strong></p>
            <p>السعر: <strong>{selectedPlan.price === 0 ? 'مجاني' : `${selectedPlan.price} ريال`}</strong></p>
            <p>المدة: <strong>{selectedPlan.duration === 'yearly' ? 'سنوية' : 'شهرية'}</strong></p>

            {selectedPlan.contactOnly ? (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-light)' }}>هذه الباقة للشركات والبرندات، للاشتراك يرجى التواصل مع الإدارة مباشرة</p>
                {adminWhatsapp ? (
                  <button className="plan-select-btn" onClick={handleWhatsApp} style={{ marginTop: 12, background: '#25D366', border: 'none' }}>
                    📱 تواصل عبر واتساب
                  </button>
                ) : null}
                {adminEmail ? (
                  <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 8 }}>أو عبر البريد: <strong dir="ltr">{adminEmail}</strong></p>
                ) : null}
                {!adminWhatsapp && !adminEmail ? (
                  <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>سيتم توفير معلومات التواصل قريباً</p>
                ) : null}
              </div>
            ) : selectedPlan.price === 0 ? (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-light)' }}>الباقة مجانية - سيتم التفعيل تلقائياً بعد إنشاء المتجر</p>
                <div className="subscription-confirm-btns" style={{ marginTop: 12 }}>
                  <button className="plan-select-btn" onClick={() => { setActivationMethod('online'); handleConfirm(); }} disabled={activating}>
                    {activating ? 'جاري...' : '✅ تأكيد وتفعيل'}
                  </button>
                  <button className="plan-select-btn cancel" onClick={() => setShowModal(false)}>إلغاء</button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>اختر طريقة التفعيل</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    className={`plan-select-btn ${activationMethod === 'online' ? '' : 'cancel'}`}
                    onClick={() => setActivationMethod('online')}
                    style={{ justifyContent: 'flex-start', opacity: activationMethod === 'online' ? 1 : 0.6 }}
                  >
                    💳 دفع إلكتروني - تفعيل فوري
                  </button>
                  <button
                    className={`plan-select-btn ${activationMethod === 'whatsapp' ? '' : 'cancel'}`}
                    onClick={() => setActivationMethod('whatsapp')}
                    style={{ justifyContent: 'flex-start', opacity: activationMethod === 'whatsapp' ? 1 : 0.6 }}
                  >
                    📱 تواصل مع الإدارة عبر واتساب
                  </button>
                </div>

                {activationMethod === 'online' && (
                  <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6 }}>سيتم توجيهك إلى بوابة الدفع. بعد الدفع، سيتم تفعيل المتجر فوراً.</p>
                )}
                {activationMethod === 'whatsapp' && (
                  <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6 }}>
                    سيتم إنشاء اشتراك مؤقت والتواصل معك عبر {adminWhatsapp ? 'واتساب' : ''}{adminWhatsapp && adminEmail ? ' أو ' : ''}{adminEmail ? 'البريد' : ''} لإتمام الدفع والتفعيل من قبل الإدارة.
                  </p>
                )}

                {activationMethod && (
                  <div className="subscription-confirm-btns" style={{ marginTop: 12 }}>
                    <button className="plan-select-btn" onClick={handleConfirm} disabled={activating}>
                      {activating ? 'جاري...' : '✅ تأكيد'}
                    </button>
                    <button className="plan-select-btn cancel" onClick={() => setShowModal(false)}>إلغاء</button>
                  </div>
                )}
              </div>
            )}

            <button className="plan-select-btn cancel" onClick={() => setShowModal(false)} style={{ marginTop: 16, width: '100%' }}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
