// src/app/orders/[id]/page.tsx
import OrderTrackingClient from './OrderTrackingClient';

export default function OrderTrackingPage({
  params,
}: {
  params: { id: string };
}) {
  return <OrderTrackingClient orderId={params.id} />;
}