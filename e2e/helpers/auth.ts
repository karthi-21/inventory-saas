import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load env vars from project root .env.local so Playwright tests have access
// to Supabase credentials even when running outside the Next.js runtime.
config({ path: resolve(process.cwd(), '.env.local') })

// Test credentials used across E2E suite
export const TEST_USER = {
  email: `e2e-test-${Date.now()}@ezvento.test`,
  password: 'Test@123456',
  firstName: 'E2E',
  lastName: 'Tester',
  plan: 'grow' as const,
}

let _adminClient: SupabaseClient | null = null
let _adminConfigError: string | null = null

/**
 * Check if the Supabase admin client can be created.
 * Tests that require admin operations (createTestUser, deleteTestUser)
 * should skip if this returns false.
 */
export function isAdminConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    _adminConfigError = !url
      ? 'Missing NEXT_PUBLIC_SUPABASE_URL in .env.local'
      : 'Missing SUPABASE_SERVICE_ROLE_KEY in .env.local'
    return false
  }
  return true
}

/**
 * Returns the reason why the admin client is not configured, or null if it is.
 */
export function getAdminConfigError(): string | null {
  isAdminConfigured() // refresh error state
  return _adminConfigError
}

function getAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !key) {
    throw new Error(
      'Missing Supabase URL or Service Role Key in environment.\n' +
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local\n' +
      'to enable admin operations (createTestUser, deleteTestUser, setupTestUser).'
    )
  }
  _adminClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _adminClient
}

/**
 * Create a verified test user in Supabase Auth.
 * Returns the user object and the raw Supabase auth client.
 *
 * Skips (returns null) if admin client is not configured.
 */
export async function createTestUser(
  email: string = TEST_USER.email,
  password: string = TEST_USER.password
): Promise<{ user: { id: string; email?: string; phone?: string | null; user_metadata?: Record<string, unknown>; email_confirmed_at?: string | null } } | null> {
  if (!isAdminConfigured()) {
    console.warn(`[E2E] Skipping createTestUser: ${_adminConfigError}`)
    return null
  }

  const admin = getAdminClient()

  // Clean up any existing user with this email first
  await deleteTestUser(email)

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: TEST_USER.firstName,
      last_name: TEST_USER.lastName,
      store_name: 'E2E Test Store',
    },
  })

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`)
  }

  if (!data.user) {
    throw new Error('createUser returned no user')
  }

  return { user: data.user }
}

/**
 * Delete a test user from Supabase Auth by email.
 * No-ops if admin client is not configured.
 */
export async function deleteTestUser(email: string) {
  if (!isAdminConfigured()) return

  const admin = getAdminClient()
  const { data: { users } } = await admin.auth.admin.listUsers()
  const existing = users.find((u) => u.email === email)
  if (existing) {
    await admin.auth.admin.deleteUser(existing.id)
  }
}

/**
 * Sign in with email/password via the Supabase REST API.
 */
export async function signInTestUser(
  email: string = TEST_USER.email,
  password: string = TEST_USER.password
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars for sign-in.\n' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
    )
  }

  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
    },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Sign in failed: ${err.message || res.statusText}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresIn: data.expires_in as number,
    user: data.user,
  }
}

/**
 * Create the test user in the Prisma database via the callback-server API.
 * Call this after creating the Supabase auth user.
 */
export async function syncTestUserToDatabase(
  user: { id: string; email: string; phone?: string | null; user_metadata?: Record<string, unknown>; email_confirmed_at?: string | null },
  plan: string = 'grow',
  baseUrl: string = 'http://localhost:3003'
) {
  const res = await fetch(`${baseUrl}/api/auth/callback-server`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, plan }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`callback-server failed: ${err.error || res.statusText}`)
  }

  return res.json()
}

/**
 * Full test user lifecycle:
 * 1. Create Supabase auth user
 * 2. Sync to Prisma via callback-server
 * 3. Return credentials for Playwright login
 *
 * Returns null if admin client is not configured.
 */
export async function setupTestUser(baseUrl: string = 'http://localhost:3003') {
  const result = await createTestUser()
  if (!result?.user) return null

  const { user } = result

  await syncTestUserToDatabase(
    {
      id: user.id,
      email: user.email!,
      phone: user.phone,
      user_metadata: {} as Record<string, unknown>,
      email_confirmed_at: null,
    },
    TEST_USER.plan,
    baseUrl
  )
  return { email: user.email!, password: TEST_USER.password, userId: user.id }
}

/**
 * Clean up test user from both Supabase Auth and Prisma database.
 * Best-effort; Prisma cleanup happens via cascade if the tenant is deleted.
 */
export async function teardownTestUser(email: string = TEST_USER.email) {
  await deleteTestUser(email)
}
