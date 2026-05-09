import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, setAuth, user } = useAuth();

  const [mode, setMode] = useState(searchParams.get('mode') || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerAsMerchant, setRegisterAsMerchant] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetStep, setResetStep] = useState('request');
  const [resetToken, setResetToken] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const socialToken = searchParams.get('token');
  if (socialToken) {
    setAuth(socialToken, searchParams.get('refreshToken')).then(() => navigate('/'));
    return <div className="auth-page"><div className="auth-card"><p style={{ textAlign: 'center' }}>جاري تسجيل الدخول...</p></div></div>;
  }

  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        navigate('/');
      } else {
        const role = registerAsMerchant ? 'merchant' : 'customer';
        await client.post('/auth/register', { username: name, email, password, role });
        await login(email, password);
        navigate(role === 'merchant' ? '/merchant' : '/');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const requestReset = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/auth/forgot-password', { email });
      setResetToken(data.resetToken);
      setResetMsg(data.message);
      setResetStep('done');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async () => {
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    setError('');
    setLoading(true);
    try {
      await client.post('/auth/reset-password', { token: resetToken, password });
      setResetMsg('✅ تم إعادة تعيين كلمة المرور بنجاح');
      setResetStep('complete');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (resetMode) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>إعادة تعيين كلمة المرور</h1>
          {error && <div className="auth-error">{error}</div>}
          {resetMsg && <div className="auth-success">{resetMsg}</div>}

          {resetStep === 'request' && (
            <form onSubmit={e => { e.preventDefault(); requestReset(); }}>
              <div className="auth-field">
                <label>البريد الإلكتروني</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'جاري...' : 'إرسال رابط إعادة التعيين'}
              </button>
            </form>
          )}

          {resetStep === 'done' && (
            <div>
              <p style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-light)', lineHeight: 1.6 }}>تم إرسال رمز إعادة التعيين. أدخل كلمة مرور جديدة أدناه:</p>
              <form onSubmit={e => { e.preventDefault(); confirmReset(); }}>
                <div className="auth-field">
                  <label>كلمة المرور الجديدة</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                </div>
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? 'جاري...' : 'تأكيد إعادة التعيين'}
                </button>
              </form>
            </div>
          )}

          {resetStep === 'complete' && (
            <button className="auth-submit" onClick={() => { setResetMode(false); setResetStep('request'); setResetMsg(''); setPassword(''); }}>
              العودة لتسجيل الدخول
            </button>
          )}

          <div className="auth-toggle">
            <button onClick={() => { setResetMode(false); setResetStep('request'); setError(''); setResetMsg(''); }}>
              العودة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h1>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="auth-field">
              <label>الاسم</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="auth-field">
            <label>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label>كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {mode === 'register' && (
            <label className="auth-merchant-toggle" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={registerAsMerchant} onChange={e => setRegisterAsMerchant(e.target.checked)} />
              🏪 تسجيل كتاجر (فتح متجر)
            </label>
          )}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'جاري...' : mode === 'login' ? 'دخول' : 'تسجيل'}
          </button>
          {mode === 'login' && (
            <button type="button" className="auth-forgot-btn" onClick={() => setResetMode(true)}>
              نسيت كلمة المرور؟
            </button>
          )}
        </form>

        <div className="auth-divider"><span>أو</span></div>

        <div className="auth-social">
          <a href="/api/auth/facebook" className="auth-social-btn facebook">
            <span className="auth-social-icon">f</span>
            <span>{mode === 'login' ? 'الدخول عبر فيسبوك' : 'التسجيل عبر فيسبوك'}</span>
          </a>
          <a href="/api/auth/google" className="auth-social-btn google">
            <span className="auth-social-icon">G</span>
            <span>{mode === 'login' ? 'الدخول عبر Google' : 'التسجيل عبر Google'}</span>
          </a>
          <a href="/api/auth/linkedin" className="auth-social-btn linkedin">
            <span className="auth-social-icon">in</span>
            <span>{mode === 'login' ? 'الدخول عبر LinkedIn' : 'التسجيل عبر LinkedIn'}</span>
          </a>
          <a href="/api/auth/apple" className="auth-social-btn apple">
            <span className="auth-social-icon"></span>
            <span>{mode === 'login' ? 'الدخول عبر Apple' : 'التسجيل عبر Apple'}</span>
          </a>
          <a href="/api/auth/tiktok" className="auth-social-btn tiktok">
            <span className="auth-social-icon">♪</span>
            <span>{mode === 'login' ? 'الدخول عبر TikTok' : 'التسجيل عبر TikTok'}</span>
          </a>
          <a href="/api/auth/snapchat" className="auth-social-btn snapchat">
            <span className="auth-social-icon">👻</span>
            <span>{mode === 'login' ? 'الدخول عبر Snapchat' : 'التسجيل عبر Snapchat'}</span>
          </a>
        </div>

        <div className="auth-toggle">
          {mode === 'login' ? (
            <p>ليس لديك حساب؟ <button onClick={() => { setMode('register'); setError(''); }}>سجل الآن</button></p>
          ) : (
            <p>لديك حساب؟ <button onClick={() => { setMode('login'); setError(''); }}>تسجيل الدخول</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
