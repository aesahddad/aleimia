import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useApp } from '../../contexts/AppContext';
import client from '../../api/client';

export default function TopBar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, switchRole } = useAuth();
  const { count } = useCart();
  const { tabs } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchRef = useRef(null);
  const cartRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
      if (cartRef.current && !cartRef.current.contains(e.target)) setShowCart(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (val.length < 2) { setSearchResults(null); return; }
    try {
      const { data } = await client.get('/search', { params: { q: val } });
      setSearchResults(data);
    } catch { setSearchResults({ stores: [], products: [] }); }
  };

  const isActive = (tabId) => location.pathname === `/${tabId}` || (tabId === 'home' && location.pathname === '/');

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-left">
          <button className="topbar-hamburger" onClick={onToggleSidebar}>
            ☰
          </button>
          <div className="topbar-logo" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="العينية" className="topbar-logo-img" />
            <span className="topbar-logo-text">فهرس العينية</span>
          </div>
        </div>

        <div className="topbar-tabs">
          <button className="topbar-tab-scroll" onClick={() => document.getElementById('tabs-scroll').scrollBy({ right: -100, behavior: 'smooth' })}>
            ‹
          </button>
          <div id="tabs-scroll" className="topbar-tabs-scroll">
            {[{ id: 'home', label: 'الرئيسية', icon: '🏠' }, ...tabs.filter(t => t.visible)].map(tab => (
              <button
                key={tab.id}
                className={`topbar-tab ${isActive(tab.id) ? 'active' : ''}`}
                onClick={() => navigate(tab.id === 'home' ? '/' : `/${tab.id}`)}
              >
                {tab.icon && <i className={tab.icon} />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <button className="topbar-tab-scroll" onClick={() => document.getElementById('tabs-scroll').scrollBy({ right: 100, behavior: 'smooth' })}>
            ›
          </button>
        </div>

        <div className="topbar-right">
          <div className="topbar-search-wrap" ref={searchRef}>
            <button className="topbar-icon-btn" onClick={() => setShowSearch(!showSearch)}>
              🔍
            </button>
            {showSearch && (
              <div className="topbar-search-dropdown">
                <input
                  type="text"
                  placeholder="بحث عن متجر أو منتج..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="topbar-search-input"
                  autoFocus
                />
                {searchResults && (
                  <div className="topbar-search-results">
                    {searchResults.stores?.map(s => (
                      <div key={s._id} className="search-result-item" onClick={() => { navigate(`/store/${s._id}`); setShowSearch(false); }}>
                        <span>{s.name}</span>
                        <small>متجر</small>
                      </div>
                    ))}
                    {searchResults.products?.map(p => (
                      <div key={p._id} className="search-result-item" onClick={() => { navigate(`/store/${p.storeId}?product=${p._id}`); setShowSearch(false); }}>
                        <span>{p.name}</span>
                        <small>{p.price} ريال</small>
                      </div>
                    ))}
                    {!searchResults.stores?.length && !searchResults.products?.length && (
                      <div className="search-result-empty">لا توجد نتائج</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="topbar-user-wrap" ref={userRef}>
            <button className="topbar-icon-btn" onClick={() => user ? setShowUserMenu(o => !o) : navigate('/auth')}>
              👤
            </button>
            {user && showUserMenu && (
              <div className="topbar-user-dropdown">
                <div className="user-dropdown-name">{user.username || user.email}</div>
                <div className="user-dropdown-role">{user.role === 'admin' ? 'مدير' : user.role === 'merchant' ? 'تاجر' : 'عميل'}</div>
                {user.realRole && user.realRole !== user.role && (
                  <button className="user-dropdown-btn" onClick={() => { switchRole(); setShowUserMenu(false); }}>
                    التبديل إلى واجهة {user.realRole === 'admin' ? 'الإدارة' : 'التاجر'}
                  </button>
                )}
                {(user.role === 'admin' || user.role === 'merchant') && (
                  <button className="user-dropdown-btn" onClick={() => { navigate('/merchant'); setShowUserMenu(false); }}>
                    لوحة التاجر
                  </button>
                )}
                {user.role === 'admin' && (
                  <button className="user-dropdown-btn" onClick={() => { navigate('/admin'); setShowUserMenu(false); }}>
                    لوحة الإدارة
                  </button>
                )}
                <button className="user-dropdown-btn logout" onClick={() => { logout(); setShowUserMenu(false); }}>
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>

          <div className="topbar-cart-wrap" ref={cartRef}>
            <button className="topbar-icon-btn cart-btn" onClick={() => setShowCart(!showCart)}>
              🛒
              {count > 0 && <span className="cart-badge">{count}</span>}
            </button>
            {showCart && (
              <div className="topbar-cart-dropdown">
                {count === 0 ? (
                  <div className="cart-dropdown-empty">السلة فارغة</div>
                ) : (
                  <>
                    <div className="cart-dropdown-header">سلة المراجعة</div>
                    <CartDropdownContent />
                    <button className="cart-dropdown-checkout" onClick={() => { navigate('/cart'); setShowCart(false); }}>
                      إتمام الشراء
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function CartDropdownContent() {
  const { items, updateQty, remove } = useCart();
  const total = items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);

  return (
    <div className="cart-dropdown-items">
      {items.map(item => (
        <div key={item._id} className="cart-dropdown-item">
          <img src={item.imageUrl || ''} alt={item.name} className="cart-item-img" />
          <div className="cart-item-info">
            <div className="cart-item-name">{item.name}</div>
            <div className="cart-item-price">{item.price} ر.س × {item.qty}</div>
          </div>
          <button className="cart-item-remove" onClick={() => updateQty(item._id, -1)}>−</button>
        </div>
      ))}
      <div className="cart-dropdown-total">
        <span>الإجمالي</span>
        <span>{total} ر.س</span>
      </div>
    </div>
  );
}
