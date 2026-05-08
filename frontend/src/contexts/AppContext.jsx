import { createContext, useContext, useState, useEffect } from 'react';
import { fetchSettings, fetchTabs } from '../api/client';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [settings, setSettings] = useState({ maintenanceMode: false, announcement: '' });
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchSettings().catch(() => ({ maintenanceMode: false, announcement: '' })),
      fetchTabs().catch(() => [])
    ]).then(([s, t]) => {
      setSettings(s);
      setTabs(t);
      setLoading(false);
    });
  }, []);

  return (
    <AppContext.Provider value={{ settings, tabs, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
