import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('aleinia_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [lastRemoved, setLastRemoved] = useState(null);

  const save = (newItems) => {
    setItems(newItems);
    localStorage.setItem('aleinia_cart', JSON.stringify(newItems));
  };

  const add = useCallback((product, storeInfo = {}) => {
    setItems(prev => {
      const exists = prev.find(i => i._id === product._id);
      let updated;
      if (exists) {
        updated = prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      } else {
        updated = [...prev, {
          ...product,
          qty: 1,
          storeName: storeInfo.name || product.storeName || 'متجر',
          storeWhatsapp: storeInfo.whatsapp || product.storeWhatsapp || ''
        }];
      }
      localStorage.setItem('aleinia_cart', JSON.stringify(updated));
      return updated;
    });
    setLastRemoved(null);
  }, []);

  const updateQty = useCallback((id, delta) => {
    setItems(prev => {
      const target = prev.find(i => i._id === id);
      let updated = prev.map(i => i._id === id ? { ...i, qty: i.qty + delta } : i);
      const removed = updated.find(i => i._id === id);
      if (removed && removed.qty <= 0) {
        updated = updated.filter(i => i.qty > 0);
        if (target) setLastRemoved({ ...target, qty: 1 });
      } else {
        setLastRemoved(null);
      }
      localStorage.setItem('aleinia_cart', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const remove = useCallback((id) => {
    setItems(prev => {
      const target = prev.find(i => i._id === id);
      if (target) setLastRemoved(target);
      const updated = prev.filter(i => i._id !== id);
      localStorage.setItem('aleinia_cart', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const undoRemove = useCallback(() => {
    if (!lastRemoved) return;
    setItems(prev => {
      const exists = prev.find(i => i._id === lastRemoved._id);
      let updated;
      if (exists) {
        updated = prev.map(i => i._id === lastRemoved._id ? { ...i, qty: i.qty + 1 } : i);
      } else {
        updated = [{ ...lastRemoved, qty: 1, _id: lastRemoved._id || Date.now().toString() }, ...prev];
      }
      localStorage.setItem('aleinia_cart', JSON.stringify(updated));
      return updated;
    });
    setLastRemoved(null);
  }, [lastRemoved]);

  const clear = useCallback(() => {
    setItems([]);
    localStorage.removeItem('aleinia_cart');
  }, []);

  const total = items.reduce((sum, i) => sum + (i.price || 0) * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, add, updateQty, remove, undoRemove, clear, lastRemoved, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
