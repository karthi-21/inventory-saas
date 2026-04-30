import { test, expect } from '@playwright/test'

test.describe('Stress Test Diagnostics', () => {
  test.setTimeout(30000)

  test('diag: test evaluate fetch vs page.request', async ({ page }) => {
    const testEmail = 'superstore@ezvento.in'
    const testPassword = 'Test@123456'

    await page.goto('/login')
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 })
    await page.getByLabel(/email/i).fill(testEmail)
    await page.getByLabel(/password/i).fill(testPassword)
    await page.getByRole('button', { name: /sign in/i }).click()

    try {
      await page.waitForURL(/\/(dashboard|onboarding|payment)/, { timeout: 20000 })
    } catch {
      console.warn('Could not reach dashboard — skipping')
      test.skip()
      return
    }

    const url = page.url()
    if (url.includes('/onboarding') || url.includes('/payment')) {
      console.warn('Landed on onboarding/payment — skipping')
      test.skip()
      return
    }

    const storeId = 'cmok5r0u80002et7glxtw3fum'

    // Test 1: page.evaluate with fetch()
    console.log('\n--- Test 1: page.evaluate fetch() ---')
    const evalResult = await page.evaluate(async (sid: string) => {
      const payload = {
        storeId: sid,
        items: [{
          productId: 'cloth-001',
          name: 'Cotton T-Shirt',
          quantity: 1,
          unitPrice: 499,
          gstRate: 5,
          gstAmount: 25,
          totalAmount: 524,
        }],
        subtotal: 499,
        totalGst: 25,
        totalAmount: 524,
        amountPaid: 524,
        billingType: 'CASH',
        payments: [{ amount: 524, method: 'CASH' }],
      }

      const start = performance.now()
      let status = 0
      let errorMsg = ''
      try {
        const res = await fetch('/api/billing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        status = res.status
        const text = await res.text()
        console.log('EVALUATE-FETCH: status=' + status + ' body=' + text.substring(0, 200))
      } catch (e) {
        errorMsg = String(e)
        console.log('EVALUATE-FETCH-ERROR: ' + errorMsg)
      }
      const latency = Math.round(performance.now() - start)
      return { status, latency, errorMsg }
    }, storeId)

    console.log('evaluate result:', evalResult)

    // Test 2: page.request.post()
    console.log('\n--- Test 2: page.request.post() ---')
    const start2 = Date.now()
    let reqStatus = 0
    let reqError = ''
    try {
      const res = await page.request.post('/api/billing', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          storeId,
          items: [{
            productId: 'cloth-001', name: 'Cotton T-Shirt', quantity: 1,
            unitPrice: 499, gstRate: 5, gstAmount: 25, totalAmount: 524,
          }],
          subtotal: 499, totalGst: 25, totalAmount: 524,
          amountPaid: 524, billingType: 'CASH',
          payments: [{ amount: 524, method: 'CASH' }],
        },
      })
      reqStatus = res.status()
      const body = await res.text()
      console.log('PAGE-REQUEST: status=' + reqStatus + ' body=' + body.substring(0, 200))
    } catch (e) {
      reqError = String(e)
      console.log('PAGE-REQUEST-ERROR: ' + reqError)
    }
    const latency2 = Date.now() - start2
    console.log('page.request result: status=' + reqStatus + ' latency=' + latency2 + 'ms error=' + reqError)

    // At minimum, evaluate fetch should give us something (even 401/400)
    expect(evalResult.status).toBeGreaterThan(0)
    console.log('Diagnostic complete!')
  })
})
