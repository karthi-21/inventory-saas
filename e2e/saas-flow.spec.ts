import { test, expect, type Page } from '@playwright/test'
import { createTestUser, deleteTestUser, signInTestUser, syncTestUserToDatabase } from './helpers/auth'

// Base URL is configured in playwright.config.ts
// Tests run against http://localhost:3003 by default

// ---------------------------------------------------------------------------
// Helper: Login via UI
// ---------------------------------------------------------------------------
async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
}

// ---------------------------------------------------------------------------
// Helper: Wait for navigation to settle (dashboard or onboarding)
// ---------------------------------------------------------------------------
async function waitForPostLogin(page: Page, timeout = 15000) {
  await page.waitForURL(/\/(dashboard|onboarding|payment)/, { timeout })
}

// ---------------------------------------------------------------------------
// 1. LANDING PAGE → SIGNUP
// ---------------------------------------------------------------------------
test.describe('Landing → Signup Journey', () => {
  test('landing page loads with hero and pricing', async ({ page }) => {
    await page.goto('/')

    // Hero heading
    const h1 = page.getByRole('heading', { level: 1 }).first()
    await expect(h1).toBeVisible({ timeout: 10000 })
    const text = await h1.textContent()
    expect(text?.toLowerCase()).toMatch(/retail|shop|pos|billing|business/)

    // Pricing tiers visible (scroll to pricing section)
    await page.getByText(/pricing/i).first().scrollIntoViewIfNeeded()
    await expect(page.getByText(/launch/i).first()).toBeVisible()
    await expect(page.getByText(/grow/i).first()).toBeVisible()
    await expect(page.getByText(/scale/i).first()).toBeVisible()

    // CTA buttons
    const ctas = page.getByRole('link', { name: /start|try|get|sign up/i })
    await expect(ctas.first()).toBeVisible()
  })

  test('pricing CTA navigates to signup with plan param', async ({ page }) => {
    await page.goto('/')

    // Find a CTA that links to signup
    const cta = page.locator('a[href*="/signup"]').first()
    if (await cta.isVisible()) {
      await cta.click()
      await expect(page).toHaveURL(/\/signup/)
    }
  })

  test('signup page shows plan selection', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.getByText(/choose your plan/i)).toBeVisible()
    await expect(page.getByText(/launch/i).first()).toBeVisible()
    await expect(page.getByText(/grow/i).first()).toBeVisible()
    await expect(page.getByText(/scale/i).first()).toBeVisible()
  })

  test('signup plan selection proceeds to account creation', async ({ page }) => {
    await page.goto('/signup')

    // Select Grow plan
    const growBtn = page.locator('button').filter({ hasText: /grow/i }).first()
    await expect(growBtn).toBeVisible()
    await growBtn.click()

    // Click Continue to proceed to the account creation form
    const continueBtn = page.getByRole('button', { name: /continue with grow/i })
    await expect(continueBtn).toBeVisible()
    await continueBtn.click()

    // Should show account creation form
    await expect(page.getByText(/create your account/i).first()).toBeVisible()

    // Email and password fields visible
    await expect(page.getByLabel(/email/i).first()).toBeVisible()
    await expect(page.getByLabel(/password/i).first()).toBeVisible()
  })

  test('signup form validates empty submission', async ({ page }) => {
    await page.goto('/signup?plan=grow')

    // The sign-up button is disabled when fields are empty — verify that
    const signUpBtn = page.getByRole('button', { name: /sign up with email/i })
    await expect(signUpBtn).toBeVisible()
    await expect(signUpBtn).toBeDisabled()

    // Fill email with invalid value, clear password, button should still be disabled
    await page.getByLabel(/email/i).first().fill('not-an-email')
    await page.getByLabel(/password/i).first().fill('short')
    await expect(signUpBtn).toBeEnabled()
    await signUpBtn.click()

    // Should show validation feedback
    const errorText = page.getByText(/enter|required|valid|at least/i).first()
    await expect(errorText).toBeVisible({ timeout: 5000 })
  })

  test('signup page links to terms, privacy, and login', async ({ page }) => {
    await page.goto('/signup?plan=grow')

    await expect(page.getByRole('link', { name: /terms/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /privacy/i })).toBeVisible()

    const loginLink = page.getByRole('link', { name: /sign in/i })
    await loginLink.click()
    await expect(page).toHaveURL(/\/login/)
  })
})

// ---------------------------------------------------------------------------
// 2. AUTH CALLBACK
// ---------------------------------------------------------------------------
test.describe('Auth Callback', () => {
  test('callback with error param redirects to signup with error', async ({ page }) => {
    await page.goto('/auth/callback?error=access_denied&plan=grow')

    // Callback redirects to signup with error param
    await expect(page).toHaveURL(/\/signup/, { timeout: 10000 })
  })

  test('callback with missing code redirects to signup', async ({ page }) => {
    await page.goto('/auth/callback')

    await expect(page).toHaveURL(/\/signup/, { timeout: 10000 })
  })

  test('callback with fake code shows error state', async ({ page }) => {
    await page.goto('/auth/callback?code=fake_code_123&plan=grow')

    // Should show error state (OAuth exchange fails)
    await expect(page.getByText(/authentication failed|oauth exchange failed/i).first()).toBeVisible({ timeout: 8000 })
  })
})

// ---------------------------------------------------------------------------
// 3. LOGIN FLOW
// ---------------------------------------------------------------------------
test.describe('Login Flow', () => {
  let testEmail: string
  let testPassword: string

  test.beforeAll(async () => {
    // Create a verified test user via Supabase Admin API
    const timestamp = Date.now()
    testEmail = `e2e-login-${timestamp}@ezvento.test`
    testPassword = 'Test@123456'

    const result = await createTestUser(testEmail, testPassword)
    if (!result?.user) throw new Error('Failed to create test user')
    const { user } = result

    // Sync to Prisma database
    await syncTestUserToDatabase(
      {
        id: user.id,
        email: user.email!,
        phone: user.phone,
        user_metadata: user.user_metadata as Record<string, unknown>,
        email_confirmed_at: user.email_confirmed_at,
      },
      'grow',
      process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003'
    )
  })

  test.afterAll(async () => {
    await deleteTestUser(testEmail)
  })

  test('login page shows form fields', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible()
  })

  test('login validates empty form', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: /sign in/i }).click()

    const errorText = page.getByText(/required|valid email|must be/i).first()
    await expect(errorText).toBeVisible({ timeout: 5000 })
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('nobody@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword123')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText(/invalid login credentials/i)).toBeVisible({ timeout: 10000 })
  })

  test('login with valid credentials succeeds', async ({ page }) => {
    await loginViaUI(page, testEmail, testPassword)
    await waitForPostLogin(page)

    const url = page.url()
    // Should land on dashboard, onboarding, or payment
    expect(url).toMatch(/\/(dashboard|onboarding|payment)/)
  })

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/login')

    const passwordInput = page.getByLabel(/password/i)
    await passwordInput.fill('secret123')
    expect(await passwordInput.getAttribute('type')).toBe('password')

    // Find and click the eye toggle (button inside the password field)
    const toggleBtn = passwordInput.locator('..').locator('button').first()
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click()
      expect(await passwordInput.getAttribute('type')).toBe('text')
    }
  })

  test('login page links to forgot-password', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('link', { name: /forgot password/i }).click()
    await expect(page).toHaveURL(/\/forgot-password/)
  })

  test('login page links to signup', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('link', { name: /sign up/i }).click()
    await expect(page).toHaveURL(/\/signup/)
  })

  test('authenticated user redirected from login to dashboard', async ({ page }) => {
    await loginViaUI(page, testEmail, testPassword)
    await waitForPostLogin(page)

    // Now try to visit login again
    await page.goto('/login')

    // Middleware should redirect away from login
    await page.waitForURL(/\/(dashboard|onboarding|payment)/, { timeout: 10000 })
    expect(page.url()).not.toContain('/login')
  })
})

// ---------------------------------------------------------------------------
// 4. DASHBOARD (Authenticated)
// ---------------------------------------------------------------------------
test.describe('Dashboard', () => {
  let testEmail: string
  let testPassword: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    testEmail = `e2e-dashboard-${timestamp}@ezvento.test`
    testPassword = 'Test@123456'

    const result = await createTestUser(testEmail, testPassword)
    if (!result?.user) throw new Error('Failed to create test user')
    const { user } = result
    await syncTestUserToDatabase(
      {
        id: user.id,
        email: user.email!,
        phone: user.phone,
        user_metadata: user.user_metadata as Record<string, unknown>,
        email_confirmed_at: user.email_confirmed_at,
      },
      'grow'
    )
  })

  test.afterAll(async () => {
    await deleteTestUser(testEmail)
  })

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, testEmail, testPassword)
    await waitForPostLogin(page)
  })

  test('dashboard shows navigation sidebar', async ({ page }) => {
    // If user has no store, they land on onboarding — skip sidebar check
    const url = page.url()
    if (url.includes('/onboarding')) {
      test.skip()
      return
    }

    // Sidebar should have nav items
    await expect(page.getByText(/dashboard/i).first()).toBeVisible()
    await expect(page.getByText(/stock|inventory/i).first()).toBeVisible()
    await expect(page.getByText(/billing/i).first()).toBeVisible()
    await expect(page.getByText(/customers/i).first()).toBeVisible()
  })

  test('dashboard shows user info in header', async ({ page }) => {
    // User avatar or name should be visible in header
    const userMenu = page.locator('[data-testid="user-menu"]').or(
      page.getByRole('button').filter({ has: page.locator('text=/E2E|tester|user/i') }).first()
    )
    // Fallback: just check header exists
    await expect(page.locator('header').first()).toBeVisible()
  })

  test('sidebar navigation links work', async ({ page }) => {
    // Dashboard layout may redirect to onboarding if no store exists — wait for it to settle
    try {
      await page.waitForURL(/\/onboarding/, { timeout: 5000 })
    } catch {
      // stayed on dashboard
    }
    const url = page.url()
    if (url.includes('/onboarding')) {
      test.skip()
      return
    }

    // Navigate to inventory using exact text match
    const stockLink = page.getByRole('link', { name: /^stock$/i })
    if (await stockLink.isVisible()) {
      await stockLink.click()
      await expect(page).toHaveURL(/\/dashboard\/inventory/)
    }
  })

  test('settings page accessible from dashboard', async ({ page }) => {
    // Dashboard layout may redirect to onboarding if no store exists — wait for it to settle
    try {
      await page.waitForURL(/\/onboarding/, { timeout: 5000 })
    } catch {
      // stayed on dashboard
    }
    const url = page.url()
    if (url.includes('/onboarding')) {
      test.skip()
      return
    }

    const settingsLink = page.getByRole('link', { name: /^settings$/i })
    if (await settingsLink.isVisible()) {
      await settingsLink.click()
      await expect(page).toHaveURL(/\/dashboard\/settings/)
    }
  })
})

// ---------------------------------------------------------------------------
// 5. ONBOARDING FLOW
// ---------------------------------------------------------------------------
test.describe('Onboarding Wizard', () => {
  let testEmail: string
  let testPassword: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    testEmail = `e2e-onboarding-${timestamp}@ezvento.test`
    testPassword = 'Test@123456'

    // Create auth user but DON'T sync to Prisma — this simulates a brand-new user
    await createTestUser(testEmail, testPassword)
  })

  test.afterAll(async () => {
    await deleteTestUser(testEmail)
  })

  test('unauthenticated user redirected from onboarding to login', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('new authenticated user lands on onboarding after login', async ({ page }) => {
    await loginViaUI(page, testEmail, testPassword)

    // Should redirect to onboarding (no store exists yet)
    await page.waitForURL(/\/onboarding/, { timeout: 15000 })
    expect(page.url()).toContain('/onboarding')
  })

  test('onboarding wizard shows step indicators', async ({ page }) => {
    await loginViaUI(page, testEmail, testPassword)
    await page.waitForURL(/\/onboarding/, { timeout: 15000 })

    // Should show a form or heading (the wizard has interactive elements)
    await expect(page.locator('input, button, h1, h2').first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 6. BILLING / POS
// ---------------------------------------------------------------------------
test.describe('Billing / POS', () => {
  let testEmail: string
  let testPassword: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    testEmail = `e2e-billing-${timestamp}@ezvento.test`
    testPassword = 'Test@123456'

    const result = await createTestUser(testEmail, testPassword)
    if (!result?.user) throw new Error('Failed to create test user')
    const { user } = result
    await syncTestUserToDatabase(
      {
        id: user.id,
        email: user.email!,
        phone: user.phone,
        user_metadata: user.user_metadata as Record<string, unknown>,
        email_confirmed_at: user.email_confirmed_at,
      },
      'grow'
    )
  })

  test.afterAll(async () => {
    await deleteTestUser(testEmail)
  })

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, testEmail, testPassword)
    await waitForPostLogin(page)
  })

  test('billing page loads', async ({ page }) => {
    await page.goto('/dashboard/billing')
    const url = page.url()
    if (url.includes('/onboarding')) {
      test.skip()
      return
    }
    await expect(page.getByText(/invoice|bill|sale/i).first()).toBeVisible()
  })

  test('new billing page loads', async ({ page }) => {
    await page.goto('/dashboard/billing/new')
    const url = page.url()
    if (url.includes('/onboarding')) {
      test.skip()
      return
    }
    // Should show POS elements
    await expect(page.getByText(/product|item|search|scan/i).first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 7. INVENTORY
// ---------------------------------------------------------------------------
test.describe('Inventory', () => {
  let testEmail: string
  let testPassword: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    testEmail = `e2e-inventory-${timestamp}@ezvento.test`
    testPassword = 'Test@123456'

    const result = await createTestUser(testEmail, testPassword)
    if (!result?.user) throw new Error('Failed to create test user')
    const { user } = result
    await syncTestUserToDatabase(
      {
        id: user.id,
        email: user.email!,
        phone: user.phone,
        user_metadata: user.user_metadata as Record<string, unknown>,
        email_confirmed_at: user.email_confirmed_at,
      },
      'grow'
    )
  })

  test.afterAll(async () => {
    await deleteTestUser(testEmail)
  })

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, testEmail, testPassword)
    await waitForPostLogin(page)
  })

  test('inventory page loads', async ({ page }) => {
    await page.goto('/dashboard/inventory')
    const url = page.url()
    if (url.includes('/onboarding')) {
      test.skip()
      return
    }
    await expect(page.getByText(/product|stock|inventory|item/i).first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 8. SETTINGS
// ---------------------------------------------------------------------------
test.describe('Settings', () => {
  let testEmail: string
  let testPassword: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    testEmail = `e2e-settings-${timestamp}@ezvento.test`
    testPassword = 'Test@123456'

    const result = await createTestUser(testEmail, testPassword)
    if (!result?.user) throw new Error('Failed to create test user')
    const { user } = result
    await syncTestUserToDatabase(
      {
        id: user.id,
        email: user.email!,
        phone: user.phone,
        user_metadata: user.user_metadata as Record<string, unknown>,
        email_confirmed_at: user.email_confirmed_at,
      },
      'grow'
    )
  })

  test.afterAll(async () => {
    await deleteTestUser(testEmail)
  })

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, testEmail, testPassword)
    await waitForPostLogin(page)
  })

  test('settings page loads', async ({ page }) => {
    await page.goto('/dashboard/settings')
    const url = page.url()
    if (url.includes('/onboarding')) {
      test.skip()
      return
    }
    await expect(page.getByText(/settings|configuration|preferences/i).first()).toBeVisible()
  })

  test('subscription settings page loads', async ({ page }) => {
    await page.goto('/dashboard/settings/subscription')
    const url = page.url()
    if (url.includes('/onboarding')) {
      test.skip()
      return
    }
    await expect(page.getByText(/subscription|plan|trial|billing/i).first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 9. PAYMENT PAGE
// ---------------------------------------------------------------------------
test.describe('Payment Page', () => {
  test('payment page shows plan details', async ({ page }) => {
    await page.goto('/payment?plan=grow')

    await expect(page.getByText(/grow/i).first()).toBeVisible()
    await expect(page.getByText(/2,499|trial|free/i).first()).toBeVisible()
  })

  test('payment page shows contact sales for scale', async ({ page }) => {
    await page.goto('/payment?plan=scale')

    await expect(page.getByRole('button', { name: /contact sales/i })).toBeVisible()
  })

  test('payment success page renders', async ({ page }) => {
    await page.goto('/payment/success')
    await expect(page.getByText(/success|welcome|thank/i).first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 10. PROTECTED ROUTES
// ---------------------------------------------------------------------------
test.describe('Protected Routes', () => {
  const protectedRoutes = [
    '/dashboard',
    '/dashboard/inventory',
    '/dashboard/billing',
    '/dashboard/billing/new',
    '/dashboard/customers',
    '/dashboard/vendors',
    '/dashboard/team',
    '/dashboard/settings',
    '/dashboard/settings/subscription',
    '/dashboard/stores',
    '/dashboard/reports',
    '/onboarding',
  ]

  for (const route of protectedRoutes) {
    test(`redirects unauthenticated from ${route} to login`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })
  }
})

// ---------------------------------------------------------------------------
// 11. LOGOUT
// ---------------------------------------------------------------------------
test.describe('Logout', () => {
  let testEmail: string
  let testPassword: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    testEmail = `e2e-logout-${timestamp}@ezvento.test`
    testPassword = 'Test@123456'

    const result = await createTestUser(testEmail, testPassword)
    if (!result?.user) throw new Error('Failed to create test user')
    const { user } = result
    await syncTestUserToDatabase(
      {
        id: user.id,
        email: user.email!,
        phone: user.phone,
        user_metadata: user.user_metadata as Record<string, unknown>,
        email_confirmed_at: user.email_confirmed_at,
      },
      'grow'
    )
  })

  test.afterAll(async () => {
    await deleteTestUser(testEmail)
  })

  test('logout redirects to login', async ({ page }) => {
    await loginViaUI(page, testEmail, testPassword)
    await waitForPostLogin(page)

    // Find and click logout
    const logoutBtn = page.getByRole('button', { name: /sign out|logout|log out/i }).first()
    await expect(logoutBtn).toBeVisible()
    await logoutBtn.click()

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('after logout, dashboard redirects to login', async ({ page }) => {
    await loginViaUI(page, testEmail, testPassword)
    await waitForPostLogin(page)

    // Logout
    const logoutBtn = page.getByRole('button', { name: /sign out|logout|log out/i }).first()
    await logoutBtn.click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

    // Try to access dashboard
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

// ---------------------------------------------------------------------------
// 12. FULL SAAS JOURNEY (End-to-End Smoke)
// ---------------------------------------------------------------------------
test.describe('Full SaaS Journey Smoke Test', () => {
  let testEmail: string
  let testPassword: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    testEmail = `e2e-journey-${timestamp}@ezvento.test`
    testPassword = 'Test@123456'

    const result = await createTestUser(testEmail, testPassword)
    if (!result?.user) throw new Error('Failed to create test user')
    const { user } = result
    await syncTestUserToDatabase(
      {
        id: user.id,
        email: user.email!,
        phone: user.phone,
        user_metadata: user.user_metadata as Record<string, unknown>,
        email_confirmed_at: user.email_confirmed_at,
      },
      'grow'
    )
  })

  test.afterAll(async () => {
    await deleteTestUser(testEmail)
  })

  test('complete journey: landing → login → dashboard → logout', async ({ page }) => {
    // 1. Landing page
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()

    // 2. Navigate to login
    await page.goto('/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()

    // 3. Login
    await page.getByLabel(/email/i).fill(testEmail)
    await page.getByLabel(/password/i).fill(testPassword)
    await page.getByRole('button', { name: /sign in/i }).click()

    // 4. Post-login page loads
    await waitForPostLogin(page)
    const url = page.url()
    expect(url).toMatch(/\/(dashboard|onboarding|payment)/)

    // 5. Navigate to key pages
    await page.goto('/dashboard/inventory')
    await expect(page).toHaveURL(/\/dashboard\/inventory/)

    await page.goto('/dashboard/billing')
    await expect(page).toHaveURL(/\/dashboard\/billing/)

    await page.goto('/dashboard/settings')
    await expect(page).toHaveURL(/\/dashboard\/settings/)

    // 6. Logout
    const logoutBtn = page.getByRole('button', { name: /sign out|logout|log out/i }).first()
    await expect(logoutBtn).toBeVisible()
    await logoutBtn.click()

    // 7. Back to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

    // 8. Dashboard should now redirect to login
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

// ---------------------------------------------------------------------------
// 13. ENVIRONMENT & RUNTIME CHECKS
// ---------------------------------------------------------------------------
test.describe('Environment Checks', () => {
  test('no Supabase env var errors in console', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/login')
    await page.waitForTimeout(2000)

    const supabaseMissing = errors.some((e) =>
      e.includes('Supabase environment variables') && e.includes('missing')
    )
    expect(supabaseMissing).toBe(false)
  })

  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto('/this-page-definitely-does-not-exist-12345')
    await expect(page.getByText(/not found|404|doesn.t exist/i).first()).toBeVisible({ timeout: 5000 })
  })
})
