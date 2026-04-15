import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    if (!supabaseClient) {
      // Use createBrowserClient from @supabase/ssr for proper cookie sync
      supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
    }
    return supabaseClient
  }

  // During build-time, env vars may not be available yet
  if (process.env.NODE_ENV === 'development') {
    console.warn('Supabase environment variables not found - using mock client')
  }
  return {
    auth: {
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      exchangeCodeForSession: async () => ({ data: { session: null, user: null }, error: null }),
      refreshSession: async () => ({ data: { session: null, user: null }, error: null }),
    },
  } as unknown as SupabaseClient
}

// Export a default client for backward compatibility
export const supabase = getSupabaseClient()
