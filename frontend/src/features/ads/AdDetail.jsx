import { useState } from 'react';
import ImageModal from '../../components/layout/ImageModal';
import ChatBox from '../chat/ChatBox';
import { openWhatsApp } from '../../utils/whatsapp';
import { getYoutubeEmbedUrl } from '../../utils/video';

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
    openWhatsApp(num, msg);
  };

  return (
    <div className="ad-detail">
      <button className="back-btn" onClick={onBack}>← العودة</button>

      {images.length > 0 && (
        <div className="ad-detail-hero" onClick={() => openGallery(0)}>
          <img src={images[0]} alt={ad.title} />
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

        {ad.videoUrl && (
          <div className="ad-detail-video">
            {ad.videoUrl.includes('youtube') || ad.videoUrl.includes('youtu.be') ? (
              <iframe src={getYoutubeEmbedUrl(ad.videoUrl)} allowFullScreen title="ad video" />
            ) : (
              <video controls><source src={ad.videoUrl} /></video>
            )}
          </div>
        )}

        {images.length > 1 && (
          <div className="ad-detail-gallery">
            {images.slice(1).map((img, i) => (
              <div key={i} className="ad-detail-gallery-thumb" onClick={() => openGallery(i + 1)}>
                <img src={img} alt={`${ad.title} ${i + 1}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ImageModal images={images} initialIndex={modalIndex} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
