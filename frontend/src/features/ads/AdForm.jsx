import { useState } from 'react';
import client from '../../api/client';
import { AD_PRICE } from './config';
import LocationPicker from '../../components/shared/LocationPicker';

export default function AdForm({ category, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', price: '', contactNumber: '',
    valLicense: '', location: '', videoUrl: '', enableChat: false
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      fd.append('category', category);
      files.forEach(f => fd.append('images', f));

      const { data } = await client.post('/ads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        alert('✅ تم نشر إعلانك بنجاح!');
        onCreated(data.ad);
        onClose();
      }
    } catch (err) {
      alert('❌ فشل النشر: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ad-form-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ad-form-modal">
        <div className="ad-form-header">
          <h2>إعلان جديد</h2>
          <button className="ad-form-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ad-form-body">
            <div className="ad-form-field">
              <label>عنوان الإعلان *</label>
              <input name="title" value={form.title} onChange={handleChange} required />
            </div>

            <div className="ad-form-field">
              <label>الوصف *</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} required />
            </div>

            <div className="ad-form-row">
              <div className="ad-form-field">
                <label>السعر (ريال)</label>
                <input name="price" type="number" value={form.price} onChange={handleChange} />
              </div>
              <div className="ad-form-field">
                <label>رقم الجوال</label>
                <input name="contactNumber" value={form.contactNumber} onChange={handleChange} />
              </div>
            </div>

            <div className="ad-form-field">
              <label>رابط الفيديو (YouTube)</label>
              <input name="videoUrl" value={form.videoUrl} onChange={handleChange} />
            </div>

            <div className="ad-form-field">
              <label>الموقع</label>
              <div className="ad-form-location-row">
                <input name="location" value={form.location} onChange={handleChange} placeholder="رابط Google Maps" />
                <button type="button" className="ad-form-map-btn" onClick={() => setShowMap(true)}>🗺️</button>
              </div>
            </div>
            {showMap && (
              <LocationPicker
                value={form.location}
                onChange={(url) => setForm(f => ({ ...f, location: url }))}
                onClose={() => setShowMap(false)}
              />
            )}

            {category === 'estate' && (
              <div className="ad-form-field">
                <label>رقم الترخيص العقاري *</label>
                <input name="valLicense" value={form.valLicense} onChange={handleChange} required />
              </div>
            )}

            <div className="ad-form-field">
              <label>صور الإعلان</label>
              <input type="file" multiple accept="image/*" onChange={handleFiles} />
              {previews.length > 0 && (
                <div className="ad-form-previews">
                  {previews.map((url, i) => (
                    <img key={i} src={url} alt={`预览 ${i + 1}`} />
                  ))}
                </div>
              )}
            </div>

            <div className="ad-form-field checkbox">
              <label>
                <input type="checkbox" name="enableChat" checked={form.enableChat} onChange={handleChange} />
                تفعيل المحادثة المباشرة
              </label>
            </div>
          </div>

          <div className="ad-form-footer">
            <div className="ad-form-price">رسوم النشر: <strong>{AD_PRICE} ر.س</strong> لمدة 30 يوماً</div>
            <button type="submit" className="ad-form-submit" disabled={submitting}>
              {submitting ? 'جاري النشر...' : 'نشر الإعلان'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
