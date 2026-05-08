import { useCart } from '../../contexts/CartContext';
import client from '../../api/client';

export default function Cart() {
  const { items, updateQty, total } = useCart();

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
    let msg = `مرحباً ${group.name}،\nأنا ${user.username}، أريد شراء المنتجات التالية:\n\n`;
    group.items.forEach((item, i) => {
      msg += `${i + 1}. ${item.name} (x${item.qty}) = ${(item.price || 0) * item.qty} ر.س\n`;
    });
    msg += `\n💰 الإجمالي: ${group.total} ريال\n\n`;
    window.open(`https://wa.me/${whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
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

      <div className="cart-groups">
        {sortedGroups.map(group => (
          <div key={group.id} className="cart-group">
            <div className="cart-group-header">
              <h2>{group.name}</h2>
              <span className="cart-group-count">{group.items.length} منتجات</span>
            </div>

            <div className="cart-group-items">
              {group.items.map(item => (
                <div key={item._id} className="cart-item">
                  <img src={item.imageUrl || ''} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    <h3>{item.name}</h3>
                    <div className="cart-item-meta">
                      <span className="cart-item-price">{item.price} ريال</span>
                      <span className="cart-item-qty">الكمية: {item.qty}</span>
                    </div>
                  </div>
                  <div className="cart-item-total">
                    <span className="cart-item-subtotal">{(item.price || 0) * item.qty} ريال</span>
                    <button className="cart-item-remove" onClick={() => updateQty(item._id, -1)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-group-footer">
              <span>إجمالي الطلب: {group.total} ريال</span>
              <button className="cart-checkout-btn" onClick={() => handleCheckout(group.id)}>
                💬 إتمام الطلب عبر واتساب
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
