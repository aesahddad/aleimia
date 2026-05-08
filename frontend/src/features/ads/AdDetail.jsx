import { useState, useEffect } from 'react';
import client from '../../api/client';
import ImageModal from '../../components/layout/ImageModal';
import ChatBox from '../chat/ChatBox';

export default function AdDetail({ ad, onBack }) {
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [showChat, setShowChat] = useState(false);

  const images = [ad.imageUrl, ...(ad.images || [])].filter(Boolean);

  const openGallery = (idx) => {
    setModalIndex(idx);
    setShowModal(true);
  };

  const handleWhatsApp = () => {
    const num = ad.whatsappLink || ad.contactNumber;
    if (!num) return;
    const msg = `مرحباً، بخصوص إعلان: ${ad.title}`;
    window.open(`https://wa.me/${num.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="ad-detail">
      <button className="back-btn" onClick={onBack}>← العودة</button>

      <div className="ad-detail-main">
        {images.length > 0 && (
          <div className="ad-detail-media">
            {ad.videoUrl && (
              <div className="ad-detail-video">
                {ad.videoUrl.includes('youtube') || ad.videoUrl.includes('youtu.be') ? (
                  <iframe src={`https://www.youtube-nocookie.com/embed/${extractYoutubeId(ad.videoUrl)}`} allowFullScreen title="ad video" />
                ) : (
                  <video controls><source src={ad.videoUrl} /></video>
                )}
              </div>
            )}
            <div className="ad-detail-images">
              {images.map((img, i) => (
                <div key={i} className="ad-detail-image" onClick={() => openGallery(i)}>
                  <img src={img} alt={`${ad.title} ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="ad-detail-info">
          <h1>{ad.title}</h1>
          {ad.price && <div className="ad-detail-price">{ad.price} ر.س</div>}
          <div className="ad-detail-category">{ad.category}</div>
          <p>{ad.description}</p>

          {ad.location && (
            <div className="ad-detail-location">
              📍 <a href={ad.location} target="_blank" rel="noopener noreferrer">عرض على الخريطة</a>
            </div>
          )}

          {(ad.contactNumber || ad.whatsappLink) && (
            <div className="ad-detail-contact">
              <button className="ad-contact-btn" onClick={handleWhatsApp}>
                💬 واتساب
              </button>
              <button className="ad-contact-btn chat-toggle" onClick={() => setShowChat(s => !s)}>
                💭 محادثة
              </button>
              {ad.contactNumber && (
                <a href={`tel:${ad.contactNumber}`} className="ad-contact-btn call">
                  📞 اتصال
                </a>
              )}
            </div>
          )}

          {showChat && (
            <div className="ad-detail-chat">
              <ChatBox adId={ad._id} onClose={() => setShowChat(false)} />
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ImageModal images={images} initialIndex={modalIndex} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

function extractYoutubeId(url) {
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0];
  if (url.includes('shorts/')) return url.split('shorts/')[1]?.split('?')[0];
  if (url.includes('watch?v=')) return url.split('watch?v=')[1]?.split('&')[0];
  if (url.includes('embed/')) return url.split('embed/')[1]?.split('?')[0];
  return '';
}
