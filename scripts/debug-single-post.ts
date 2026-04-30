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

  // Test 1: Clothing product - should work
  const storeId = 'cmok5r2ch000aet7gofwebfe7'; // medium store
  const payload = {
    storeId,
    items: [{ productId: 'cmok5smdo0031et7geapacakr', name: 'Test Shirt', quantity: 1, unitPrice: 100, gstRate: 12, gstAmount: 12, totalAmount: 112 }],
    subtotal: 100, totalGst: 12, totalAmount: 112, amountPaid: 112,
    billingType: 'CASH', payments: [{ amount: 112, method: 'CASH' }],
  };

  console.log('Testing single POST...');
  const t0 = Date.now();
  const res = await page.request.post('http://localhost:3003/api/billing', {
    headers: { 'Content-Type': 'application/json' },
    data: payload,
    timeout: 30000,
  });
  const latency = Date.now() - t0;
  const body = await res.text();
  console.log('Status:', res.status(), 'Latency:', latency + 'ms');
  console.log('Full body:', body.substring(0, 1000));

  await browser.close();
})();
