import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

/**
 * Parse cookies from document.cookie string
 */
function parseCookies(): Array<{ name: string; value: string }> {
  if (typeof document === 'undefined') return []

  return document.cookie.split(';').map((c) => {
    const [name, ...rest] = c.trim().split('=')
    const value = rest.join('=')
    return { name, value: decodeURIComponent(value) }
  })
}

export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    if (!supabaseClient) {
      // createBrowserClient with proper cookie handling for PKCE flow
      // The PKCE code verifier must be stored in and retrieved from cookies
      // so it survives OAuth redirects and email confirmation links
      supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll: () => parseCookies(),
          setAll: (cookiesToSet) => {
            if (typeof document === 'undefined') return
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieString = [
                `${name}=${encodeURIComponent(value)}`,
                options.maxAge ? `Max-Age=${options.maxAge}` : '',
                options.path ? `Path=${options.path}` : 'Path=/',
                options.sameSite ? `SameSite=${options.sameSite}` : 'SameSite=Lax',
                options.secure ? 'Secure' : '',
                options.domain ? `Domain=${options.domain}` : '',
              ]
                .filter(Boolean)
                .join('; ')
              document.cookie = cookieString
            })
          },
        },
      })
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