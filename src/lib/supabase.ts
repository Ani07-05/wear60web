import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qbixqchironvastjjwcs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiaXhxY2hpcm9udmFzdGpqd2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMDc2NjIsImV4cCI6MjA1NTY4MzY2Mn0.souvRShUWYg4aNBsUxu5l0_0gfImzGuvAr_s0LIxkwg'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string
          role: 'customer' | 'delivery_partner'
          created_at: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          price: number
          image_url: string
          category: string
          description: string
          created_at: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'accepted' | 'in_transit' | 'delivered'
          delivery_partner_id: string | null
          created_at: string
          updated_at: string
          delivery_location: string
          items: { id: string; quantity: number }[]
        }
      }
      delivery_partners: {
        Row: {
          id: string
          user_id: string
          status: 'available' | 'busy'
          current_location: string
          created_at: string
        }
      }
    }
  }
}