import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:3003/login');
  await page.getByLabel(/email/i).fill('superstore@ezvento.in');
  await page.getByLabel(/password/i).fill('Test@123456');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|onboarding|payment)/, { timeout: 30000 });

  const url = page.url();
  console.log('Landed on:', url);

  if (url.includes('/onboarding') || url.includes('/payment')) {
    console.log('Skipping - not on dashboard');
    await browser.close();
    return;
  }

  // Hit billing API
  const storeId = 'cmok5r0u80002et7glxtw3fum';
  const payload = {
    storeId,
    items: [{
      productId: 'cmok5smdo0031et7geapacakr',
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
  };

  const res = await page.request.post('http://localhost:3003/api/billing', {
    headers: { 'Content-Type': 'application/json' },
    data: payload,
  });

  const body = await res.text();
  console.log('Status:', res.status());
  console.log('Full response body:', body);

  await browser.close();
})();
