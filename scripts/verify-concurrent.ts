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
    console.log('Skipping - not on dashboard');
    await browser.close();
    return;
  }
  console.log('Logged in, testing concurrent billing...');

  const storeId = 'cmok5r0u80002et7glxtw3fum';
  const products = [
    { id: 'cmok5smdo0031et7geapacakr', name: 'Allen Solly Regular Fit Shirt - XL', price: 1083, gst: 12 },
    { id: 'cmok5snsh0033et7garftj2m0', name: 'Van Heusen Regular Fit Shirt - 2XL', price: 2074, gst: 12 },
    { id: 'cmok5sp0800035et7gg609de8v', name: 'Louis Philippe Regular Fit Shirt - 2XL', price: 3586, gst: 12 },
    { id: 'cmok5sq7y0037et7gayrxbt94', name: 'Raymond Regular Fit Shirt - 3XL', price: 572, gst: 5 },
  ];

  function buildPayload(productIdx: number) {
    const p = products[productIdx % products.length];
    const qty = 1;
    const gstAmount = Math.round(p.price * qty * p.gst / 100);
    const totalAmount = p.price * qty + gstAmount;
    return {
      storeId,
      items: [{ productId: p.id, name: p.name, quantity: qty, unitPrice: p.price, gstRate: p.gst, gstAmount, totalAmount }],
      subtotal: p.price,
      totalGst: gstAmount,
      totalAmount,
      amountPaid: totalAmount,
      billingType: 'CASH',
      payments: [{ amount: totalAmount, method: 'CASH' }],
    };
  }

  // Fire 4 concurrent billing requests
  const start = Date.now();
  const results = await Promise.all(
    [0, 1, 2, 3].map(async (i) => {
      const t0 = Date.now();
      const res = await page.request.post('http://localhost:3003/api/billing', {
        headers: { 'Content-Type': 'application/json' },
        data: buildPayload(i),
      });
      const latency = Date.now() - t0;
      const body = await res.text();
      return { idx: i, status: res.status(), latency, body: body.substring(0, 150) };
    })
  );

  const totalTime = Date.now() - start;
  console.log(`\nConcurrent test completed in ${totalTime}ms\n`);
  for (const r of results) {
    const emoji = r.status === 201 ? 'OK' : 'FAIL';
    console.log(`  [${emoji}] req ${r.idx} status=${r.status} latency=${r.latency}ms`);
  }

  const allOk = results.every(r => r.status === 201);
  console.log(`\n${allOk ? 'ALL PASSED' : 'SOME FAILED'} — ${results.filter(r => r.status === 201).length}/${results.length} OK`);

  await browser.close();
})();
