import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import client, { fetchStore, fetchProducts } from '../../api/client';
import { useCart } from '../../contexts/CartContext';
import SceneManager from '../three/SceneManager';
import SmartFrame from '../three/SmartFrame';
import ProductModel from '../three/ProductModel';
import ImageModal from '../layout/ImageModal';
import Sidebar from '../layout/Sidebar';

export default function StoreView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const simulateMode = searchParams.get('simulate') === 'true';

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeProduct, setActiveProduct] = useState(null);
  const [scenery, setScenery] = useState('modern');
  const [modalImages, setModalImages] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth >= 768);
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', description: '', galleryImages: [] });
  const [viewMode, setViewMode] = useState('products');

  const loadProducts = useCallback(() => {
    return fetchProducts(id).then(p => {
      setProducts(p);
      return p;
    });
  }, [id]);

  const refreshActive = useCallback((p) => {
    if (p.length > 0) {
      const currentId = activeProduct?._id;
      const target = currentId ? p.find(pr => pr._id === currentId) : p[0];
      if (target) setActiveProduct(target);
    }
  }, [activeProduct]);

  useEffect(() => {
    Promise.all([fetchStore(id), fetchProducts(id)])
      .then(([s, p]) => {
        setStore(s);
        setProducts(p);
        const productId = searchParams.get('product');
        const target = productId ? p.find(pr => pr._id === productId) : p[0] || null;
        setActiveProduct(target);
      });
  }, [id, searchParams]);

  const handleSelectProduct = useCallback((p) => {
    setActiveProduct(p);
    const simulate = simulateMode ? '&simulate=true' : '';
    window.history.replaceState(null, null, `/store/${id}?product=${p._id}${simulate}`);
  }, [id, simulateMode]);

  const handleAddToCart = useCallback(() => {
    if (activeProduct && store) {
      add(activeProduct, { name: store.name, whatsapp: store.financial?.whatsapp });
    }
  }, [activeProduct, store, add]);

  const handleReviewSubmitted = useCallback(() => {
    loadProducts().then(p => {
      if (activeProduct?._id) {
        const updated = p.find(pr => pr._id === activeProduct._id);
        if (updated) setActiveProduct(updated);
      }
    });
  }, [loadProducts, activeProduct]);

  const openGallery = useCallback((images, index = 0) => {
    setModalImages({ images, index });
  }, []);

  const handleDeleteProduct = async (productId) => {
    if (!confirm('تأكيد حذف المنتج؟')) return;
    try {
      await client.delete(`/stores/${id}/products/${productId}`);
      const updatedProducts = await loadProducts();
      if (activeProduct?._id === productId) {
        setActiveProduct(updatedProducts[0] || null);
      }
    } catch (e) {
      alert('فشل حذف المنتج');
    }
  };

  const openEditModal = (product) => {
    setEditForm({ name: product.name || '', price: product.price || '', description: product.description || '', galleryImages: [...(product.galleryImages || [])] });
    setEditProduct(product);
  };

  const handleUpdateProduct = async () => {
    if (!editProduct) return;
    try {
      const { data } = await client.put(`/stores/${id}/products/${editProduct._id}`, {
        name: editForm.name,
        price: Number(editForm.price),
        description: editForm.description,
        galleryImages: editForm.galleryImages
      });
      setEditProduct(null);
      const updated = await loadProducts();
      const refreshed = updated.find(p => p._id === editProduct._id);
      if (refreshed) setActiveProduct(refreshed);
    } catch (e) {
      alert('فشل تحديث المنتج: ' + (e.response?.data?.error || e.message));
    }
  };

  const removeGalleryImage = (index) => {
    setEditForm(f => ({ ...f, galleryImages: f.galleryImages.filter((_, i) => i !== index) }));
  };

  if (!store) return <div className="page-loading">جاري التحميل...</div>;

  const hasModel = activeProduct?.modelUrl && activeProduct?.displayMode !== 'frame';
  const mediaSources = [];
  if (activeProduct?.imageUrl) mediaSources.push(activeProduct.imageUrl);
  if (activeProduct?.catalogImages) {
    if (typeof activeProduct.catalogImages === 'string') {
      try { JSON.parse(activeProduct.catalogImages).forEach(i => mediaSources.push(i)); } catch { mediaSources.push(activeProduct.catalogImages); }
    } else if (Array.isArray(activeProduct.catalogImages)) {
      activeProduct.catalogImages.forEach(i => mediaSources.push(i));
    }
  }
  if (activeProduct?.galleryImages) {
    activeProduct.galleryImages.forEach(i => { if (!mediaSources.includes(i)) mediaSources.push(i); });
  }

  return (
    <div className="store-view">
      {simulateMode && (
        <div className="simulate-banner">
          <span>⚠️ وضع المحاكاة - يمكنك التعديل والحذف للمحافظة على المتجر</span>
          <button className="simulate-exit-btn" onClick={() => navigate('/admin?tab=stores')}>✕ خروج من المحاكاة</button>
        </div>
      )}
      {sidebarVisible && (
        <Sidebar
          store={store}
          product={activeProduct}
          products={products}
          onSelectProduct={handleSelectProduct}
          onAddToCart={handleAddToCart}
          onOpenGallery={mediaSources.length > 0 ? (idx) => openGallery(mediaSources, idx) : null}
          onNavigate={() => setSidebarVisible(false)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
      <button className={`sidebar-mobile-tab ${sidebarVisible ? 'on-sidebar' : 'on-main'}`} onClick={() => setSidebarVisible(v => !v)}>
        {sidebarVisible ? '‹' : '›'}
      </button>
      <div className={`store-main ${sidebarVisible ? '' : 'full'}`}>
        <div className="store-3d-container">
          <SceneManager scenery={scenery}>
            {activeProduct && hasModel ? (
              <ProductModel url={activeProduct.modelUrl} />
            ) : activeProduct ? (
              <SmartFrame imageUrl={activeProduct.imageUrl} specs={activeProduct.specs || []} />
            ) : null}
          </SceneManager>

          <div className="store-3d-overlay">
            <div className="store-3d-info">
              <button className="store-back-link" onClick={() => navigate('/')}>خروج</button>
              {activeProduct && (
                <div className="store-3d-product-info">
                  <div className="store-3d-product-name">{activeProduct.name}</div>
                  <div className="store-3d-product-price">
                    {activeProduct.price ? `${activeProduct.price} ريال` : ''}
                  </div>
                </div>
              )}
            </div>
            <div className="store-3d-actions">
              {store.websiteUrl && (
                <button className={`store-action-btn ${viewMode === 'website' ? 'active' : ''}`} onClick={() => setViewMode(v => v === 'website' ? 'products' : 'website')} title="موقع المتجر">
                  🌐
                </button>
              )}
              {store.aboutUs && (
                <button className={`store-action-btn ${viewMode === 'about' ? 'active' : ''}`} onClick={() => setViewMode(v => v === 'about' ? 'products' : 'about')} title="عن المتجر">
                  ℹ️
                </button>
              )}
              {activeProduct && viewMode === 'products' && (
                <button className="store-action-btn cart-btn" onClick={handleAddToCart} title="أضف إلى السلة">
                  🛒
                </button>
              )}
              {viewMode === 'products' && (
                <button className="store-action-btn" onClick={() => setScenery(s => s === 'modern' ? 'dark' : s === 'dark' ? 'natural' : 'modern')} title="تغيير الخلفية">
                  🎨
                </button>
              )}
            </div>
          </div>
          {viewMode === 'website' && store.websiteUrl && (
            <div className="store-iframe-container">
              <iframe src={store.websiteUrl} title="موقع المتجر" className="store-iframe" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
            </div>
          )}
          {viewMode === 'about' && store.aboutUs && (
            <div className="store-about-container">
              <div className="store-about-content">
                {store.imageUrl && <img src={store.imageUrl} alt={store.name} className="store-about-image" />}
                <h2>{store.name}</h2>
                {store.description && <p className="store-about-description">{store.description}</p>}
                <div className="store-about-text">{store.aboutUs}</div>
              </div>
            </div>
          )}
          {viewMode === 'products' && (
          <div className="store-3d-dock">
            {products.length === 0 ? (
              <div className="dock-empty">لا توجد منتجات</div>
            ) : products.map(p => (
              <div key={p._id} className={`dock-item ${activeProduct?._id === p._id ? 'active' : ''}`} style={{ position: 'relative' }}>
                <button onClick={() => handleSelectProduct(p)} style={{ width: '100%', height: '100%', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}>
                  <img src={p.imageUrl || ''} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                </button>
                {simulateMode && (
                  <div className="dock-admin-actions">
                    <button className="dock-admin-btn edit" onClick={() => openEditModal(p)} title="تعديل">✏️</button>
                    <button className="dock-admin-btn delete" onClick={() => handleDeleteProduct(p._id)} title="حذف">🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      {simulateMode && editProduct && (
        <div className="admin-modal-overlay" onClick={() => setEditProduct(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>تعديل المنتج</h3>
            <div className="admin-field">
              <label>اسم المنتج</label>
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="admin-input" />
            </div>
            <div className="admin-field">
              <label>السعر (ريال)</label>
              <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} className="admin-input" />
            </div>
            <div className="admin-field">
              <label>الوصف</label>
              <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} className="admin-textarea" />
            </div>
            <div className="admin-field">
              <label>صور المنتج</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {editForm.galleryImages.map((url, i) => (
                  <div key={i} style={{ position: 'relative', width: 60, height: 60 }}>
                    <img src={url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                    <button type="button" className="admin-btn delete" style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, fontSize: 10, padding: 0, borderRadius: '50%' }} onClick={() => removeGalleryImage(i)}>✕</button>
                  </div>
                ))}
                {editForm.galleryImages.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-light)' }}>لا توجد صور</span>}
              </div>
            </div>
            <div className="admin-modal-btns">
              <button className="admin-btn approve" onClick={handleUpdateProduct}>💾 حفظ التعديلات</button>
              <button className="admin-btn delete" onClick={() => setEditProduct(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {modalImages && (
        <ImageModal
          images={modalImages.images}
          initialIndex={modalImages.index}
          onClose={() => setModalImages(null)}
        />
      )}
    </div>
  );
}
