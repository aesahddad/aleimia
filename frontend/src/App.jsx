import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AppProvider, useApp } from './contexts/AppContext';
import TopBar from './components/layout/TopBar';
import Sidebar from './components/layout/Sidebar';
import Home from './components/pages/Home';
import StoreView from './components/pages/StoreView';
import Cart from './components/pages/Cart';
import Auth from './components/pages/Auth';
import Admin from './components/pages/Admin';
import Merchant from './components/pages/Merchant';
import DynamicTabPage from './components/pages/DynamicTabPage';
import TabDispatcher from './components/pages/TabDispatcher';
import SubscriptionPlans from './features/subscriptions/SubscriptionPlans';
import MaintenancePage from './components/pages/MaintenancePage';
import './App.css';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const location = useLocation();
  const { settings, tabs } = useApp();
  const { user } = useAuth();

  const isStorePage = location.pathname.startsWith('/store/');

  if (settings.maintenanceMode && user?.role !== 'admin') {
    return <MaintenancePage announcement={settings.announcement} />;
  }

  const showSidebar = !isStorePage && sidebarOpen;

  return (
    <div className="app">
      <TopBar onToggleSidebar={() => setSidebarOpen(o => !o)} />

      <div className="app-body">
        {!isStorePage && window.innerWidth < 768 && <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />}
        {showSidebar && <Sidebar onNavigate={() => window.innerWidth < 768 && setSidebarOpen(false)} />}
        <div className={`main-stage ${!isStorePage && showSidebar ? 'has-sidebar' : 'full'}`}>
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/store/:id" element={<StoreView />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/merchant" element={<Merchant />} />
              <Route path="/plans" element={<SubscriptionPlans />} />
              <Route path="/:tabId" element={<TabDispatcher />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppProvider>
          <AppLayout />
        </AppProvider>
      </CartProvider>
    </AuthProvider>
  );
}
