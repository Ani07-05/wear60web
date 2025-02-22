'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

type CartContextType = {
  cartCount: number
  updateCartCount: () => Promise<void>
  addToCart: (productId: string) => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0)

  const updateCartCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id)

      if (error) throw error

      const totalCount = data?.reduce((sum, item) => sum + item.quantity, 0) || 0
      setCartCount(totalCount)
    } catch (error) {
      console.error('Error updating cart count:', error)
    }
  }

  const addToCart = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/auth'
        return
      }

      // First check if the item exists
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single()

      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: productId,
          quantity: existingItem ? existingItem.quantity + 1 : 1
        }, {
          onConflict: 'user_id,product_id'
        })

      if (error) throw error

      await updateCartCount()
      toast.success('Added to cart!', {
        position: 'bottom-right',
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '8px',
        },
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart', {
        position: 'bottom-right',
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '8px',
        },
      })
    }
  }

  useEffect(() => {
    updateCartCount()
  }, [])

  return (
    <CartContext.Provider value={{ cartCount, updateCartCount, addToCart }}>
      <Toaster />
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}