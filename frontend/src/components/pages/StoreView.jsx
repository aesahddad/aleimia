import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchStore, fetchProducts } from '../../api/client';
import { useCart } from '../../contexts/CartContext';
import SceneManager from '../three/SceneManager';
import SmartFrame from '../three/SmartFrame';
import ProductModel from '../three/ProductModel';
import ImageModal from '../layout/ImageModal';
import Sidebar from '../layout/Sidebar';

export default function StoreView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { add } = useCart();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeProduct, setActiveProduct] = useState(null);
  const [scenery, setScenery] = useState('modern');
  const [modalImages, setModalImages] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth >= 768);

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
    window.history.replaceState(null, null, `/store/${id}?product=${p._id}`);
  }, [id]);

  const handleAddToCart = useCallback(() => {
    if (activeProduct && store) {
      add(activeProduct, { name: store.name, whatsapp: store.financial?.whatsapp });
    }
  }, [activeProduct, store, add]);

  const openGallery = useCallback((images, index = 0) => {
    setModalImages({ images, index });
  }, []);

  if (!store) return <div className="page-loading">جاري التحميل...</div>;

  const hasModel = activeProduct?.modelUrl;
  const mediaSources = [];
  if (activeProduct?.imageUrl) mediaSources.push(activeProduct.imageUrl);
  if (activeProduct?.catalogImages) {
    if (typeof activeProduct.catalogImages === 'string') {
      try { JSON.parse(activeProduct.catalogImages).forEach(i => mediaSources.push(i)); } catch { mediaSources.push(activeProduct.catalogImages); }
    } else if (Array.isArray(activeProduct.catalogImages)) {
      activeProduct.catalogImages.forEach(i => mediaSources.push(i));
    }
  }

  return (
    <div className="store-view">
      {sidebarVisible && (
        <Sidebar
          store={store}
          product={activeProduct}
          products={products}
          onSelectProduct={handleSelectProduct}
          onAddToCart={handleAddToCart}
          onOpenGallery={mediaSources.length > 0 ? (idx) => openGallery(mediaSources, idx) : null}
        />
      )}
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
              <div className="store-3d-tag">عرض ثلاثي الأبعاد</div>
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
              <button className="store-action-btn" onClick={() => setScenery(s => s === 'modern' ? 'dark' : s === 'dark' ? 'natural' : 'modern')} title="تغيير الخلفية">
                🎨
              </button>
              <button className="store-action-btn mobile-sidebar-toggle" onClick={() => setSidebarVisible(v => !v)} title={sidebarVisible ? 'إخفاء الشريط' : 'إظهار الشريط'}>
                {sidebarVisible ? '◀' : '▶'}
              </button>
            </div>
          </div>

          <div className="store-3d-dock">
            {products.length === 0 ? (
              <div className="dock-empty">لا توجد منتجات</div>
            ) : products.map(p => (
              <button key={p._id} className={`dock-item ${activeProduct?._id === p._id ? 'active' : ''}`} onClick={() => handleSelectProduct(p)}>
                <img src={p.imageUrl || ''} alt={p.name} />
              </button>
            ))}
          </div>
        </div>
      </div>

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
