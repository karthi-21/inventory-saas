import { test, expect, type Page } from '@playwright/test'
import { createTestUser, deleteTestUser, syncTestUserToDatabase } from './helpers/auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
}

async function waitForPostLogin(page: Page, timeout = 15000) {
  await page.waitForURL(/\/(dashboard|onboarding|payment)/, { timeout })
}

async function createStoreViaAPI(page: Page) {
  await page.evaluate(async () => {
    const res = await fetch('/api/onboarding/create-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeName: 'E2E Visual Store',
        storeCode: 'STR-001',
        address: '123 Test Street, Chennai',
        phone: '+919876543210',
        state: 'Tamil Nadu',
        pincode: '600001',
        storeType: 'MULTI_CATEGORY',
      }),
    })
    if (!res.ok) {
      throw new Error(`Create store failed: ${res.status} ${await res.text()}`)
    }
    return res.json()
  })
}

async function ensureUserHasStore(page: Page) {
  const url = page.url()
  if (url.includes('/onboarding')) {
    await createStoreViaAPI(page)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  }
}

// ---------------------------------------------------------------------------
// 1. Landing Page (@smoke)
// ---------------------------------------------------------------------------
test.describe('Landing Page', { tag: ['@smoke', '@regression'] }, () => {
  test('should match landing page snapshot', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('landing-page.png', { fullPage: true })
  })
})

// ---------------------------------------------------------------------------
// 2. Auth Pages (@smoke)
// ---------------------------------------------------------------------------
test.describe('Auth Pages', { tag: ['@smoke', '@regression'] }, () => {
  test('should match login page snapshot', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('login-page.png', { fullPage: true })
  })

  test('should match signup page snapshot', async ({ page }) => {
    await page.goto('/signup?plan=grow')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('signup-grow-page.png', { fullPage: true })
  })
})

// ---------------------------------------------------------------------------
// 3. Dashboard Pages (@critical)
// ---------------------------------------------------------------------------
test.describe('Dashboard Pages', { tag: ['@critical', '@regression'] }, () => {
  let testEmail: string
  let testPassword: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    testEmail = `e2e-visual-${timestamp}@ezvento.test`
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
    await ensureUserHasStore(page)
  })

  test('should match dashboard snapshot', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    if (page.url().includes('/onboarding')) {
      test.skip()
      return
    }
    await expect(page).toHaveScreenshot('dashboard-page.png', { fullPage: true })
  })

  test('should match inventory snapshot', async ({ page }) => {
    await page.goto('/dashboard/inventory')
    await page.waitForLoadState('networkidle')
    if (page.url().includes('/onboarding')) {
      test.skip()
      return
    }
    await expect(page).toHaveScreenshot('dashboard-inventory-page.png', { fullPage: true })
  })

  test('should match billing snapshot', async ({ page }) => {
    await page.goto('/dashboard/billing')
    await page.waitForLoadState('networkidle')
    if (page.url().includes('/onboarding')) {
      test.skip()
      return
    }
    await expect(page).toHaveScreenshot('dashboard-billing-page.png', { fullPage: true })
  })

  test('should match settings snapshot', async ({ page }) => {
    await page.goto('/dashboard/settings')
    await page.waitForLoadState('networkidle')
    if (page.url().includes('/onboarding')) {
      test.skip()
      return
    }
    await expect(page).toHaveScreenshot('dashboard-settings-page.png', { fullPage: true })
  })

  test('should match customers snapshot', async ({ page }) => {
    await page.goto('/dashboard/customers')
    await page.waitForLoadState('networkidle')
    if (page.url().includes('/onboarding')) {
      test.skip()
      return
    }
    await expect(page).toHaveScreenshot('dashboard-customers-page.png', { fullPage: true })
  })
})

// ---------------------------------------------------------------------------
// 4. Onboarding (@critical)
// ---------------------------------------------------------------------------
test.describe('Onboarding Page', { tag: ['@critical', '@regression'] }, () => {
  let testEmail: string
  let testPassword: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    testEmail = `e2e-visual-onboarding-${timestamp}@ezvento.test`
    testPassword = 'Test@123456'

    // Create auth user only — do not pre-sync to DB so no store exists
    await createTestUser(testEmail, testPassword)
    // Note: the login page will sync the user to DB but will not create a store,
    // so the user lands on onboarding after login
  })

  test.afterAll(async () => {
    await deleteTestUser(testEmail)
  })

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, testEmail, testPassword)
    // Wait specifically for onboarding redirect to settle
    await page.waitForURL(/\/onboarding/, { timeout: 15000 })
  })

  test('should match onboarding snapshot', async ({ page }) => {
    const url = page.url()
    if (url.includes('/dashboard')) {
      test.skip()
      return
    }
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('onboarding-page.png', { fullPage: true })
  })
})
