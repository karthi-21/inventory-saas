import { test, expect } from '@playwright/test'
import { createTestUser, deleteTestUser, syncTestUserToDatabase } from './helpers/auth'

const TEST_PASSWORD = 'Test@123456'

test.describe('Ezvento Full Demo Flow', () => {
  let testEmail: string

  test.beforeAll(async () => {
    testEmail = `e2e-demo-${Date.now()}@ezvento.test`

    const result = await createTestUser(testEmail, TEST_PASSWORD)
    if (!result?.user) throw new Error('Failed to create test user')
    const { user } = result

    await syncTestUserToDatabase(
      {
        id: user.id,
        email: user.email!,
        phone: user.phone,
        user_metadata: user.user_metadata || {},
        email_confirmed_at: user.email_confirmed_at || null,
      },
      'grow'
    )
  })

  test.afterAll(async () => {
    await deleteTestUser(testEmail)
  })

  test('Complete SaaS demo flow', async ({ page }) => {
    // ─── LOGIN ────────────────────────────────────────────
    await page.goto('/login')
    await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 10000 })

    await page.fill('#email', testEmail)
    await page.fill('#password', TEST_PASSWORD)
    await page.click('button[type="submit"]')

    // Wait for initial redirect to settle
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(500)

    // ─── ONBOARDING ───────────────────────────────────────
    if (page.url().includes('/onboarding')) {
      // Step 1: Business
      await expect(page.getByText('Tell us about your business')).toBeVisible({ timeout: 5000 })
      await page.fill('#businessName', 'Demo Supermarket')
      await page.fill('#gstin', '27AABCU9603R1ZM')
      await page.fill('#pan', 'AABCU9603R')
      // The email field here is the business email, defaulted from user
      await page.fill('#phone', '9876543210')
      await page.getByRole('button', { name: 'Continue' }).click()

      // Step 2: Store type
      await expect(page.getByText('What type of store is this?')).toBeVisible({ timeout: 5000 })
      await page.getByText('Supermarket').first().click()
      await page.waitForTimeout(300)
      await page.fill('#storeName', 'Demo Store - Koramangala')
      await page.getByRole('button', { name: 'Continue' }).click()

      // Step 3: Location
      await expect(page.getByText('Store Location')).toBeVisible({ timeout: 5000 })
      await page.fill('#address', '123, 5th Block, Koramangala')
      await page.fill('#pincode', '560095')
      // Click Radix select trigger for State
      const stateTrigger = page.getByRole('combobox').first()
      await stateTrigger.click()
      await page.getByRole('option', { name: 'Karnataka' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()

      // Step 4: Team
      await expect(page.getByText('Configure Your Team')).toBeVisible({ timeout: 5000 })
      await page.getByRole('button', { name: 'Complete Setup' }).click()

      // Success screen
      await expect(page.getByText("You're all set!")).toBeVisible({ timeout: 10000 })
      await page.getByRole('button', { name: 'Go to Dashboard' }).click()
      await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    }

    // ─── DASHBOARD ────────────────────────────────────────
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)

    // ─── NAVIGATE THROUGH ALL SECTIONS ────────────────────
    const navItems: { name: string; urlPattern: RegExp }[] = [
      { name: 'Stores', urlPattern: /\/dashboard\/stores/ },
      { name: 'Stock', urlPattern: /\/dashboard\/inventory/ },
      { name: 'Billing', urlPattern: /\/dashboard\/billing/ },
      { name: 'Customers', urlPattern: /\/dashboard\/customers/ },
      { name: 'Vendors', urlPattern: /\/dashboard\/vendors/ },
      { name: 'Team', urlPattern: /\/dashboard\/team/ },
      { name: 'Reports', urlPattern: /\/dashboard\/reports/ },
      { name: 'Settings', urlPattern: /\/dashboard\/settings/ },
    ]

    for (const { name, urlPattern } of navItems) {
      // Settings is outside <nav> in the sidebar
      if (name === 'Settings') {
        await page.getByRole('link', { name: 'Settings' }).first().click()
      } else {
        await page.locator('nav').getByRole('link', { name }).click()
      }
      await page.waitForURL(urlPattern, { timeout: 10000 })
      await page.waitForTimeout(300)
    }

    // ─── RETURN TO DASHBOARD ──────────────────────────────
    await page.locator('nav').getByRole('link', { name: 'Dashboard' }).click()
    await page.waitForURL(/\/dashboard$/, { timeout: 10000 })

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 5000 })
  })
})
