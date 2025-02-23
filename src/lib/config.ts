// wear60web/src/lib/config.ts
// Environment configuration

export const config = {
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

// Validate required environment variables
if (!config.googleMapsApiKey) {
  console.warn('Google Maps API key is not set. Map functionality will be limited.')
}