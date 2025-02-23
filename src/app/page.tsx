// wear60web/src/app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { motion } from 'framer-motion'

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative h-[300px] w-full overflow-hidden bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur">
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative flex h-full flex-col items-center justify-center text-center px-4 max-w-7xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl whitespace-nowrap"
        >
          Premium Clothing Delivered in Minutes
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 text-lg text-gray-300 md:text-xl"
        >
          Elevate your style with our curated collection
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white px-8 py-3 text-lg font-medium text-black transition-colors hover:bg-gray-100"
        >
          Shop Now
        </motion.button>
      </div>
    </section>
  )
}

function Categories() {
  const categories = [
    { name: "Men's Wear", count: 28 },
    { name: "Women's Wear", count: 35 },
    { name: 'Kids', count: 20 },
    { name: 'Accessories', count: 15 },
  ]

  return (
    <section className="space-y-8">
      <h2 className="text-3xl font-bold">Categories</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {categories.map((category) => (
          <motion.div
            key={category.name}
            whileHover={{ scale: 1.05 }}
            className="group cursor-pointer rounded-xl bg-white/5 p-6 text-center backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            <h3 className="mb-2 text-lg font-medium">{category.name}</h3>
            <p className="text-sm text-gray-400">{category.count} products</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function FeaturedProducts() {
  const products = [
    {
      id: 1,
      name: 'Leather Biker Jacket',
      description: 'Classic black leather motorcycle jacket',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5',
      price: 89.99
    },
    {
      id: 2,
      name: 'Cashmere Pullover',
      description: 'Luxurious cashmere sweater in cream',
      image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9',
      price: 89.99
    },
    {
      id: 3,
      name: 'Classic Blue Denim',
      description: 'Traditional straight-fit blue jeans',
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d',
      price: 89.99
    }
  ]

  return (
    <section className="space-y-8">
      <h2 className="text-3xl font-bold">Featured Products</h2>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <motion.div
            key={product.id}
            whileHover={{ y: -8 }}
            className="group overflow-hidden rounded-xl bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            <div className="relative mb-4 aspect-square overflow-hidden rounded-lg">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <h3 className="mb-2 text-lg font-medium">{product.name}</h3>
            <p className="mb-4 text-sm text-gray-400">{product.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">${product.price}</span>
              <button className="bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-200">
                Add to Cart
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 space-y-16">
        <Hero />
        <FeaturedProducts />
        <Categories />
      </div>
    </main>
  )
}