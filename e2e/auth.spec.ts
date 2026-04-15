import { test, expect } from '@playwright/test'

// Test credentials — these should match the demo seed user
const TEST_EMAIL = 'demo@omnibiz.app'
const TEST_PASSWORD = 'Demo@123456'

test.describe('Authentication Flow', () => {
  test.describe('Login', () => {
    test('should show login page', async ({ page }) => {
      await page.goto('/login')

      // Should see email and password fields
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible()
    })

    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/email/i).fill(TEST_EMAIL)
      await page.getByLabel(/password/i).fill(TEST_PASSWORD)
      await page.getByRole('button', { name: /sign in|log in/i }).click()

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
    })

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/email/i).fill('wrong@example.com')
      await page.getByLabel(/password/i).fill('wrongpassword')
      await page.getByRole('button', { name: /sign in|log in/i }).click()

      // Should show error message
      await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      // Clear any existing auth state
      await page.goto('/dashboard')

      // Should redirect to login
      await expect(page).toHaveURL(/\/(login|auth)/, { timeout: 10000 })
    })

    test('should allow access after login', async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(TEST_EMAIL)
      await page.getByLabel(/password/i).fill(TEST_PASSWORD)
      await page.getByRole('button', { name: /sign in|log in/i }).click()
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

      // Now navigate to a protected page
      await page.goto('/dashboard/customers')
      await expect(page).toHaveURL(/\/dashboard\/customers/)
    })
  })

  test.describe('Logout', () => {
    test('should logout and redirect to login', async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.getByLabel(/email/i).fill(TEST_EMAIL)
      await page.getByLabel(/password/i).fill(TEST_PASSWORD)
      await page.getByRole('button', { name: /sign in|log in/i }).click()
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

      // Find and click logout button
      await page.getByRole('button', { name: /logout|sign out|log out/i }).click()

      // Should redirect to login or home
      await expect(page).toHaveURL(/\/(login|auth|\.$)/, { timeout: 10000 })
    })
  })

  test.describe('Signup', () => {
    test('should show signup page', async ({ page }) => {
      await page.goto('/signup')

      // Should have form fields
      await expect(page.getByLabel(/name|full name/i).first()).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
    })

    test('should navigate from login to signup', async ({ page }) => {
      await page.goto('/login')

      // Click the signup link
      await page.getByRole('link', { name: /sign up|create account|register/i }).click()

      await expect(page).toHaveURL(/\/signup/)
    })
  })
})