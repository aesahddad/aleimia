export default function AdCard({ ad, onClick }) {
  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'اليوم';
    if (days === 1) return 'أمس';
    if (days < 7) return `منذ ${days} أيام`;
    return `منذ ${Math.floor(days / 7)} أسبوع`;
  };

  return (
    <div className="ad-card" onClick={() => onClick(ad)}>
      <div className="ad-card-image">
        <img src={ad.imageUrl || 'https://via.placeholder.com/300x200?text=لا+توجد+صورة'} alt={ad.title} />
        {ad.price && <span className="ad-card-price">{ad.price} ر.س</span>}
      </div>
      <div className="ad-card-body">
        <h3>{ad.title}</h3>
        {ad.description && <p>{ad.description.slice(0, 80)}...</p>}
        <div className="ad-card-meta">
          <span>👁 {ad.views || 0}</span>
          <span>{timeAgo(ad.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
