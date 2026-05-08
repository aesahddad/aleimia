import { useEffect, useRef, useState, useCallback } from 'react';

export default function ImageModal({ images, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPan = useRef({ x: 0, y: 0 });
  const imgRef = useRef(null);

  const current = images[index];

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const prev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') { onClose(); resetZoom(); }
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, prev, next, resetZoom]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom(z => Math.min(4, Math.max(1, z + delta)));
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    lastPan.current = { x: e.clientX, y: e.clientY };
  }, [zoom]);

  const handlePointerMove = useCallback((e) => {
    if (!isPanning) return;
    setPan(p => ({
      x: p.x + (e.clientX - lastPan.current.x),
      y: p.y + (e.clientY - lastPan.current.y)
    }));
    lastPan.current = { x: e.clientX, y: e.clientY };
  }, [isPanning]);

  const handlePointerUp = useCallback(() => setIsPanning(false), []);

  if (!images.length) return null;

  return (
    <div
      className="image-modal-overlay"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onClick={(e) => { if (e.target === e.currentTarget) { onClose(); resetZoom(); } }}
    >
      <button className="image-modal-close" onClick={() => { onClose(); resetZoom(); }}>
        ✕
      </button>

      {images.length > 1 && (
        <button className="image-modal-nav image-modal-prev" onClick={(e) => { e.stopPropagation(); prev(); resetZoom(); }}>
          ‹
        </button>
      )}

      <div className="image-modal-content">
        <img
          ref={imgRef}
          src={current}
          alt=""
          className="image-modal-img"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in'
          }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => { e.stopPropagation(); resetZoom(); }}
        />
      </div>

      {images.length > 1 && (
        <button className="image-modal-nav image-modal-next" onClick={(e) => { e.stopPropagation(); next(); resetZoom(); }}>
          ›
        </button>
      )}

      {images.length > 1 && (
        <div className="image-modal-counter">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
