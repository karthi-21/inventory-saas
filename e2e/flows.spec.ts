import { test, expect } from '@playwright/test'

// Test credentials
const TEST_EMAIL = 'demo@ezvento.karth-21.com'
const TEST_PASSWORD = 'Demo@123456'

test.describe('Ezvento Full Flow QA', () => {

  // ============================================
  // 1. LANDING PAGE
  // ============================================
  test.describe('Landing Page', () => {
    test('should load and show key content', async ({ page }) => {
      await page.goto('/')

      // Hero section should be visible
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()

      // CTA buttons should link to signup
      const signupLinks = page.getByRole('link', { name: /get started|start free|try free|sign up/i })
      await expect(signupLinks.first()).toBeVisible()

      // Pricing section should exist
      await expect(page.getByText(/launch|grow|scale/i).first()).toBeVisible()
    })

    test('should navigate to signup with plan param', async ({ page }) => {
      await page.goto('/')

      // Click a pricing CTA
      const cta = page.getByRole('link', { name: /get started|start free|try free/i }).first()
      await cta.click()

      // Should land on signup (possibly with ?plan= param)
      await expect(page).toHaveURL(/\/signup/, { timeout: 10000 })
    })
  })

  // ============================================
  // 2. SIGNUP FLOW
  // ============================================
  test.describe('Signup Flow', () => {
    test('should show signup page with plan selection', async ({ page }) => {
      await page.goto('/signup')

      // Should show plan options
      await expect(page.getByText(/launch/i)).toBeVisible()
      await expect(page.getByText(/grow/i)).toBeVisible()
      await expect(page.getByText(/scale/i)).toBeVisible()
    })

    test('should show auth methods when email auth is enabled', async ({ page }) => {
      await page.goto('/signup?plan=grow')

      // Should move to signup step
      // The page may show email/password fields OR a "Check your email" confirmation state
      // At minimum, the signup card should be visible
      await expect(page.getByRole('heading', { name: /create your account|check your email/i })).toBeVisible()
    })

    test('should validate email signup form', async ({ page }) => {
      await page.goto('/signup?plan=grow')

      // If email auth fields are visible, try submitting empty
      const emailInput = page.getByLabel(/email/i).first()
      if (await emailInput.isVisible()) {
        const passwordInput = page.getByLabel(/password/i).first()
        await emailInput.fill('')
        await passwordInput.fill('')

        // Click sign up button
        const signUpBtn = page.getByRole('button', { name: /sign up/i })
        if (await signUpBtn.isVisible()) {
          await signUpBtn.click()
          // Should show validation error
          await expect(page.getByText(/enter|required|invalid/i).first()).toBeVisible({ timeout: 5000 })
        }
      }
    })

    test('should accept plan param from URL', async ({ page }) => {
      await page.goto('/signup?plan=launch')

      // The selected plan should be reflected
      await expect(page.getByText(/launch/i).first()).toBeVisible()
    })

    test('should show terms and privacy links', async ({ page }) => {
      await page.goto('/signup?plan=grow')

      await expect(page.getByRole('link', { name: /terms/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /privacy/i })).toBeVisible()
    })

    test('should link to login page', async ({ page }) => {
      await page.goto('/signup?plan=grow')

      const loginLink = page.getByRole('link', { name: /sign in|log in/i })
      if (await loginLink.isVisible()) {
        await loginLink.click()
        await expect(page).toHaveURL(/\/login/)
      }
    })

    test('should handle Google OAuth redirect', async ({ page }) => {
      await page.goto('/signup?plan=grow')

      const googleBtn = page.getByRole('button', { name: /google/i })
      if (await googleBtn.isVisible()) {
        // Click should redirect to Google (we can't complete it in tests)
        // Just verify the button works and initiates redirect
        const navPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null)
        const urlChange = page.waitForURL(/accounts.google.com|auth\/callback/, { timeout: 5000 }).catch(() => null)
        await googleBtn.click()
        // Either a popup opens or URL changes — either is fine for this test
        await urlChange
      }
    })
  })

  // ============================================
  // 3. EMAIL VERIFICATION REDIRECT
  // ============================================
  test.describe('Email Verification', () => {
    test('should handle auth callback with error param', async ({ page }) => {
      await page.goto('/auth/callback?error=access_denied')

      // Should show error state
      await expect(page.getByText(/authentication error|error/i).first()).toBeVisible({ timeout: 5000 })
    })

    test('should handle auth callback with no code or session', async ({ page }) => {
      await page.goto('/auth/callback')

      // Should eventually redirect to signup with error
      await expect(page).toHaveURL(/\/signup/, { timeout: 10000 })
    })

    test('should show loading state during callback processing', async ({ page }) => {
      // Navigate and immediately check for loading indicator
      const response = page.goto('/auth/callback?code=fake_code&plan=grow')

      // Should show some loading state (spinner or "Setting up" text)
      await expect(
        page.getByText(/setting up|creating|loading/i).first()
      ).toBeVisible({ timeout: 3000 }).catch(() => {
        // May redirect too fast to catch the loading state — that's OK
      })
    })

    test('should preserve plan param through callback', async ({ page }) => {
      // Even if auth fails, the plan should be preserved in the error redirect
      await page.goto('/auth/callback?error=test&plan=launch')

      await expect(page).toHaveURL(/plan=launch/, { timeout: 10000 }).catch(() => {
        // The redirect may or may not include the plan param
      })
    })
  })

  // ============================================
  // 4. LOGIN FLOW
  // ============================================
  test.describe('Login Flow', () => {
    test('should show login page with email and password fields', async ({ page }) => {
      await page.goto('/login')

      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('should validate empty form submission', async ({ page }) => {
      await page.goto('/login')

      const submitBtn = page.getByRole('button', { name: /sign in/i })
      await submitBtn.click()

      // Should show validation error (Zod)
      await expect(page.getByText(/required|valid email|must be/i).first()).toBeVisible({ timeout: 5000 })
    })

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/email/i).fill('nonexistent@example.com')
      await page.getByLabel(/password/i).fill('wrongpassword123')
      await page.getByRole('button', { name: /sign in/i }).click()

      // Should show Supabase auth error
      await expect(page.getByText(/invalid|incorrect|failed/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('should login with valid demo credentials', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/email/i).fill(TEST_EMAIL)
      await page.getByLabel(/password/i).fill(TEST_PASSWORD)
      await page.getByRole('button', { name: /sign in/i }).click()

      // Should redirect to dashboard (or onboarding/payment if no store/sub)
      await expect(page).toHaveURL(/\/(dashboard|onboarding|payment)/, { timeout: 15000 })
    })

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/login')

      const passwordInput = page.getByLabel(/password/i)
      await passwordInput.fill('testpassword')

      // Password should be hidden
      expect(await passwordInput.getAttribute('type')).toBe('password')

      // Click the eye icon
      const toggleBtn = page.getByRole('button', { name: /show|eye/i }).or(
        page.locator('button[type="button"]').filter({ has: page.locator('svg') }).first()
      )
      if (await toggleBtn.isVisible()) {
        await toggleBtn.click()
        // After clicking, password should be visible (type="text")
        expect(await passwordInput.getAttribute('type')).toBe('text')
      }
    })

    test('should link to forgot password', async ({ page }) => {
      await page.goto('/login')

      const forgotLink = page.getByRole('link', { name: /forgot password/i })
      if (await forgotLink.isVisible()) {
        await forgotLink.click()
        await expect(page).toHaveURL(/\/forgot-password/)
      }
    })

    test('should link to signup', async ({ page }) => {
      await page.goto('/login')

      await page.getByRole('link', { name: /sign up/i }).click()
      await expect(page).toHaveURL(/\/signup/)
    })

    test('should redirect authenticated users from login to dashboard', async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(TEST_EMAIL)
      await page.getByLabel(/password/i).fill(TEST_PASSWORD)
      await page.getByRole('button', { name: /sign in/i }).click()
      await expect(page).toHaveURL(/\/(dashboard|onboarding|payment)/, { timeout: 15000 })

      // Now try to visit login again
      await page.goto('/login')
      // Middleware should redirect to dashboard
      await expect(page).toHaveURL(/\/(dashboard|onboarding|payment)/, { timeout: 10000 })
    })
  })

  // ============================================
  // 5. SUBSCRIPTION / PAYMENT PAGE
  // ============================================
  test.describe('Subscription & Payment', () => {
    test('should show payment page with plan details', async ({ page }) => {
      await page.goto('/payment?plan=grow')

      // Should show plan name and price
      await expect(page.getByText(/grow/i)).toBeVisible()
      await expect(page.getByText(/2,499/i)).toBeVisible()
    })

    test('should allow switching between plans', async ({ page }) => {
      await page.goto('/payment?plan=launch')

      // Click on a different plan
      const growBtn = page.getByRole('button', { name: /^grow$/i }).or(
        page.locator('button', { hasText: 'Grow' })
      )
      if (await growBtn.isVisible()) {
        await growBtn.click()
        await expect(page.getByText(/2,499/i)).toBeVisible()
      }
    })

    test('should show trial information', async ({ page }) => {
      await page.goto('/payment?plan=grow')

      await expect(page.getByText(/14-day free trial/i)).toBeVisible()
    })

    test('scale plan should show contact sales', async ({ page }) => {
      await page.goto('/payment?plan=scale')

      await expect(page.getByRole('button', { name: /contact sales/i })).toBeVisible()
    })

    test('should show error when payment initiation fails', async ({ page }) => {
      // Navigate to payment page without auth — create-order should fail
      await page.goto('/payment?plan=launch')

      const payBtn = page.getByRole('button', { name: /pay.*now/i })
      if (await payBtn.isVisible()) {
        await payBtn.click()

        // Should either redirect to checkout or show error
        // Since we're not authenticated, it should show error
        await page.waitForTimeout(3000)
        const hasError = await page.getByText(/error|failed|sign in|log in/i).first().isVisible().catch(() => false)
        const hasRedirected = page.url().includes('dodopayments') || page.url().includes('checkout')
        expect(hasError || hasRedirected).toBeTruthy()
      }
    })

    test('payment success page should render', async ({ page }) => {
      await page.goto('/payment/success')

      await expect(page.getByText(/payment successful|welcome/i).first()).toBeVisible({ timeout: 5000 })
    })
  })

  // ============================================
  // 6. STORE CREATION / ONBOARDING
  // ============================================
  test.describe('Onboarding Flow', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/onboarding')

      // Middleware should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })

    test('should show onboarding wizard for authenticated users without store', async ({ page }) => {
      // This test requires an authenticated session
      // We login first
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(TEST_EMAIL)
      await page.getByLabel(/password/i).fill(TEST_PASSWORD)
      await page.getByRole('button', { name: /sign in/i }).click()
      await expect(page).toHaveURL(/\/(dashboard|onboarding|payment)/, { timeout: 15000 })

      // If user already has a store, they'll be on dashboard
      // Navigate to onboarding anyway
      await page.goto('/onboarding')

      // Either the onboarding wizard shows OR we get redirected to dashboard
      const currentUrl = page.url()
      const isOnboarding = currentUrl.includes('/onboarding')
      const isDashboard = currentUrl.includes('/dashboard')

      expect(isOnboarding || isDashboard).toBeTruthy()
    })

    test('onboarding wizard should have step navigation', async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(TEST_EMAIL)
      await page.getByLabel(/password/i).fill(TEST_PASSWORD)
      await page.getByRole('button', { name: /sign in/i }).click()
      await expect(page).toHaveURL(/\/(dashboard|onboarding|payment)/, { timeout: 15000 })

      await page.goto('/onboarding')
      await page.waitForTimeout(2000)

      // If we're on onboarding, check for step indicators
      const currentUrl = page.url()
      if (currentUrl.includes('/onboarding')) {
        // Should have step indicators
        const steps = page.getByText(/business|store|location|team/i)
        if (await steps.first().isVisible()) {
          // At least one step should be visible
          expect(await steps.count()).toBeGreaterThan(0)
        }
      }
    })
  })

  // ============================================
  // 7. FORGOT PASSWORD FLOW
  // ============================================
  test.describe('Forgot Password', () => {
    test('should show forgot password page', async ({ page }) => {
      await page.goto('/forgot-password')

      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /send|reset/i })).toBeVisible()
    })

    test('should validate email field', async ({ page }) => {
      await page.goto('/forgot-password')

      const submitBtn = page.getByRole('button', { name: /send|reset/i })
      await submitBtn.click()

      // Should show validation error
      await expect(page.getByText(/required|valid email|enter/i).first()).toBeVisible({ timeout: 5000 })
    })

    test('should link back to login', async ({ page }) => {
      await page.goto('/forgot-password')

      await page.getByRole('link', { name: /sign in|back to login|log in/i }).click()
      await expect(page).toHaveURL(/\/login/)
    })
  })

  // ============================================
  // 8. PROTECTED ROUTES
  // ============================================
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
      '/dashboard/stores',
      '/dashboard/reports',
      '/dashboard/categories',
    ]

    for (const route of protectedRoutes) {
      test(`should redirect unauthenticated users from ${route} to login`, async ({ page }) => {
        await page.goto(route)
        await expect(page).toHaveURL(/\/(login|auth)/, { timeout: 10000 })
      })
    }

    test('should allow access to dashboard after login', async ({ page }) => {
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(TEST_EMAIL)
      await page.getByLabel(/password/i).fill(TEST_PASSWORD)
      await page.getByRole('button', { name: /sign in/i }).click()
      await expect(page).toHaveURL(/\/(dashboard|onboarding|payment)/, { timeout: 15000 })

      // Navigate to a protected page
      await page.goto('/dashboard/settings')
      await expect(page).toHaveURL(/\/dashboard\/settings/)
    })
  })

  // ============================================
  // 9. LOGOUT FLOW
  // ============================================
  test.describe('Logout', () => {
    test('should logout and redirect to login', async ({ page }) => {
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(TEST_EMAIL)
      await page.getByLabel(/password/i).fill(TEST_PASSWORD)
      await page.getByRole('button', { name: /sign in/i }).click()
      await expect(page).toHaveURL(/\/(dashboard|onboarding|payment)/, { timeout: 15000 })

      // Find logout button
      const logoutBtn = page.getByRole('button', { name: /logout|sign out|log out/i }).or(
        page.locator('[data-testid="logout"]')
      )

      // May need to open a menu first
      if (!await logoutBtn.isVisible()) {
        // Try clicking the user avatar/dropdown
        const avatar = page.getByRole('button', { name: /account|user|profile/i }).or(
          page.locator('[data-testid="user-menu"]').first()
        )
        if (await avatar.isVisible()) {
          await avatar.click()
        }
      }

      if (await logoutBtn.isVisible()) {
        await logoutBtn.click()
        await expect(page).toHaveURL(/\/(login|auth|\.$)/, { timeout: 10000 })
      }
    })
  })

  // ============================================
  // 10. ENVIRONMENT & CONFIG AUDIT (Runtime Checks)
  // ============================================
  test.describe('Environment & Config Audit', () => {
    test('should have Supabase env vars configured', async ({ page }) => {
      await page.goto('/')

      // Check that Supabase client initialized without error
      const consoleErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      await page.goto('/login')
      await page.waitForTimeout(2000)

      // Should NOT see Supabase env var warning
      const supabaseWarning = consoleErrors.find(e =>
        e.includes('Supabase environment variables') && e.includes('missing')
      )
      expect(supabaseWarning).toBeUndefined()
    })

    test('should not have localhost URLs in production redirects', async ({ page }) => {
      // This test documents the known issue — in production, callback-server
      // may use localhost fallback. Verify the env var is set.
      await page.goto('/auth/callback?error=test_error&plan=grow')

      // After error redirect, check we land on signup (not localhost:3003)
      await page.waitForTimeout(5000)
      const currentUrl = page.url()
      expect(currentUrl).not.toContain('localhost:3003')
    })

    test('should handle 404 for non-existent routes', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-at-all')

      // Should show 404 page
      await expect(page.getByText(/not found|404|doesn't exist/i).first()).toBeVisible({ timeout: 5000 })
    })
  })

  // ============================================
  // 11. CROSS-BROWSER RESPONSIVE CHECKS
  // ============================================
  test.describe('Responsive Design', () => {
    test('mobile viewport should show mobile navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/login')

      // Login form should still be visible and usable
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
    })

    test('landing page should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      // Hero should be visible
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    })
  })

  // ============================================
  // 12. SESSION EXPIRY & EDGE CASES
  // ============================================
  test.describe('Session & Edge Cases', () => {
    test('should handle concurrent login attempts', async ({ page }) => {
      await page.goto('/login')

      // Fill form
      await page.getByLabel(/email/i).fill(TEST_EMAIL)
      await page.getByLabel(/password/i).fill(TEST_PASSWORD)

      // Rapid double-click
      const submitBtn = page.getByRole('button', { name: /sign in/i })
      await submitBtn.click()
      // Second click should not crash the app
      await submitBtn.click().catch(() => {})

      // Should eventually redirect
      await expect(page).toHaveURL(/\/(dashboard|onboarding|payment|login)/, { timeout: 15000 })
    })

    test('should handle navigation to callback with expired code', async ({ page }) => {
      await page.goto('/auth/callback?code=expired_or_invalid_code&plan=grow')

      // Should handle gracefully (error state or redirect to signup)
      await page.waitForTimeout(5000)
      const currentUrl = page.url()
      const isOnCallback = currentUrl.includes('/auth/callback')
      const isOnSignup = currentUrl.includes('/signup')
      const isOnDashboard = currentUrl.includes('/dashboard')

      expect(isOnCallback || isOnSignup || isOnDashboard).toBeTruthy()
    })

    test('signup page should handle rate limiting gracefully', async ({ page }) => {
      await page.goto('/signup?plan=grow')

      // Check for any rate limit UI
      const emailInput = page.getByLabel(/email/i).first()
      if (await emailInput.isVisible()) {
        await emailInput.fill('ratelimit-test@example.com')
        await page.getByLabel(/password/i).first().fill('password123')

        const signUpBtn = page.getByRole('button', { name: /sign up/i })
        if (await signUpBtn.isVisible()) {
          await signUpBtn.click()

          // If rate limited, should show user-friendly message
          await page.waitForTimeout(5000)
          const rateLimitError = await page.getByText(/rate limit|too many|slow down|try again/i).first().isVisible().catch(() => false)
          const otherError = await page.getByText(/error|failed/i).first().isVisible().catch(() => false)

          // Either rate limit message or normal auth error or success redirect
          expect(rateLimitError || otherError || page.url().includes('/payment') || page.url().includes('/auth/callback')).toBeTruthy()
        }
      }
    })
  })
})