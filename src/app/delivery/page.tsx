// wear60web/src/app/delivery/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Order = {
  id: string
  status: string
  shipping_address: string
  latitude: number
  longitude: number
  created_at: string
}

export default function DeliveryPortal() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/delivery/login')
        return
      }

      // Verify if the user is a delivery partner
      const { data: deliveryPartner, error: roleError } = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (roleError || !deliveryPartner) {
        // If not a delivery partner, sign them out and redirect to login
        await supabase.auth.signOut()
        router.push('/delivery/login')
        return
      }
      setUser(session.user)
      fetchOrders()
    }

    checkUser()

    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const acceptOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'accepted',
          delivery_partner_id: user.id 
        })
        .eq('id', orderId)

      if (error) throw error
      fetchOrders()
    } catch (error) {
      console.error('Error accepting order:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-8"
      >
        Delivery Portal
      </motion.h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800/50 rounded-lg p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">Order #{order.id.slice(0, 8)}</h3>
                <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <span className="px-3 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-500 rounded-full">
                {order.status}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-300">{order.shipping_address}</p>
              {order.latitude && order.longitude && (
                <p className="text-sm text-gray-400">
                  Location: {order.latitude}, {order.longitude}
                </p>
              )}
            </div>

            <button
              onClick={() => acceptOrder(order.id)}
              className="w-full py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
            >
              Accept Order
            </button>
          </motion.div>
        ))}

        {orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-12 text-gray-400"
          >
            No pending orders available
          </motion.div>
        )}
      </div>
    </div>
  )
}