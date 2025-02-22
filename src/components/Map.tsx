// wear60web/src/components/Map.tsx
'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface IconDefault extends L.Icon.Default {
  _getIconUrl?: string;
}

interface MapProps {
  center: [number, number];
  marker: {
    position: [number, number];
    popup: string;
  };
}

const Map: React.FC<MapProps> = ({ center, marker }) => {
  useEffect(() => {
    delete ((L.Icon.Default.prototype as IconDefault)._getIconUrl);
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={marker.position}>
        <Popup>{marker.popup}</Popup>
      </Marker>
    </MapContainer>
  );
};

export default Map;