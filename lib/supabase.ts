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
  // SECURITY: Never expose the service role key to the client bundle.
  // The anon key respects Row Level Security (RLS), which is the safe default.
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey)
  return supabaseClient
}

// Server-only admin client that bypasses RLS using the service role key.
// Use this ONLY in server-side code (API routes, cron jobs) that needs
// unrestricted read/write access (e.g. the admin analytics dashboard).
let supabaseAdminClient: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (supabaseAdminClient) return supabaseAdminClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      '[Supabase] Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL — falling back to anon client. ' +
      'Admin queries will be subject to RLS and may return empty results.'
    )
    return getSupabase()
  }

  supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey)
  return supabaseAdminClient
}

// For backward compatibility
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get: (_, prop) => {
    const client = getSupabase()
    return (client as any)[prop]
  }
})
