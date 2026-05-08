import { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default function LocationPicker({ value, onChange, onClose }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(24.7136);
  const [lng, setLng] = useState(46.6753);

  useEffect(() => {
    if (value) {
      const parts = value.split('@')[1]?.split(',') || [];
      if (parts.length >= 2) {
        setLat(parseFloat(parts[0]));
        setLng(parseFloat(parts[1]));
      }
    }
  }, [value]);

  useEffect(() => {
    if (mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, { zoomControl: false }).setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(mapInstanceRef.current);
    L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);

    markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current);

    markerRef.current.on('dragend', () => {
      const pos = markerRef.current.getLatLng();
      setLat(pos.lat);
      setLng(pos.lng);
      reverseGeocode(pos.lat, pos.lng);
    });

    mapInstanceRef.current.on('click', (e) => {
      markerRef.current.setLatLng(e.latlng);
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`);
      const data = await res.json();
      setAddress(data.display_name || '');
    } catch {
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const confirmLocation = () => {
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    onChange?.(mapsUrl);
    onClose?.();
  };

  return (
    <div className="location-picker-overlay" onClick={onClose}>
      <div className="location-picker" onClick={e => e.stopPropagation()}>
        <div className="location-picker-header">
          <h3>📍 اختيار الموقع</h3>
          <button className="location-picker-close" onClick={onClose}>✕</button>
        </div>
        <div className="location-picker-map" ref={mapRef} />
        {address && <div className="location-picker-address">{address}</div>}
        <div className="location-picker-coords">{lat.toFixed(4)}, {lng.toFixed(4)}</div>
        <button className="location-picker-confirm" onClick={confirmLocation}>تأكيد الموقع</button>
      </div>
    </div>
  );
}
