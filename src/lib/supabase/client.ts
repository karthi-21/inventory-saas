import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    if (!supabaseClient) {
      // createBrowserClient automatically handles cookies in the browser
      // It stores the PKCE code verifier in cookies so it survives
      // OAuth redirects and email confirmation links
      supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
    }
    return supabaseClient
  }

  // In production, missing env vars are a fatal misconfiguration
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
    )
  }

  // In development, return a mock client but warn loudly
  console.error(
    'WARNING: Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing. ' +
    'Auth and database features will not work. Please set them in .env.local.'
  )
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