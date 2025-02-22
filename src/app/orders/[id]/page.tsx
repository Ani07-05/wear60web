'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Dynamically import react-leaflet components with no SSR
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

// Define all possible fields from the orders table
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

type PageProps = {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function OrderTrackingPage({ params }: PageProps) {
  const [orderLocation, setOrderLocation] = useState<OrderLocation | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
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

    fetchOrderLocation();

    const channel = supabase
      .channel(`order-${params.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${params.id}`,
      }, (payload: RealtimePostgresChangesPayload<OrderPayload>) => {
        const newData = payload.new as OrderPayload;
        const { latitude, longitude, status, updated_at } = newData;
        setOrderLocation({ latitude, longitude, status, updated_at });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

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
              popup: `Order #${params.id}\nStatus: ${orderLocation.status}`
            }}
          />
        )}
      </div>
    </div>
  );
}
