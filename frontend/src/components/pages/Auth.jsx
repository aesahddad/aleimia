import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [mode, setMode] = useState(searchParams.get('mode') || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        await client.post('/auth/register', { username: name, email, password });
        await login(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

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
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'جاري...' : mode === 'login' ? 'دخول' : 'تسجيل'}
          </button>
        </form>

        <div className="auth-divider"><span>أو</span></div>

        <div className="auth-social">
          <button className="auth-social-btn google" onClick={() => alert('قريباً - تسجيل الدخول عبر Google')}>
            <span className="auth-social-icon">G</span>
            <span>{mode === 'login' ? 'الدخول عبر Google' : 'التسجيل عبر Google'}</span>
          </button>
          <button className="auth-social-btn apple" onClick={() => alert('قريباً - تسجيل الدخول عبر Apple')}>
            <span className="auth-social-icon"></span>
            <span>{mode === 'login' ? 'الدخول عبر Apple' : 'التسجيل عبر Apple'}</span>
          </button>
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
