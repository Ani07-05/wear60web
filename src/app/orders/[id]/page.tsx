// wear60web/src/app/orders/[id]/page.tsx
// src/app/orders/[id]/page.tsx
import { Metadata } from 'next';
import OrderTrackingClient from './OrderTrackingClient';

interface Params {
  id: string;
}

interface Props {
  params: Promise<Params>;
  searchParams?: Promise<Record<string, string>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Order #${resolvedParams.id} Tracking`,
    description: `Track the status and location of order #${resolvedParams.id}`,
  };
}

export default async function OrderPage({ params }: Props) {
  const resolvedParams = await params;
  return <OrderTrackingClient orderId={resolvedParams.id} />;
}

// Type-safe static params
export async function generateStaticParams(): Promise<Array<Params>> {
  return [
    { id: 'some-order-id' },
    // Add more static paths as needed
  ];
}