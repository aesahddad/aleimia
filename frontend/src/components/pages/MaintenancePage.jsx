import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MaintenancePage({ announcement }) {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      if (data.role === 'admin') {
        localStorage.setItem('aleinia_token', data.token);
        localStorage.setItem('aleinia_user', JSON.stringify(data));
        window.location.reload();
      } else {
        setError('غير مصرح بالدخول أثناء الصيانة');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تسجيل الدخول');
    }
  };

  return (
    <div className="maintenance-page">
      <div className="maintenance-card">
        <div className="maintenance-icon">🔧</div>
        <h1>الموقع تحت الصيانة</h1>
        <p className="maintenance-message">{announcement || 'نعمل على تحسين تجربتك، سنعود قريباً!'}</p>
        <div className="maintenance-progress">
          <div className="maintenance-bar"></div>
        </div>

        <button className="maintenance-admin-btn" onClick={() => setShowLogin(s => !s)}>
          {showLogin ? 'إخفاء' : 'دخول المشرفين'}
        </button>

        {showLogin && (
          <form className="maintenance-login" onSubmit={handleAdminLogin}>
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <div className="maintenance-error">{error}</div>}
            <button type="submit">دخول</button>
          </form>
        )}
      </div>
    </div>
  );
}
