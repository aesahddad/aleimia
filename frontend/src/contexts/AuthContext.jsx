import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aleinia_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const saveUser = (u) => {
    setUser(u);
    if (u) localStorage.setItem('aleinia_user', JSON.stringify(u));
    else localStorage.removeItem('aleinia_user');
  };

  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('aleinia_token', data.token);
    localStorage.setItem('aleinia_refreshToken', data.refreshToken);
    saveUser(data.user);
    return data.user;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('aleinia_token');
    localStorage.removeItem('aleinia_refreshToken');
    saveUser(null);
  }, []);

  const setAuth = async (token, refreshToken) => {
    localStorage.setItem('aleinia_token', token);
    if (refreshToken) localStorage.setItem('aleinia_refreshToken', refreshToken);
    try {
      const { data } = await client.get('/auth/callback', { params: { token, refreshToken } });
      if (data.success) saveUser(data.user);
    } catch { logout(); }
  };

  const switchRole = useCallback(() => {
    if (!user) return;
    if (!user.realRole) user.realRole = user.role;
    const newRole = user.role === 'client' ? user.realRole : 'client';
    saveUser({ ...user, role: newRole });
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, setAuth, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
