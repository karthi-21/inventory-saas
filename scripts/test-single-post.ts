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
  console.log('Logged in. Testing single POST...');

  const storeId = 'cmok5r0u80002et7glxtw3fum';
  const payload = {
    storeId,
    items: [{ productId: 'cmok5smdo0031et7geapacakr', name: 'Test Shirt', quantity: 1, unitPrice: 100, gstRate: 5, gstAmount: 5, totalAmount: 105 }],
    subtotal: 100, totalGst: 5, totalAmount: 105, amountPaid: 105,
    billingType: 'CASH', payments: [{ amount: 105, method: 'CASH' }],
  };

  const t0 = Date.now();
  const res = await page.request.post('http://localhost:3003/api/billing', {
    headers: { 'Content-Type': 'application/json' },
    data: payload,
    timeout: 15000,
  });
  const latency = Date.now() - t0;
  const body = await res.text();
  console.log(`Status: ${res.status()}, Latency: ${latency}ms`);
  console.log('Body:', body.substring(0, 300));

  await browser.close();
})();
