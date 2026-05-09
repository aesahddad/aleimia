import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import client from '../../api/client';
import { openWhatsApp } from '../../utils/whatsapp';

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQty, total, undoRemove, lastRemoved } = useCart();
  const [undoTimer, setUndoTimer] = useState(null);

  useEffect(() => {
    if (lastRemoved) {
      if (undoTimer) clearTimeout(undoTimer);
      const timer = setTimeout(() => setUndoTimer(null), 5000);
      setUndoTimer(timer);
      return () => clearTimeout(timer);
    } else {
      setUndoTimer(null);
    }
  }, [lastRemoved]);

  const groups = items.reduce((acc, item) => {
    const sid = item.storeId || 'unknown';
    if (!acc[sid]) acc[sid] = { id: sid, name: item.storeName || 'متجر', items: [], total: 0 };
    acc[sid].items.push(item);
    acc[sid].total += (item.price || 0) * item.qty;
    return acc;
  }, {});

  const sortedGroups = Object.values(groups);

  const handleCheckout = async (storeId) => {
    const group = sortedGroups.find(g => g.id === storeId);
    if (!group) return;

    let whatsapp = group.items[0]?.storeWhatsapp;
    if (!whatsapp) {
      try {
        const { data } = await client.get(`/stores/${storeId}`);
        whatsapp = data.financial?.whatsapp;
      } catch {}
    }

    if (!whatsapp) {
      alert('المتجر لا يملك رقم واتساب مسجل');
      return;
    }

    const user = JSON.parse(localStorage.getItem('aleinia_user')) || { username: 'عميل العينية' };
    const storeLink = `${window.location.origin}/store/${storeId}`;
    let msg = `مرحباً ${group.name}،\nأنا ${user.username}، أريد شراء المنتجات التالية:\n\n`;
    group.items.forEach((item, i) => {
      msg += `${i + 1}. ${item.name} (x${item.qty}) = ${(item.price || 0) * item.qty} ر.س\n`;
    });
    msg += `\n💰 الإجمالي: ${group.total} ريال\n\n`;
    msg += `🔗 رابط المتجر: ${storeLink}`;
    openWhatsApp(whatsapp, msg);
  };

  const handleOnlinePayment = async (storeId) => {
    const group = sortedGroups.find(g => g.id === storeId);
    if (!group) return;

    const token = localStorage.getItem('aleinia_token');
    if (!token) {
      alert('يرجى تسجيل الدخول أولاً للدفع الإلكتروني');
      return;
    }

    try {
      const { data } = await client.post('/payments/cart', {
        storeId,
        items: group.items.map(i => ({
          name: i.name,
          price: i.price,
          qty: i.qty,
          imageUrl: i.imageUrl,
          productId: i._id
        })),
        total: group.total
      });
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (e) {
      alert(e.response?.data?.error || 'فشلت عملية الدفع الإلكتروني');
    }
  };

  if (items.length === 0) {
    return (
      <div className="page-empty">
        <div className="page-empty-icon">🛒</div>
        <h2>السلة فارغة</h2>
        <p>ابدأ بالتسوق من المتاجر</p>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>مراجعة الطلبات</h1>
        <p className="cart-header-sub">يرجى مراجعة مشترياتك قبل التواصل مع المتاجر</p>
        <div className="cart-header-total">
          <span>الإجمالي الكلي</span>
          <span className="cart-total-amount">{total} ريال</span>
        </div>
      </div>

      {lastRemoved && undoTimer && (
        <div className="cart-undo-bar">
          <span>تم حذف "{lastRemoved.name}"</span>
          <button className="cart-undo-btn" onClick={() => { undoRemove(); if (undoTimer) clearTimeout(undoTimer); setUndoTimer(null); }}>
            تراجع
          </button>
        </div>
      )}

      <div className="cart-groups">
        {sortedGroups.map(group => (
          <div key={group.id} className="cart-group">
            <div className="cart-group-header">
              <h2>{group.name}</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="cart-back-btn" onClick={() => navigate(`/store/${group.id}`)}>← متابعة التسوق</button>
                <span className="cart-group-count">{group.items.length} منتجات</span>
              </div>
            </div>

            <div className="cart-group-items">
              {group.items.map(item => (
                <div key={item._id} className="cart-item">
                  <img src={item.imageUrl || ''} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    <h3>{item.name}</h3>
                    <div className="cart-item-meta">
                      <span className="cart-item-price">{item.price} ريال</span>
                    </div>
                  </div>
                  <div className="cart-item-qty-controls">
                    <button className="cart-qty-btn" onClick={() => updateQty(item._id, 1)}>+</button>
                    <span className="cart-qty-value">{item.qty}</span>
                    <button className="cart-qty-btn" onClick={() => updateQty(item._id, -1)}>{item.qty === 1 ? '🗑️' : '−'}</button>
                  </div>
                  <div className="cart-item-total">
                    <span className="cart-item-subtotal">{(item.price || 0) * item.qty} ر.س</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-group-footer">
              <span>إجمالي الطلب: {group.total} ريال</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="cart-checkout-btn" onClick={() => handleCheckout(group.id)}>
                  💬 واتساب
                </button>
                <button className="cart-pay-btn" onClick={() => handleOnlinePayment(group.id)}>
                  💳 دفع إلكتروني
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
