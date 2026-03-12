import { createClient } from '@supabase/supabase-js'

export interface PriceAlert {
  id: string
  email: string
  origin: string
  destination: string
  target_price: number
  created_at: string
  is_active: boolean
}

// Lazy initialization to avoid build-time errors
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey)
  return supabaseClient
}

// For backward compatibility
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get: (_, prop) => {
    const client = getSupabase()
    return (client as any)[prop]
  }
})
