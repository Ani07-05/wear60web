// wear60web/src/app/cart/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

type CartItem = {
  product_id: string
  quantity: number
  product: {
    name: string
    price: number
    image_url: string
  }
}

type Address = {
  id: string
  full_name: string
  street_address: string
  city: string
  state: string
  postal_code: string
  country: string
  phone: string
  is_default: boolean
}



export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const { updateCartCount } = useCart()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id' | 'is_default'>>({ 
    full_name: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    phone: ''
  })

  useEffect(() => {
    fetchCartItems()
    fetchAddresses()
  }, [])

  async function fetchAddresses() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })

      if (error) throw error
      setAddresses(data || [])
      
      // Set default address if available
      const defaultAddress = data?.find(addr => addr.is_default)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
      } else if (data && data.length > 0) {
        setSelectedAddressId(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  async function handleAddAddress() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('addresses')
        .insert({
          ...newAddress,
          user_id: user.id,
          is_default: addresses.length === 0 // Make it default if it's the first address
        })
        .select()
        .single()

      if (error) throw error

      await fetchAddresses()
      setShowAddressForm(false)
      setNewAddress({
        full_name: '',
        street_address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        phone: ''
      })
    } catch (error) {
      console.error('Error adding address:', error)
      alert('Failed to add address')
    }
  }

  async function fetchCartItems() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/auth'
        return
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          product_id,
          quantity,
          product:products(name, price, image_url)
        `)
        .eq('user_id', user.id)

      if (error) throw error
      
      // Transform the data to match CartItem type
      const typedCartItems: CartItem[] = (data || []).map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        product: {
          name: item.product?.name || '',
          price: item.product?.price || 0,
          image_url: item.product?.image_url || ''
        }
      }))
      
      setCartItems(typedCartItems)
    } catch (error) {
      console.error('Error fetching cart items:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateQuantity(productId: string, newQuantity: number) {
    if (newQuantity < 1) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('user_id', user.id)
        .eq('product_id', productId)

      if (error) throw error
      await fetchCartItems()
      await updateCartCount()
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  async function removeItem(productId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)

      if (error) throw error
      await fetchCartItems()
      await updateCartCount()
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  function applyCoupon() {
    // Simple coupon logic - you can expand this
    if (couponCode === 'SAVE20') {
      setDiscount(0.2) // 20% discount
    } else if (couponCode === 'SAVE10') {
      setDiscount(0.1) // 10% discount
    } else {
      alert('Invalid coupon code')
    }
  }

  async function handleCheckout() {
    if (!selectedAddressId) {
      alert('Please select a delivery address')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/auth'
        return
      }

      // Create order with address_id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          address_id: selectedAddressId,
          status: 'pending'
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_time: item.product.price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Clear cart
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)

      if (clearError) throw clearError

      await fetchCartItems()
      await updateCartCount()

      // Show success animation
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed inset-0 flex items-center justify-center bg-black/50 z-50'
      successDiv.innerHTML = `
        <div class="bg-green-500 text-white px-8 py-4 rounded-lg shadow-lg">
          <h2 class="text-xl font-bold mb-2">Order Placed Successfully!</h2>
          <p>Thank you for your purchase.</p>
        </div>
      `
      document.body.appendChild(successDiv)

      setTimeout(() => {
        document.body.removeChild(successDiv)
        window.location.href = '/orders'
      }, 2000)
    } catch (error) {
      console.error('Error during checkout:', error)
      alert('Failed to place order')
    }
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const discountAmount = subtotal * discount
  const tax = (subtotal - discountAmount) * 0.1 // 10% tax after discount
  const total = subtotal - discountAmount + tax

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pt-20">
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <main className="container mx-auto px-4 py-16 space-y-16">
        <section className="relative h-[300px] w-full overflow-hidden bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur rounded-xl">
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative flex h-full flex-col items-center justify-center text-center px-4 max-w-7xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl whitespace-nowrap"
            >
              Your Shopping Cart
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 text-lg text-gray-300 md:text-xl"
            >
              Review and manage your selected items
            </motion.p>
          </div>
        </section>
    
        {cartItems.length === 0 ? (
          <div className="text-center space-y-4">
            <p className="text-xl text-gray-400">Your cart is empty</p>
            <Link
              href="/shop"
              className="inline-block rounded-xl bg-white/10 px-8 py-3 font-medium transition-colors hover:bg-white/20"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map(item => (
                <motion.div
                  key={item.product_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group overflow-hidden rounded-xl bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-24 w-24 overflow-hidden rounded-md">
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{item.product.name}</h3>
                      <p className="text-gray-400">₹{item.product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="ml-4 rounded-lg bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500/20"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="rounded-xl bg-white/5 p-6 backdrop-blur-sm h-fit space-y-6">
              {/* Delivery Address Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Delivery Address</h3>
                {addresses.length > 0 && (
                  <div className="space-y-3">
                    {addresses.map(address => (
                      <div
                        key={address.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === address.id
                            ? 'bg-white/20'
                            : 'bg-white/10 hover:bg-white/15'
                        }`}
                        onClick={() => setSelectedAddressId(address.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{address.full_name}</p>
                            <p className="text-sm text-gray-400">{address.phone}</p>
                            <p className="text-sm text-gray-400">
                              {address.street_address}, {address.city}, {address.state} {address.postal_code}
                            </p>
                            <p className="text-sm text-gray-400">{address.country}</p>
                          </div>
                          {address.is_default && (
                            <span className="text-xs bg-white/20 px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!showAddressForm ? (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20"
                  >
                    Add New Address
                  </button>
                ) : (
                  <div className="space-y-4 bg-white/10 p-4 rounded-lg">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newAddress.full_name}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/20"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/20"
                    />
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={newAddress.street_address}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, street_address: e.target.value }))}
                      className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/20"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/20"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                        className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/20"
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value={newAddress.country}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddAddress}
                        className="flex-1 rounded-lg bg-white/20 px-4 py-2 text-sm transition-colors hover:bg-white/30"
                      >
                        Save Address
                      </button>
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="rounded-lg bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (10%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-lg text-white">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full rounded-xl bg-white px-8 py-3 text-lg font-medium text-black transition-colors hover:bg-gray-100"
                disabled={!selectedAddressId}
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}