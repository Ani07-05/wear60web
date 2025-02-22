'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShoppingBag, Heart } from 'lucide-react'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-16">
      <Hero />
      <FeaturedProducts />
      <Categories />
    </div>
  )
}

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

function FeaturedProducts() {
  return (
    <section className="space-y-8">
      <h2 className="text-3xl font-bold">Featured Products</h2>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            whileHover={{ y: -8 }}
            className="group overflow-hidden rounded-xl bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            <div className="relative mb-4 aspect-square overflow-hidden rounded-lg">
              <Image
                src={[
                  'https://images.unsplash.com/photo-1551028719-00167b16eac5',
                  'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9',
                  'https://images.unsplash.com/photo-1542272604-787c3835535d'
                ][i-1]}
                alt={`Product ${i}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <h3 className="mb-2 text-lg font-medium">{[
              'Leather Biker Jacket',
              'Cashmere Pullover',
              'Classic Blue Denim'
            ][i-1]}</h3>
            <p className="mb-4 text-sm text-gray-400">{[
              'Classic black leather motorcycle jacket',
              'Luxurious cashmere sweater in cream',
              'Traditional straight-fit blue jeans'
            ][i-1]}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">$89.99</span>
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

function Header({ user }: { user: any }) {
  return (
    <header className="bg-gray-900 py-4">
      <div className="container mx-auto flex items-center justify-between px-4">
        <h1 className="text-2xl font-bold">CoolShop</h1>
        {user ? (
          <button className="rounded-full bg-white px-4 py-2 text-black transition-colors hover:bg-gray-200">
            Logout
          </button>
        ) : (
          <button className="rounded-full bg-white px-4 py-2 text-black transition-colors hover:bg-gray-200">
            Login
          </button>
        )}
      </div>
    </header>
  )
}

function ShopByCategory() {
  const categories = [
    { name: 'Women', image: '/next.svg' },
    { name: 'Men', image: '/next.svg' },
    { name: 'Teens', image: '/next.svg' },
    { name: 'Kids', image: '/next.svg' },
  ]

  return (
    <section className="mb-12">
      <h2 className="mb-6 text-2xl font-semibold">Shop by Category</h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {categories.map((category) => (
          <CategoryCard key={category.name} {...category} />
        ))}
      </div>
    </section>
  )
}

function CategoryCard({ name, image }: { name: string; image: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="group cursor-pointer"
    >
      <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-gray-800">
        <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover p-6 transition-transform group-hover:scale-110" />
      </div>
      <span className="text-lg font-medium text-white/80">{name}</span>
    </motion.div>
  )
}

function CuratedForYou() {
  const products = [
    { id: 1, name: 'Cool Shirt', company: 'FashionCo', price: 1200 },
    { id: 2, name: 'Stylish Pants', company: 'TrendyWear', price: 1500 },
    { id: 3, name: 'Awesome Jacket', company: 'UrbanStyle', price: 2200 },
    { id: 4, name: 'Chic Dress', company: 'ElegantFashion', price: 1800 },
  ]

  return (
    <section>
      <h2 className="mb-6 text-2xl font-semibold">Curated for you</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  )
}

function ProductCard({ id, name, company, price }: { id: number; name: string; company: string; price: number }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="overflow-hidden rounded-xl bg-gray-900 p-4"
    >
      <div className="relative mb-4 aspect-square">
        <Image src={`/assets/prod${id}.png`} alt={name} fill className="rounded-lg object-cover" />
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm text-gray-400">{company}</h3>
          <p className="mb-1 text-sm">{name}</p>
          <p className="font-semibold">₹{price}</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full bg-white p-2 text-black transition-colors hover:bg-gray-200">
            <ShoppingBag size={18} />
          </button>
          <button className="rounded-full bg-white p-2 text-black transition-colors hover:bg-gray-200">
            <Heart size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
