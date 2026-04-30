import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:3003/login');
  await page.getByLabel(/email/i).fill('superstore@ezvento.in');
  await page.getByLabel(/password/i).fill('Test@123456');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|onboarding|payment)/, { timeout: 30000 });

  const url = page.url();
  if (url.includes('/onboarding') || url.includes('/payment')) {
    console.log('Skipping - not on dashboard:', url);
    await browser.close();
    return;
  }

  const storeId = 'cmok5r2ch000aet7gofwebfe7'; // City Plaza (medium)

  async function postBill(productId: string, label: string) {
    const payload = {
      storeId,
      items: [{ productId, name: 'Test Product', quantity: 1, unitPrice: 50, gstRate: 12, gstAmount: 6, totalAmount: 56 }],
      subtotal: 50, totalGst: 6, totalAmount: 56, amountPaid: 56,
      billingType: 'CASH', payments: [{ amount: 56, method: 'CASH' }],
    };
    const t0 = Date.now();
    try {
      const res = await page.request.post('http://localhost:3003/api/billing', {
        headers: { 'Content-Type': 'application/json' },
        data: payload,
        timeout: 30000,
      });
      const lat = Date.now() - t0;
      const body = await res.text();
      console.log(label + ': status=' + res.status() + ' latency=' + lat + 'ms');
      if (res.status() >= 400) console.log('  Error: ' + body.substring(0, 300));
    } catch (e) {
      console.log(label + ': FAILED latency=' + (Date.now() - t0) + 'ms ' + String(e).substring(0, 200));
    }
  }

  // 3 concurrent posts to same store (tests advisory lock serialization)
  console.log('Running 3 concurrent posts to same store...');
  await Promise.all([
    postBill('cmok5stv0003det7glvkmglpb', 'req-1'), // Louis Philippe Slim Fit
    postBill('cmok5sv2p003fet7gng7lk4na', 'req-2'), // Zara Slim Fit
    postBill('cmok5sq7y0037et7gayrxbt94', 'req-3'), // Raymond Regular Fit
  ]);

  await browser.close();
})();
