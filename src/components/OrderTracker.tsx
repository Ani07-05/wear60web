// wear60web/src/components/OrderTracker.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

type OrderTrackerProps = {
  orderId: string
  latitude: number | null
  longitude: number | null
  status: string
  onClose: () => void
}

export default function OrderTracker({ orderId, latitude: initialLatitude, longitude: initialLongitude, status: initialStatus, onClose }: OrderTrackerProps) {
  const [location, setLocation] = useState<{ latitude: number | null; longitude: number | null }>({ 
    latitude: initialLatitude, 
    longitude: initialLongitude 
  })
  const [status, setStatus] = useState(initialStatus)
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const defaultLocation = {
    latitude: 12.943060699936739,
    longitude: 77.54281118013748
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    // Force a reflow to ensure the container has proper dimensions
    mapRef.current.style.display = 'none'
    mapRef.current.offsetHeight // Force reflow
    mapRef.current.style.display = 'block'

    const map = L.map(mapRef.current, {
      center: [location.latitude || defaultLocation.latitude, location.longitude || defaultLocation.longitude],
      zoom: 13,
      zoomControl: true
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    // Add delivery location marker with custom icon
    if (location.latitude && location.longitude) {
      const deliveryIcon = L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })

      L.marker([location.latitude, location.longitude], { icon: deliveryIcon })
        .bindPopup('Delivery Location')
        .addTo(map)
    }

    // Add default location marker
    const defaultIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })

    L.marker([defaultLocation.latitude, defaultLocation.longitude], { icon: defaultIcon })
      .bindPopup('Default Location')
      .addTo(map)

    // Draw route line if we have both points
    if (location.latitude && location.longitude) {
      const points: L.LatLngExpression[] = [
        [defaultLocation.latitude, defaultLocation.longitude],
        [location.latitude, location.longitude]
      ]
      L.polyline(points, { color: '#3887be', weight: 5, opacity: 0.75 }).addTo(map)
    }

    // Ensure proper sizing after map initialization
    map.invalidateSize()

    setMap(map)

    return () => {
      map.remove()
    }
  }, [location.latitude, location.longitude])

  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        const { latitude, longitude, status } = payload.new
        setLocation({ latitude, longitude })
        setStatus(status)

        if (map && latitude && longitude) {
          map.setView([latitude, longitude], map.getZoom())
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, map])



  // Always render the map container

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50"
    >
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Order Tracking</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-300">Order Status: {status}</p>
          <p className="text-sm text-gray-300">Order ID: {orderId}</p>
          <p className="text-sm text-gray-300">Location: {location.latitude}, {location.longitude}</p>
        </div>
        <div ref={mapRef} className="aspect-video bg-gray-700/50 rounded-lg mb-4 overflow-hidden" style={{ width: '100%', height: '300px' }} />
      </div>
    </motion.div>
  )
}