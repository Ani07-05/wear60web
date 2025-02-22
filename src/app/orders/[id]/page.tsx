// wear60web/src/app/orders/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';

// Fix Leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type OrderLocation = {
  latitude: number;
  longitude: number;
  status: string;
  updated_at: string;
};

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const [orderLocation, setOrderLocation] = useState<OrderLocation | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Initial fetch of order location
    fetchOrderLocation();

    // Set up real-time subscription
    const channel = supabase
      .channel(`order-${params.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${params.id}`,
      }, (payload) => {
        const { latitude, longitude, status, updated_at } = payload.new;
        setOrderLocation({ latitude, longitude, status, updated_at });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  const fetchOrderLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('latitude, longitude, status, updated_at')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      if (data) setOrderLocation(data);
    } catch (err) {
      setError('Failed to fetch order location');
      console.error('Error:', err);
    }
  };

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!orderLocation) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Order Tracking</h1>
      <div className="mb-4">
        <p>Status: {orderLocation.status}</p>
        <p>Last Updated: {new Date(orderLocation.updated_at).toLocaleString()}</p>
      </div>
      <div className="h-[500px] w-full rounded-lg overflow-hidden">
        <MapContainer
          center={[orderLocation.latitude, orderLocation.longitude]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[orderLocation.latitude, orderLocation.longitude]}>
            <Popup>
              Order #{params.id}<br />
              Status: {orderLocation.status}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}