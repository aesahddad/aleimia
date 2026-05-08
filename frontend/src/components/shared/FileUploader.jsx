import { useState, useRef } from 'react';
import client from '../../api/client';

const ACCEPT_MAP = {
  image: 'image/*',
  video: 'video/*',
  model: '.glb,.gltf',
  all: 'image/*,video/*,.glb,.gltf'
};

export default function FileUploader({ accept = 'image', multiple, onUpload, onError, label }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const fd = new FormData();
      if (multiple) {
        Array.from(files).forEach(f => fd.append('files', f));
      } else {
        fd.append('file', files[0]);
        // Show local preview for images
        if (files[0].type.startsWith('image/')) {
          setPreview(URL.createObjectURL(files[0]));
        }
      }

      const url = multiple ? '/upload/multiple' : '/upload';
      const { data } = await client.post(url, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        onUpload?.(multiple ? data.urls : data.url);
      } else {
        onError?.(data.error || 'Upload failed');
      }
    } catch (err) {
      onError?.(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="file-uploader">
      <label className="file-uploader-label">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT_MAP[accept] || accept}
          multiple={multiple}
          onChange={handleFile}
          hidden
        />
        <div className={`file-uploader-btn ${uploading ? 'uploading' : ''}`}>
          {uploading ? (
            <span>جاري الرفع...</span>
          ) : (
            <span>{label || (multiple ? '📁 رفع ملفات' : '📎 رفع ملف')}</span>
          )}
        </div>
      </label>
      {preview && accept === 'image' && !multiple && (
        <div className="file-uploader-preview">
          <img src={preview} alt="Preview" />
        </div>
      )}
    </div>
  );
}
