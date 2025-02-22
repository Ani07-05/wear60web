'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const MapWithNoSSR = dynamic(
  () => import('../../../components/Map'),
  { ssr: false }
);

type OrderLocation = {
  latitude: number;
  longitude: number;
  status: string;
  updated_at: string;
};

type OrderPayload = {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  updated_at: string;
  created_at: string;
  user_id?: string;
  delivery_address?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  order_items?: Record<string, unknown>;
  total_amount?: number;
  payment_status?: string;
  notes?: string;
};

interface OrderTrackingClientProps {
  orderId: string;
}

// Helper function to validate order location data
function isValidOrderLocation(data: unknown): data is OrderLocation {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>).latitude === 'number' &&
    typeof (data as Record<string, unknown>).longitude === 'number' &&
    typeof (data as Record<string, unknown>).status === 'string' &&
    typeof (data as Record<string, unknown>).updated_at === 'string'
  );
}

export default function OrderTrackingClient({ orderId }: OrderTrackingClientProps) {
  const [orderLocation, setOrderLocation] = useState<OrderLocation | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchOrderLocation = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('latitude, longitude, status, updated_at')
          .eq('id', orderId)
          .single();

        if (error) throw error;
        if (data && isValidOrderLocation(data)) {
          setOrderLocation(data);
        } else {
          throw new Error('Invalid order location data received');
        }
      } catch (err) {
        setError('Failed to fetch order location');
        console.error('Error:', err);
      }
    };

    fetchOrderLocation();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload: RealtimePostgresChangesPayload<OrderPayload>) => {
        const newData = payload.new;
        
        if (isValidOrderLocation(newData)) {
          setOrderLocation({
            latitude: newData.latitude,
            longitude: newData.longitude,
            status: newData.status,
            updated_at: newData.updated_at
          });
        } else {
          console.error('Invalid payload received:', newData);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

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
        {orderLocation && (
          <MapWithNoSSR
            center={[orderLocation.latitude, orderLocation.longitude]}
            marker={{
              position: [orderLocation.latitude, orderLocation.longitude],
              popup: `Order #${orderId}\nStatus: ${orderLocation.status}`
            }}
          />
        )}
      </div>
    </div>
  );
}