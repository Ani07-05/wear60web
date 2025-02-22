// wear60web/src/app/orders/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import OrderTracker from '@/components/OrderTracker'

type OrderItem = {
  id: string
  product_id: string
  quantity: number
  price_at_time: number
  product: {
    name: string
    image_url: string
  }
}

type Order = {
  id: string
  status: string
  total_amount: number
  shipping_address: string
  latitude: number | null
  longitude: number | null
  created_at: string
  order_items: OrderItem[]
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/auth'
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(*, product:products(name, image_url))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Loading orders...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
        {orders.length === 0 ? (
          <p className="text-gray-400">No orders found.</p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 rounded-lg p-6 border border-white/10"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Order ID: {order.id}</p>
                    <p className="text-sm text-gray-400">
                      Date: {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-400">Status: {order.status}</p>
                  </div>
                  <p className="text-lg font-semibold">₹{order.total_amount.toFixed(2)}</p>
                </div>
                <div className="space-y-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="w-16 h-16 relative">
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-400">
                          Quantity: {item.quantity} × ₹{item.price_at_time.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400">Shipping Address:</p>
                  <p className="text-sm">{order.shipping_address}</p>
                  <button
                    onClick={() => setTrackingOrder(order)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Track Order
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      {trackingOrder && (
        <OrderTracker
          orderId={trackingOrder.id}
          latitude={trackingOrder.latitude}
          longitude={trackingOrder.longitude}
          status={trackingOrder.status}
          onClose={() => setTrackingOrder(null)}
        />
      )}
    </div>
  )
}