'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'

type Product = {
  id: string
  name: string
  price: number
  image_url: string
  category: string
  description: string
}

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...new Set(products.map(p => p.category))]
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory)

  return (
    <div className="space-y-16">
      <section className="relative h-[300px] w-full overflow-hidden bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative flex h-full flex-col items-center justify-center text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl whitespace-nowrap"
          >
            Shop Collection
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 text-lg text-gray-300 md:text-xl"
          >
            Discover our latest fashion trends
          </motion.p>
        </div>
      </section>

      <section className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex space-x-4 overflow-x-auto pb-4"
        >
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-lg px-6 py-2 text-sm font-medium transition-colors ${selectedCategory === category ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'}`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="text-center">Loading products...</div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group overflow-hidden rounded-xl bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-400">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
                    <button
                      onClick={() => addToCart(product.id)}
                      className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/30"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}