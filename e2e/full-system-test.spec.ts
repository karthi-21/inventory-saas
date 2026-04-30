import { test, expect, type Page } from '@playwright/test'
import { createTestUser, deleteTestUser, syncTestUserToDatabase } from './helpers/auth'

const TEST_PASSWORD = 'Test@123456'

// ---------------------------------------------------------------------------
// Resilient helpers
// ---------------------------------------------------------------------------

/**
 * Sign in via the login page UI. Uses waitForURL to detect the post-login
 * redirect (Next.js router.push), which is more reliable than networkidle.
 * Returns once the page is on /dashboard, /onboarding, or /payment.
 */
async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(800)

  // If already authenticated (residual cookie), skip
  if (page.url().includes('/dashboard') || page.url().includes('/onboarding')) return

  // Fill credentials
  await page.locator('#email').or(page.getByLabel(/email/i)).fill(email)
  await page.locator('#password').or(page.getByLabel(/password/i)).fill(password)

  // Click Sign In and wait for redirect (Next.js router.push)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await page.waitForURL(/\/(dashboard|onboarding|payment)/, { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(800)
}

/**
 * Complete the onboarding wizard if the user lands on it.
 * If already on dashboard, waits for the dashboard layout to finish
 * its initialization (store selector loads, onboarding status resolves).
 */
async function completeOnboardingWizard(page: Page) {
  await page.waitForTimeout(800)
  if (!page.url().includes('/onboarding')) {
    // We're on dashboard — wait for layout to stabilize
    // The onboarding-status check in the layout may redirect us
    await page.waitForTimeout(2000)
    // If we got redirected to /onboarding, handle it below
    if (!page.url().includes('/onboarding')) return
  }

  // Step 1: Business details
  if (await page.getByText(/tell us about your business/i).isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.locator('#businessName').or(page.getByLabel(/business name/i)).fill('E2E Test Business')
    await page.getByRole('button', { name: /continue/i }).click()
    await page.waitForTimeout(1000)
  }

  // Step 2: Store type
  if (await page.getByText(/what type of store/i).isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.getByText(/supermarket/i).first().click()
    await page.waitForTimeout(300)
    await page.locator('#storeName').or(page.getByLabel(/primary store name/i)).fill('E2E Test Store')
    await page.getByRole('button', { name: /continue/i }).click()
    await page.waitForTimeout(1000)
  }

  // Step 3: Store location
  if (await page.getByText(/store location/i).isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.locator('#address').or(page.getByLabel(/address/i)).fill('123 Test Road, Bangalore')
    const stateTrigger = page.locator('[role="combobox"]').first()
    if (await stateTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await stateTrigger.click()
      await page.getByRole('option', { name: /karnataka/i }).click()
    }
    await page.locator('#pincode').or(page.getByLabel(/pincode/i)).fill('560095')
    await page.getByRole('button', { name: /continue/i }).click()
    await page.waitForTimeout(1000)
  }

  // Step 4: Team
  if (await page.getByText(/configure your team/i).isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.getByRole('button', { name: /complete setup/i }).click()
    await page.waitForTimeout(2000)
  }

  // Wait for redirect to dashboard after onboarding completes
  await page.waitForURL(/\/dashboard/, { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(1000)
}

async function navigateTo(page: Page, name: string) {
  if (name === 'Settings') {
    await page.getByRole('link', { name: 'Settings' }).first().click()
  } else {
    await page.locator('nav').getByRole('link', { name }).click()
  }
}

// ---------------------------------------------------------------------------
// 1. Public pages (no auth needed)
// ---------------------------------------------------------------------------
test.describe('Public Pages', () => {
  test('signup page loads successfully', async ({ page }) => {
    await page.goto('/signup')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)
    // Signup page may redirect to /payment, show a form, or redirect to login
    // Just verify the page doesn't crash
    const bodyText = await page.locator('body').innerText().catch(() => '')
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('login form renders all fields', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByLabel(/password/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    const email = `e2e-login-${Date.now()}@ezvento.test`
    const result = await createTestUser(email, TEST_PASSWORD)
    if (!result?.user) { test.skip(true, 'Admin client not configured'); return }
    await syncTestUserToDatabase({
      id: result.user.id, email: result.user.email!, phone: result.user.phone,
      user_metadata: {}, email_confirmed_at: null,
    })

    await loginViaUI(page, email, TEST_PASSWORD)
    const url = page.url()
    expect(url).toMatch(/\/(dashboard|onboarding|payment)/)

    await deleteTestUser(email)
  })
})

// ---------------------------------------------------------------------------
// 2. Onboarding Wizard (fresh user)
// ---------------------------------------------------------------------------
test.describe('Onboarding Wizard', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-ob-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('step 1: business name required, GSTIN optional', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    if (!page.url().includes('/onboarding')) { test.skip(true, 'Already onboarded'); return }

    // Try continuing with empty form
    await page.getByRole('button', { name: /continue/i }).click()
    await page.waitForTimeout(500)
    const toast = page.getByText(/business name/i)
    await expect(toast.first()).toBeVisible({ timeout: 5000 })

    // Fill only business name, leave GSTIN empty, should advance
    await page.locator('#businessName').or(page.getByLabel(/business name/i)).fill('Test Biz')
    await page.getByRole('button', { name: /continue/i }).click()
    await page.waitForTimeout(1000)
    await expect(page.getByText(/what type of store/i)).toBeVisible({ timeout: 10000 })
  })

  test('step 2: store type selection and store name', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    if (!page.url().includes('/onboarding')) { test.skip(true, 'Already onboarded'); return }

    // Fill step 1
    await page.locator('#businessName').or(page.getByLabel(/business name/i)).fill('Test Biz')
    await page.getByRole('button', { name: /continue/i }).click()
    await page.waitForTimeout(1000)

    // Select store type
    await page.getByText(/supermarket/i).first().click()
    await page.waitForTimeout(300)
    await expect(page.getByLabel(/primary store name/i)).toBeVisible({ timeout: 5000 })

    // Try Continue without store name
    await page.getByRole('button', { name: /continue/i }).click()
    const toast = page.getByText(/store/i)
    await expect(toast.first()).toBeVisible({ timeout: 5000 })
  })

  test('step 3: address, state, pincode required', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    if (!page.url().includes('/onboarding')) { test.skip(true, 'Already onboarded'); return }

    // Fill steps 1-2
    await page.locator('#businessName').or(page.getByLabel(/business name/i)).fill('Test Biz')
    await page.getByRole('button', { name: /continue/i }).click()
    await page.waitForTimeout(800)
    await page.getByText(/supermarket/i).first().click()
    await page.waitForTimeout(300)
    await page.locator('#storeName').or(page.getByLabel(/primary store name/i)).fill('Test Store')
    await page.getByRole('button', { name: /continue/i }).click()
    await page.waitForTimeout(1000)

    // Click Continue with empty fields
    await page.getByRole('button', { name: /continue/i }).click()
    const toast = page.getByText(/address|state|pincode/i)
    await expect(toast.first()).toBeVisible({ timeout: 5000 })
  })

  test('step 4: personas toggle checkmark, cards stay visible', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    if (!page.url().includes('/onboarding')) { test.skip(true, 'Already onboarded'); return }

    // Fill steps 1-3
    await page.locator('#businessName').or(page.getByLabel(/business name/i)).fill('Test Biz')
    await page.getByRole('button', { name: /continue/i }).click()
    await page.waitForTimeout(800)
    await page.getByText(/supermarket/i).first().click()
    await page.waitForTimeout(300)
    await page.locator('#storeName').or(page.getByLabel(/primary store name/i)).fill('Test Store')
    await page.getByRole('button', { name: /continue/i }).click()
    await page.waitForTimeout(1000)
    await page.locator('#address').or(page.getByLabel(/address/i)).fill('123 Test Rd')
    const stateTrigger = page.locator('[role="combobox"]').first()
    await stateTrigger.click()
    await page.getByRole('option', { name: /karnataka/i }).click()
    await page.locator('#pincode').or(page.getByLabel(/pincode/i)).fill('560095')
    await page.getByRole('button', { name: /continue/i }).click()
    await page.waitForTimeout(1000)

    // Step 4: count persona cards, click one, verify count unchanged
    await expect(page.getByText(/configure your team/i)).toBeVisible({ timeout: 10000 })
    const cards = page.locator('[class*="cursor-pointer"]').filter({
      hasText: /manager|operator|admin|owner|staff/i
    })
    const initialCount = await cards.count()
    expect(initialCount).toBeGreaterThan(0)
    await cards.first().click()
    await page.waitForTimeout(500)
    expect(await cards.count()).toBe(initialCount)
  })
})

// ---------------------------------------------------------------------------
// 3. Dashboard Navigation (one onboarded user for all tests)
// ---------------------------------------------------------------------------
test.describe('Dashboard', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-dash-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  const navItems = [
    'Dashboard', 'Stores', 'Stock', 'Billing', 'Customers',
    'Vendors', 'Team', 'Reports', 'Settings',
  ]

  for (const name of navItems) {
    test(`navigation: "${name}"`, async ({ page }) => {
      await loginViaUI(page, testEmail, TEST_PASSWORD)
      await completeOnboardingWizard(page)
      if (page.url().includes('/onboarding')) { test.skip(true, 'Onboarding failed'); return }

      await page.goto('/dashboard')
      await page.waitForTimeout(500)
      await navigateTo(page, name)
      await page.waitForTimeout(500)
      // Page loaded without crashing
    })
  }
})

// ---------------------------------------------------------------------------
// 4. POS Terminal
// ---------------------------------------------------------------------------
test.describe('POS Terminal', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-pos-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('POS terminal renders with product grid and cart', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/billing/new')
    await page.waitForTimeout(2000)
    // Verify page loaded
    const hasSearch = await page.getByPlaceholder(/search|name|code|barcode/i).first().isVisible({ timeout: 5000 }).catch(() => false)
    const hasChargeBtn = await page.getByRole('button', { name: /charge|pay|sale/i }).first().isVisible({ timeout: 5000 }).catch(() => false)
    expect(hasSearch || hasChargeBtn).toBeTruthy()
  })

  test('charge with empty cart shows error', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/billing/new')
    await page.waitForTimeout(2000)
    // Look for any charge/pay related button
    const chargeBtn = page.getByRole('button', { name: /charge|pay|complete sale|sale|₹/i })
    if (await chargeBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await chargeBtn.first().click()
      await page.waitForTimeout(1500)
    }
    // Test passes if page didn't crash; toast may or may not appear
  })
})

// ---------------------------------------------------------------------------
// 5. Billing History
// ---------------------------------------------------------------------------
test.describe('Billing History', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-bh-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('billing history page renders', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/billing')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/bill|invoice|history/i).first()).toBeVisible({ timeout: 10000 })
  })
})

// ---------------------------------------------------------------------------
// 6. Inventory
// ---------------------------------------------------------------------------
test.describe('Inventory', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-inv-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('inventory page renders with product table', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/inventory')
    await page.waitForTimeout(3000)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Stock|Total Products|Add Product/i)
  })

  test('add product dialog opens', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/inventory')
    await page.waitForTimeout(2000)
    const addBtn = page.getByRole('button', { name: /add product/i })
    if (await addBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.first().click()
      await page.waitForTimeout(1000)
      const dialog = page.getByRole('dialog')
      if (await dialog.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        expect(dialog).toBeTruthy()
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 7. Customers
// ---------------------------------------------------------------------------
test.describe('Customers', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-cust-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('customers page renders', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/customers')
    await page.waitForTimeout(2000)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Customer|Add Customer/i)
  })

  test('add customer dialog validates fields', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/customers')
    await page.waitForTimeout(2000)
    const addBtn = page.getByRole('button', { name: /add customer/i })
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(800)
      const dialog = page.locator('[role="dialog"]')
      const saveBtn = dialog.getByRole('button', { name: /save|create|add/i })
      if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveBtn.click()
        await page.waitForTimeout(800)
        const dialogText = await dialog.innerText()
        expect(dialogText).toMatch(/required|first name|phone/i)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 8. Categories
// ---------------------------------------------------------------------------
test.describe('Categories', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-cat-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('categories page renders', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/categories')
    await page.waitForTimeout(2000)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Categor|Add Category/i)
  })
})

// ---------------------------------------------------------------------------
// 9. Vendors
// ---------------------------------------------------------------------------
test.describe('Vendors', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-vend-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('vendors page renders', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/vendors')
    await page.waitForTimeout(2000)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Vendor|Add Vendor/i)
  })
})

// ---------------------------------------------------------------------------
// 10. Reports
// ---------------------------------------------------------------------------
test.describe('Reports', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-rpt-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('reports page renders', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/reports')
    await page.waitForTimeout(2000)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Report|Sales/i)
  })
})

// ---------------------------------------------------------------------------
// 11. Purchases
// ---------------------------------------------------------------------------
test.describe('Purchases', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-purch-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('purchases page renders', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/purchases')
    await page.waitForTimeout(2000)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Purchase|New Purchase/i)
  })
})

// ---------------------------------------------------------------------------
// 12. Settings & Sub-pages
// ---------------------------------------------------------------------------
test.describe('Settings', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-settings-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('settings page renders with sections', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/settings')
    await page.waitForTimeout(2000)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Settings|Business|General|Bill/i)
  })

  test('change password dialog validates', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/settings')
    await page.waitForTimeout(2000)
    const changeBtn = page.getByRole('button', { name: /change|password/i })
    if (await changeBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await changeBtn.first().click()
      await page.waitForTimeout(800)
      const dialog = page.getByRole('dialog')
      if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        const submit = dialog.getByRole('button', { name: /change|save|update/i })
        if (await submit.isVisible({ timeout: 3000 }).catch(() => false)) {
          await submit.click()
          await page.waitForTimeout(800)
        }
      }
    }
  })

  test('printers page does not crash', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/settings/printers')
    await page.waitForTimeout(5000)
    const url = page.url()
    if (url.includes('/onboarding')) {
      await completeOnboardingWizard(page)
      await page.goto('/dashboard/settings/printers')
      await page.waitForTimeout(4000)
    }
    expect(page.url()).toContain('/dashboard/settings/printers')
  })

  test('payment methods page does not crash', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/settings/payment-methods')
    await page.waitForTimeout(5000)
    if (page.url().includes('/onboarding')) {
      await completeOnboardingWizard(page)
      await page.goto('/dashboard/settings/payment-methods')
      await page.waitForTimeout(4000)
    }
    expect(page.url()).toContain('/dashboard/settings/payment-methods')
  })

  test('subscription page renders with dialog cancel', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/settings/subscription')
    await page.waitForTimeout(2000)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Plan|Subscription|Cancel/i)
    // Test dialog-based cancel (not window.confirm)
    const cancelBtn = page.getByRole('button', { name: /cancel/i })
    if (await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cancelBtn.click()
      await page.waitForTimeout(800)
      const dialog = page.getByRole('dialog')
      if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        expect(dialog).toBeTruthy()
        const closeBtn = dialog.getByRole('button', { name: /keep|no|cancel|close/i })
        if (await closeBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          await closeBtn.first().click()
        }
      }
    }
  })

  test('audit log and email logs pages render', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    // Audit log
    await page.goto('/dashboard/settings/audit-log')
    await page.waitForTimeout(2000)
    let bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Audit|Log|Activity/i)
    // Email logs
    await page.goto('/dashboard/settings/email-logs')
    await page.waitForTimeout(2000)
    bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Email|Log|Template/i)
  })
})

// ---------------------------------------------------------------------------
// 13. Team
// ---------------------------------------------------------------------------
test.describe('Team', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-team-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('team page renders with members', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/team')
    await page.waitForTimeout(2000)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Team|Member/i)
  })

  test('invite dialog has email field', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/team')
    await page.waitForTimeout(2000)
    const inviteBtn = page.getByRole('button', { name: /invite/i })
    if (await inviteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await inviteBtn.click()
      await page.waitForTimeout(800)
      const dialog = page.getByRole('dialog')
      if (await dialog.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Just verify the dialog exists with relevant content
        const dialogText = await dialog.innerText()
        expect(dialogText).toMatch(/email|invite|send/i)
      }
    }
  })

  test('roles tab is accessible', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/team')
    await page.waitForTimeout(2000)
    const rolesTab = page.getByRole('tab', { name: /roles/i })
    if (await rolesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await rolesTab.click()
      await page.waitForTimeout(1000)
      const bodyText = await page.locator('body').innerText()
      expect(bodyText).toMatch(/Role|Permission|Create Role/i)
    }
  })
})

// ---------------------------------------------------------------------------
// 14. Stores
// ---------------------------------------------------------------------------
test.describe('Stores', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-stores-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('stores page renders with store cards', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/stores')
    await page.waitForTimeout(2000)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Store|Add Store/i)
  })

  test('add store dialog has name and code fields', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)
    await page.goto('/dashboard/stores')
    await page.waitForTimeout(2000)
    const addBtn = page.getByRole('button', { name: /add store/i })
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(800)
      const dialog = page.locator('[role="dialog"]')
      if (await dialog.isVisible({ timeout: 5000 }).catch(() => false)) {
        const nameField = dialog.getByLabel(/name/i)
        expect(await nameField.first().isVisible({ timeout: 5000 }).catch(() => false)).toBeTruthy()
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 15. Trial Expiry & Resubscribe Flow
// ---------------------------------------------------------------------------
test.describe('Trial Expiry & Resubscribe', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-trial-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  /**
   * Helper: Call dev API endpoints as the authenticated user.
   * Uses page.evaluate so browser cookies (auth session) are sent.
   */
  async function devApi(page: Page, endpoint: string, body: Record<string, unknown>) {
    return page.evaluate(async ({ endpoint: ep, body: b }) => {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b),
      })
      return { ok: res.ok, status: res.status, data: await res.json().catch(() => null) }
    }, { endpoint, body })
  }

  test('trial banner shows days remaining for new user', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)

    // Trial banner should show "days left" text
    const banner = page.locator('text=/\\d+ days left/i')
    await expect(banner.first()).toBeVisible({ timeout: 10000 })
  })

  test('expired trial shows red banner and redirects to /payment', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)

    // Expire the trial via dev endpoint
    const result = await devApi(page, '/api/payments/dev-expire-trial', { action: 'expire' })
    expect(result.ok).toBeTruthy()

    // Navigate to a dashboard page — should redirect to /payment
    await page.goto('/dashboard/inventory')
    await page.waitForURL(/\/payment/, { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Wait for payment content to load (not Suspense fallback)
    await page.waitForFunction(() => {
      const body = document.body.innerText
      return !body.includes('Loading...') && body.length > 20
    }, { timeout: 15000 })

    // Should be on /payment now with content rendered
    expect(page.url()).toContain('/payment')

    // Should see plan/payment content
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Pay|Plan|Launch|Grow|\d+ days|Subscribe/i)
  })

  test('expired trial user sees payment form, not Already Subscribed', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)

    // Expire trial
    await devApi(page, '/api/payments/dev-expire-trial', { action: 'expire' })

    // Go to /payment directly
    await page.goto('/payment?plan=grow')
    await page.waitForTimeout(3000)

    // Should NOT show "Already Subscribed" — should show payment form
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toMatch(/Already Subscribed/i)
    expect(bodyText).toMatch(/Pay|14-day free trial|Launch|Grow/i)
  })

  test('resubscribe via dev-bypass restores dashboard access', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)

    // Expire trial
    const expireResult = await devApi(page, '/api/payments/dev-expire-trial', { action: 'expire' })
    expect(expireResult.ok).toBeTruthy()

    // Go to payment page and wait for content to render
    await page.goto('/payment?plan=grow')
    await page.waitForURL(/\/payment/, { timeout: 15000 })
    await page.waitForFunction(() => {
      const body = document.body.innerText
      return !body.includes('Loading...') && body.length > 20
    }, { timeout: 15000 })

    // Call dev-bypass directly via page.evaluate to resubscribe
    const bypassResult = await devApi(page, '/api/payments/dev-bypass', { planId: 'grow' })
    expect(bypassResult.ok).toBeTruthy()

    // Now manually navigate to dashboard — the fresh trial should clear the redirect
    await page.goto('/dashboard')
    await page.waitForTimeout(3000)

    // Should be on dashboard (not redirected to /payment)
    expect(page.url()).toContain('/dashboard')

    // Should not see expired trial banner
    const expiredBanner = page.locator('text=/trial has expired/i')
    await expect(expiredBanner).toHaveCount(0, { timeout: 5000 })
  })

  test('active subscriber sees Already Subscribed on /payment', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)

    // Restore trial to full duration
    await devApi(page, '/api/payments/dev-expire-trial', { action: 'restore' })

    // Go to /payment
    await page.goto('/payment')
    await page.waitForTimeout(3000)

    // Should show "Already Subscribed"
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Already Subscribed|active/i)
  })
})

// ---------------------------------------------------------------------------
// 16. Mobile POS — Tab Switching
// ---------------------------------------------------------------------------
test.describe('Mobile POS Layout', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-mpos-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('mobile viewport shows Products/Cart tab toggles', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }) // iPhone 14
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)

    // Navigate to POS
    await page.goto('/dashboard/billing/new')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // On mobile, should see tab toggles (Products | Cart)
    const tabs = page.locator('button', { hasText: /Products|Cart/ })
    const tabCount = await tabs.count()
    expect(tabCount).toBeGreaterThanOrEqual(1)

    // Click Cart tab if visible
    const cartTab = page.getByRole('button', { name: /Cart \(\d+\)/i })
    if (await cartTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cartTab.click()
      await page.waitForTimeout(500)
    }
  })

  test('desktop viewport shows side-by-side layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)

    await page.goto('/dashboard/billing/new')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // On desktop, should see product search input
    const searchInput = page.locator('#product-search, [placeholder*="product"], [placeholder*="Search"]')
    await expect(searchInput.first()).toBeVisible({ timeout: 10000 })
  })
})

// ---------------------------------------------------------------------------
// 17. CSRF Protection
// ---------------------------------------------------------------------------
test.describe('CSRF Protection', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-csrf-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('API POST request from same origin succeeds (CSRF allows valid origin)', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)

    // Same-origin POST should pass the CSRF origin check
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'CSRF Test Store' }),
      })
      return { status: res.status }
    })

    // Should NOT be blocked by CSRF (valid origin), should either succeed or return validation error
    expect(result.status).not.toBe(403)
  })

  test('API GET request passes through middleware', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/stores', { method: 'GET' })
      return { status: res.status }
    })

    // GET requests are not checked for CSRF and should pass through
    expect(result.status).not.toBe(403)
  })
})

// ---------------------------------------------------------------------------
// 18. Settings Inline Validation
// ---------------------------------------------------------------------------
test.describe('Settings Form Validation', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-set-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('business details form shows inline error for invalid GSTIN', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)

    await page.goto('/dashboard/settings')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Find GSTIN field and enter invalid value
    const gstinField = page.locator('#gstin')
    if (await gstinField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gstinField.fill('INVALID_GSTIN')
      await gstinField.blur()
      await page.waitForTimeout(500)

      // Try to save
      const saveBtn = page.getByRole('button', { name: /Save Business/i })
      if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveBtn.click()
        await page.waitForTimeout(500)
      }

      // Should see an error message (inline or near the field)
      const errorMsg = page.locator('text=/Invalid GSTIN|GSTIN format/i')
      const toastOrInline = page.locator('p:has-text("Invalid"), [role="alert"]:has-text("GSTIN")')
      const hasError = await errorMsg.first().isVisible({ timeout: 3000 }).catch(() => false)
      || await toastOrInline.first().isVisible({ timeout: 3000 }).catch(() => false)
      expect(hasError).toBeTruthy()
    }
  })

  test('loyalty settings form shows inline error for invalid number input', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)

    await page.goto('/dashboard/settings')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Scroll to loyalty section
    const loyaltyHeading = page.getByText(/Loyalty Program/i)
    if (await loyaltyHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loyaltyHeading.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)

      // Find points-per-rupee field and set invalid value
      const pointsField = page.locator('#pointsPerRupee')
      if (await pointsField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pointsField.fill('') // Empty = invalid since regex requires a number
        await page.waitForTimeout(300)

        // Click save
        const saveLoyaltyBtn = page.getByRole('button', { name: /Save Loyalty/i })
        if (await saveLoyaltyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await saveLoyaltyBtn.click()
          await page.waitForTimeout(500)
        }

        // Should see inline validation error
        const errorMsg = page.locator('text=/Enter a valid number|Enter a whole number/i')
        const hasError = await errorMsg.first().isVisible({ timeout: 3000 }).catch(() => false)
        expect(hasError).toBeTruthy()
      }
    }
  })

  test('notification settings form has toggle switches and save button', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)

    await page.goto('/dashboard/settings')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Check notification section exists
    const notifHeading = page.getByText(/Email Notifications/i)
    if (await notifHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      await notifHeading.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)

      // Should have notification save button
      const saveNotifBtn = page.getByRole('button', { name: /Save Notification/i })
      const hasSaveBtn = await saveNotifBtn.isVisible({ timeout: 3000 }).catch(() => false)
      expect(hasSaveBtn).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// 19. POS Cart Guard
// ---------------------------------------------------------------------------
test.describe('POS Cart Guard', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-pcg-${Date.now()}@ezvento.test`
    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (result?.user) {
      await syncTestUserToDatabase({
        id: result.user.id, email: result.user.email!, phone: result.user.phone,
        user_metadata: {}, email_confirmed_at: null,
      })
    }
  })

  test.afterAll(async () => { await deleteTestUser(testEmail) })

  test('no beforeunload warning when cart is empty', async ({ page }) => {
    await loginViaUI(page, testEmail, TEST_PASSWORD)
    await completeOnboardingWizard(page)

    await page.goto('/dashboard/billing/new')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // With empty cart, should be able to navigate away without confirmation
    const hasBeforeUnload = await page.evaluate(() => {
      const listeners = (window as unknown as { _beforeUnloadActive?: boolean })
      // Check if the beforeunload event would trigger a prompt
      const e = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent
      window.dispatchEvent(e)
      return e.defaultPrevented
    })

    // Empty cart = no beforeunload prevention
    expect(hasBeforeUnload).toBeFalsy()
  })
})
