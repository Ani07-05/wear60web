// wear60web/src/app/delivery/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Loader2, MapPin, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { User as SupabaseUser } from '@supabase/supabase-js'

type Order = {
  id: string
  status: string
  shipping_address: string
  latitude: number
  longitude: number
  created_at: string
}

interface DeliveryPartner {
  id: string
  user_id: string
  status: string
  current_location: {
    latitude: number
    longitude: number
  }
  name: string
  vehicle_type: string
  total_deliveries: number
}

export default function DeliveryPortal() {
  const [deliveryPartnerInfo, setDeliveryPartnerInfo] = useState<DeliveryPartner | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [updateLocation, setUpdateLocation] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/delivery/login')
        return
      }

      const { data: deliveryPartner, error: roleError } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (roleError || !deliveryPartner) {
        await supabase.auth.signOut()
        router.push('/delivery/login')
        return
      }

      setUser(session.user)
      setDeliveryPartnerInfo(deliveryPartner)
      setUpdateLocation(true)
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
  }, [router])

  useEffect(() => {
    if (!updateLocation || !deliveryPartnerInfo) return

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          await supabase
            .from('delivery_partners')
            .update({
              current_location: { latitude, longitude },
              last_location_update: new Date().toISOString()
            })
            .eq('id', deliveryPartnerInfo.id)
        } catch (error) {
          console.error('Error updating location:', error)
        }
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [updateLocation, deliveryPartnerInfo])

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
    if (!user || !deliveryPartnerInfo) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'accepted',
          delivery_partner_id: deliveryPartnerInfo.id 
        })
        .eq('id', orderId)

      if (error) throw error
      
      await supabase
        .from('delivery_partners')
        .update({ status: 'on_delivery' })
        .eq('id', deliveryPartnerInfo.id)

      fetchOrders()
    } catch (error) {
      console.error('Error accepting order:', error)
    }
  }

  const updateDeliveryStatus = async (status: string) => {
    if (!deliveryPartnerInfo) return

    try {
      const { error } = await supabase
        .from('delivery_partners')
        .update({ status })
        .eq('id', deliveryPartnerInfo.id)

      if (error) throw error
      
      setDeliveryPartnerInfo(prev => prev ? { ...prev, status } : null)
    } catch (error) {
      console.error('Error updating status:', error)
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-4">Delivery Portal</h1>
        
        {deliveryPartnerInfo && (
          <div className="bg-gray-800/30 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6" />
                <h2 className="text-xl font-semibold">{deliveryPartnerInfo.name}</h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                deliveryPartnerInfo.status === 'available' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
              }`}>
                {deliveryPartnerInfo.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-gray-400">Vehicle Type</p>
                <p>{deliveryPartnerInfo.vehicle_type}</p>
              </div>
              <div>
                <p className="text-gray-400">Total Deliveries</p>
                <p>{deliveryPartnerInfo.total_deliveries}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateDeliveryStatus('available')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  deliveryPartnerInfo.status === 'available' 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                disabled={deliveryPartnerInfo.status === 'available'}
              >
                Go Online
              </button>
              <button
                onClick={() => updateDeliveryStatus('offline')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  deliveryPartnerInfo.status === 'offline' 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gray-500 hover:bg-gray-600'
                }`}
                disabled={deliveryPartnerInfo.status === 'offline'}
              >
                Go Offline
              </button>
            </div>
          </div>
        )}
      </motion.div>

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
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <p className="text-sm text-gray-300">{order.shipping_address}</p>
              </div>
              {order.latitude && order.longitude && (
                <p className="text-sm text-gray-400">
                  Location: {order.latitude.toFixed(6)}, {order.longitude.toFixed(6)}
                </p>
              )}
            </div>

            <button
              onClick={() => acceptOrder(order.id)}
              disabled={!deliveryPartnerInfo || deliveryPartnerInfo.status !== 'available'}
              className={`w-full py-2 rounded-lg transition-colors ${
                !deliveryPartnerInfo || deliveryPartnerInfo.status !== 'available'
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
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