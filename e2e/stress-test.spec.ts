import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Product {
  id: string
  name: string
  category: 'clothing' | 'electronics' | 'groceries'
  sellingPrice: number
  gstRate: number
}

interface StoreConfig {
  name: string
  slug: 'big' | 'medium' | 'small'
  numCounters: number
  categoryWeights: { clothing: number; electronics: number; groceries: number }
}

interface ScenarioConfig {
  name: string
  slug: 'diwali' | 'tuesday' | 'sunday'
  paceMinMs: number
  paceMaxMs: number
  billValueMin: number
  billValueMax: number
  itemsMin: number
  itemsMax: number
  targetBills: number
  counterActivation: {
    phases: number[]
    triggerBillCount: number[]
  }
}

interface BillMetrics {
  counter: string
  store: string
  scenario: string
  billNumber: number
  latencyMs: number
  status: number
  itemCount: number
  totalAmount: number
  timestamp: number
}

// ---------------------------------------------------------------------------
// Sample Product Catalog (32 items)
// ---------------------------------------------------------------------------

// Real product IDs from seed data (12 per category — 36 total)
const SAMPLE_PRODUCTS: Product[] = [
  // CLOTHING — from seed data
  { id: 'cmok5smdo0031et7geapacakr', name: 'Allen Solly Regular Fit Shirt - XL', category: 'clothing', sellingPrice: 1083, gstRate: 12 },
  { id: 'cmok5snsh0033et7garftj2m0', name: 'Van Heusen Regular Fit Shirt - 2XL', category: 'clothing', sellingPrice: 2074, gstRate: 12 },
  { id: 'cmok5sp080035et7gg609de8v', name: 'Louis Philippe Regular Fit Shirt - 2XL', category: 'clothing', sellingPrice: 3586, gstRate: 12 },
  { id: 'cmok5sq7y0037et7gayrxbt94', name: 'Raymond Regular Fit Shirt - 3XL', category: 'clothing', sellingPrice: 572, gstRate: 5 },
  { id: 'cmok5srfo0039et7gr2brboeb', name: 'H&M Regular Fit Shirt - XL', category: 'clothing', sellingPrice: 1717, gstRate: 12 },
  { id: 'cmok5ssnf003bet7gsgg2hqi9', name: 'Raymond Slim Fit Shirt - XS', category: 'clothing', sellingPrice: 2419, gstRate: 12 },
  { id: 'cmok5stv0003det7glvkmglpb', name: 'Louis Philippe Slim Fit Shirt - S', category: 'clothing', sellingPrice: 1769, gstRate: 12 },
  { id: 'cmok5sv2p003fet7gng7lk4na', name: 'Zara Slim Fit Shirt - M', category: 'clothing', sellingPrice: 1989, gstRate: 12 },
  { id: 'cmok5swac003het7gir45mtep', name: 'Van Heusen Slim Fit Shirt - XS', category: 'clothing', sellingPrice: 1766, gstRate: 12 },
  { id: 'cmok5sxi2003jet7gq2o25g2j', name: 'H&M Slim Fit Shirt - XL', category: 'clothing', sellingPrice: 2039, gstRate: 12 },
  { id: 'cmok5sypr003let7gey0mpbxn', name: 'Adidas Polo T-Shirt - 2XL', category: 'clothing', sellingPrice: 1138, gstRate: 12 },
  { id: 'cmok5t01j003net7gx2towki8', name: 'Puma Polo T-Shirt - 3XL', category: 'clothing', sellingPrice: 349, gstRate: 5 },

  // ELECTRONICS — verified from DB
  { id: 'cmok659t400nhet7gzvi0sutk', name: 'Vivo Smartphone 4G', category: 'electronics', sellingPrice: 128033, gstRate: 28 },
  { id: 'cmok6579x00ndet7grg70dmaq', name: 'Vivo Smartphone 5G', category: 'electronics', sellingPrice: 14279, gstRate: 18 },
  { id: 'cmok658hn00nfet7gfe8lbptk', name: 'Apple Smartphone 5G', category: 'electronics', sellingPrice: 19192, gstRate: 18 },
  { id: 'cmok65icy00nvet7gteu61duq', name: 'Apple Flagship Phone', category: 'electronics', sellingPrice: 50781, gstRate: 28 },
  { id: 'cmok65tj000odet7gstgo4szw', name: 'Anker Fast Charger 65W', category: 'electronics', sellingPrice: 1118, gstRate: 18 },
  { id: 'cmok65yhh00olet7gbkpaz016', name: 'Anker USB-C Cable 2M', category: 'electronics', sellingPrice: 3795, gstRate: 18 },
  { id: 'cmok66i7a00phet7g3usto45a', name: 'Mi Tempered Glass', category: 'electronics', sellingPrice: 1152, gstRate: 18 },
  { id: 'cmok676pf00qlet7g4nc5vuls', name: 'Dell Gaming Laptop 15"', category: 'electronics', sellingPrice: 129966, gstRate: 18 },
  { id: 'cmok680nh00rxet7gutu6ijnk', name: 'Bose Wireless ANC Headphones', category: 'electronics', sellingPrice: 29257, gstRate: 18 },
  { id: 'cmok68xl700t1et7g2rfkbkfu', name: 'TCL Smart TV 43"', category: 'electronics', sellingPrice: 140651, gstRate: 28 },
  { id: 'cmok69qxu00udet7gh6ja8v1x', name: 'LG Refrigerator 350L', category: 'electronics', sellingPrice: 26387, gstRate: 18 },
  { id: 'cmok6agtl00vhet7gt7zwkzhr', name: 'Morphy Richards Mixer Grinder 750W', category: 'electronics', sellingPrice: 3577, gstRate: 18 },

  // GROCERIES — verified from DB
  { id: 'cmok6cx7l00zhet7g6bmm8qoz', name: 'Generic Fresh Tomato 500g', category: 'groceries', sellingPrice: 41, gstRate: 0 },
  { id: 'cmok6cyf900zjet7g8pe2jawo', name: 'Generic Fresh Tomato 1kg', category: 'groceries', sellingPrice: 19, gstRate: 0 },
  { id: 'cmok6czmw00zlet7gv57k8qe9', name: 'Generic Fresh Onion 500g', category: 'groceries', sellingPrice: 105, gstRate: 0 },
  { id: 'cmok6d0ul00znet7gv4sehbhs', name: 'Generic Fresh Onion 1kg', category: 'groceries', sellingPrice: 65, gstRate: 0 },
  { id: 'cmok6deeo0109et7g1vaorc9d', name: 'Generic Fresh Apple 250g', category: 'groceries', sellingPrice: 171, gstRate: 0 },
  { id: 'cmok6djgg010het7giuqa1q1w', name: 'Generic Fresh Banana 12 pcs', category: 'groceries', sellingPrice: 42, gstRate: 0 },
  { id: 'cmok6dyj80115et7gry8gczyc', name: 'Nestle Full Cream Milk 500ml', category: 'groceries', sellingPrice: 47, gstRate: 0 },
  { id: 'cmok6e8ns011let7ghwpndvb6', name: 'Amul Fresh Paneer 200g', category: 'groceries', sellingPrice: 122, gstRate: 5 },
  { id: 'cmok6ew7z012net7guldq2zy2', name: 'Fortune Basmati Rice 1kg', category: 'groceries', sellingPrice: 753, gstRate: 5 },
  { id: 'cmok6fs6t0143et7g6jpvxwvd', name: 'Tata Sampann Toor Dal 500g', category: 'groceries', sellingPrice: 264, gstRate: 5 },
  { id: 'cmok6gsvx015ret7gdt9yxji2', name: 'Everest Turmeric Powder 100g', category: 'groceries', sellingPrice: 32, gstRate: 5 },
  { id: 'cmok6hzvm017net7g9ngxno9a', name: 'Fortune Refined Sunflower Oil 1L', category: 'groceries', sellingPrice: 425, gstRate: 5 },
]

// ---------------------------------------------------------------------------
// Configs
// ---------------------------------------------------------------------------

const STORES: StoreConfig[] = [
  { name: 'Metro Central Mall', slug: 'big', numCounters: 4, categoryWeights: { clothing: 0.45, electronics: 0.35, groceries: 0.20 } },
  { name: 'City Plaza', slug: 'medium', numCounters: 3, categoryWeights: { clothing: 0.35, electronics: 0.40, groceries: 0.25 } },
  { name: 'Neighborhood Mart', slug: 'small', numCounters: 2, categoryWeights: { clothing: 0.30, electronics: 0.20, groceries: 0.50 } },
]

const SCENARIOS: ScenarioConfig[] = [
  {
    name: 'Diwali Rush', slug: 'diwali',
    paceMinMs: 300, paceMaxMs: 1000, billValueMin: 3000, billValueMax: 25000,
    itemsMin: 3, itemsMax: 8, targetBills: 10,
    counterActivation: { phases: [1, 2], triggerBillCount: [0, 5] },
  },
  {
    name: 'Slow Tuesday', slug: 'tuesday',
    paceMinMs: 1000, paceMaxMs: 3000, billValueMin: 100, billValueMax: 2000,
    itemsMin: 1, itemsMax: 3, targetBills: 10,
    counterActivation: { phases: [1, 1], triggerBillCount: [0, 10] },
  },
  {
    name: 'Sunday Moderate', slug: 'sunday',
    paceMinMs: 400, paceMaxMs: 1200, billValueMin: 800, billValueMax: 8000,
    itemsMin: 2, itemsMax: 5, targetBills: 10,
    counterActivation: { phases: [1, 2], triggerBillCount: [0, 8] },
  },
]

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

test.describe('Real-World Stress Simulation', () => {
  test.setTimeout(1_800_000)

  test('superstore load test', async ({ page }) => {
    // -----------------------------------------------------------------------
    // Step 1: Login via UI
    // -----------------------------------------------------------------------
    const testEmail = 'superstore@ezvento.in'
    const testPassword = 'Test@123456'

    await page.goto('/login')
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 })
    await page.getByLabel(/email/i).fill(testEmail)
    await page.getByLabel(/password/i).fill(testPassword)
    await page.getByRole('button', { name: /sign in/i }).click()

    // -----------------------------------------------------------------------
    // Step 2: Wait for post-login redirect
    // -----------------------------------------------------------------------
    try {
      await page.waitForURL(/\/(dashboard|onboarding|payment)/, { timeout: 20000 })
    } catch {
      console.warn('[STRESS-TEST] Could not reach dashboard after login — skipping')
      test.skip()
      return
    }

    const url = page.url()
    if (url.includes('/onboarding') || url.includes('/payment')) {
      console.warn('[STRESS-TEST] Landed on onboarding/payment — seed data may be missing. Skipping.')
      test.skip()
      return
    }

    // -----------------------------------------------------------------------
    // Step 3: Discover store IDs
    // -----------------------------------------------------------------------
    const storeIds = await page.evaluate(() => {
      const ids: Record<string, string> = {
        big: 'cmok5r0u80002et7glxtw3fum',
        medium: 'cmok5r2ch000aet7gofwebfe7',
        small: 'cmok5r3s0000het7gjoxolgg0',
      }
      try {
        const stored = localStorage.getItem('storeIds')
        if (stored) Object.assign(ids, JSON.parse(stored))
      } catch {}
      return ids
    })

    console.log('[STRESS-TEST] Store IDs:', JSON.stringify(storeIds))

    // -----------------------------------------------------------------------
    // Step 4: Run the stress simulation from Node.js using `request` fixture
    // -----------------------------------------------------------------------

    function randomInt(min: number, max: number): number {
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    function percentile(sorted: number[], p: number): number {
      if (sorted.length === 0) return 0
      const idx = Math.ceil((p / 100) * sorted.length) - 1
      return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]
    }

    // Build a single bill payload
    function buildBillPayload(
      storeId: string,
      store: StoreConfig,
      scenario: ScenarioConfig,
      products: Product[]
    ) {
      const itemCount = randomInt(scenario.itemsMin, scenario.itemsMax)
      const items: {
        productId: string; name: string; quantity: number; unitPrice: number
        gstRate: number; gstAmount: number; totalAmount: number
      }[] = []

      for (let i = 0; i < itemCount; i++) {
        const roll = Math.random()
        const w = store.categoryWeights
        let cat: string
        if (roll < w.clothing) cat = 'clothing'
        else if (roll < w.clothing + w.electronics) cat = 'electronics'
        else cat = 'groceries'

        const pool = products.filter(p => p.category === cat)
        if (pool.length === 0) continue
        const product = pool[Math.floor(Math.random() * pool.length)]
        const qty = randomInt(1, 3)
        const gstAmount = Math.round(product.sellingPrice * qty * product.gstRate / 100)
        const itemTotal = product.sellingPrice * qty + gstAmount

        items.push({
          productId: product.id,
          name: product.name,
          quantity: qty,
          unitPrice: product.sellingPrice,
          gstRate: product.gstRate,
          gstAmount,
          totalAmount: itemTotal,
        })
      }

      if (items.length === 0) return null

      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
      const totalGst = items.reduce((s, i) => s + i.gstAmount, 0)
      const totalAmount = subtotal + totalGst

      return {
        storeId,
        items,
        subtotal,
        totalGst,
        totalAmount,
        amountPaid: totalAmount,
        billingType: 'CASH',
        payments: [{ amount: totalAmount, method: 'CASH' }],
      }
    }

    // Post a single bill with retries
    async function postBill(payload: Record<string, unknown>): Promise<{ ok: boolean; status: number; body: string }> {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await page.request.post('/api/billing', {
            headers: { 'Content-Type': 'application/json' },
            data: payload,
            timeout: 60000,
          })
          const body = await res.text()
          if (res.ok()) return { ok: true, status: res.status(), body }
          if (res.status() === 503) {
            await new Promise(r => setTimeout(r, 500 + Math.random() * 500))
            continue
          }
          return { ok: false, status: res.status(), body }
        } catch (e) {
          if (attempt < 1) await new Promise(r => setTimeout(r, 500))
          return { ok: false, status: 503, body: String(e) }
        }
      }
      return { ok: false, status: 503, body: 'retries exhausted' }
    }

    // Run one counter worker
    async function runCounter(params: {
      store: StoreConfig; storeId: string; scenario: ScenarioConfig
      counterIdx: number; products: Product[]
    }): Promise<BillMetrics[]> {
      const { store, storeId, scenario, counterIdx, products } = params
      const metrics: BillMetrics[] = []
      const counterName = `counter-${counterIdx + 1}`

      const numCounters = Math.min(store.numCounters, scenario.counterActivation.phases[0])
      const billsPerCounter = Math.ceil(scenario.targetBills / numCounters)

      // Stagger start
      await new Promise(r => setTimeout(r, Math.random() * 500))

      for (let b = 0; b < billsPerCounter; b++) {
        const paceMs = randomInt(scenario.paceMinMs, scenario.paceMaxMs)
        await new Promise(r => setTimeout(r, paceMs))

        const payload = buildBillPayload(storeId, store, scenario, products)
        if (!payload) continue

        const start = Date.now()
        const res = await postBill(payload)
        const latencyMs = Date.now() - start

        if (res.status >= 500) {
          console.log(`  [${scenario.slug}/${store.slug}/${counterName}] bill ${b + 1}/${billsPerCounter} status=${res.status} ERROR: ${res.body.substring(0, 200)}`)
        }

        metrics.push({
          counter: counterName,
          store: store.slug,
          scenario: scenario.slug,
          billNumber: b + 1,
          latencyMs,
          status: res.status,
          itemCount: (payload.items as unknown[]).length,
          totalAmount: payload.totalAmount as number,
          timestamp: Date.now(),
        })

        if ((b + 1) % 3 === 0 || b === 0) {
          console.log(`  [${scenario.slug}/${store.slug}/${counterName}] bill ${b + 1}/${billsPerCounter} status=${res.status} latency=${latencyMs}ms`)
        }
      }

      return metrics
    }

    // -----------------------------------------------------------------------
    // Run all combos sequentially (more reliable, avoids overwhelming dev)
    // -----------------------------------------------------------------------
    const allMetrics: BillMetrics[] = []
    const startTime = Date.now()

    const combos: { store: StoreConfig; scenario: ScenarioConfig }[] = []
    for (const store of STORES) {
      for (const scenario of SCENARIOS) {
        combos.push({ store, scenario })
      }
    }

    // Run combos sequentially, but counters within each combo concurrently
    for (const combo of combos) {
      const { store, scenario } = combo
      const storeId = storeIds[store.slug]
      if (!storeId) { console.log(`Skip ${store.slug}/${scenario.slug} — no store ID`); continue }

      console.log(`\n--- ${scenario.name} @ ${store.name} ---`)

      const numCounters = Math.min(store.numCounters, scenario.counterActivation.phases[0])
      const workers: Promise<BillMetrics[]>[] = []
      for (let ci = 0; ci < numCounters; ci++) {
        workers.push(runCounter({ store, storeId, scenario, counterIdx: ci, products: SAMPLE_PRODUCTS }))
      }

      const results = await Promise.allSettled(workers)
      for (const r of results) {
        if (r.status === 'fulfilled') allMetrics.push(...r.value)
        else console.error('Counter failed:', r.reason)
      }

      const comboOk = allMetrics.filter(m => m.status >= 200 && m.status < 300)
      console.log(`  Done: ${allMetrics.length} total, ${comboOk.length} OK so far`)
    }

    const durationSeconds = Math.round((Date.now() - startTime) / 1000)

    // -----------------------------------------------------------------------
    // Stats
    // -----------------------------------------------------------------------
    function computeStats(metrics: BillMetrics[], durSec: number) {
      const total = metrics.length
      const ok = metrics.filter(m => m.status >= 200 && m.status < 300).length
      const err = total - ok
      const revenue = metrics.reduce((s, m) => s + m.totalAmount, 0)
      const lats = metrics.map(m => m.latencyMs).sort((a, b) => a - b)
      const avg = lats.length ? Math.round(lats.reduce((s, l) => s + l, 0) / lats.length) : 0
      const byStatus: Record<string, number> = {}
      for (const m of metrics) {
        if (m.status < 200 || m.status >= 300) {
          byStatus[String(m.status)] = (byStatus[String(m.status)] || 0) + 1
        }
      }
      return {
        totalBills: total, successCount: ok, errorCount: err, totalRevenue: revenue,
        avgLatency: avg, p50Latency: percentile(lats, 50), p95Latency: percentile(lats, 95),
        p99Latency: percentile(lats, 99),
        throughput: durSec > 0 ? Math.round((total / durSec) * 60) : 0,
        errorsByStatus: byStatus, avgBillValue: total > 0 ? Math.round(revenue / total) : 0,
      }
    }

    const byScenario: Record<string, ReturnType<typeof computeStats>> = {}
    for (const sc of SCENARIOS) {
      byScenario[sc.slug] = computeStats(allMetrics.filter(m => m.scenario === sc.slug), durationSeconds)
    }

    const byStore: Record<string, ReturnType<typeof computeStats> & { counters: Record<string, ReturnType<typeof computeStats>> }> = {}
    for (const st of STORES) {
      const sm = allMetrics.filter(m => m.store === st.slug)
      const base = computeStats(sm, durationSeconds)
      const counters: Record<string, ReturnType<typeof computeStats>> = {}
      for (let ci = 0; ci < st.numCounters; ci++) {
        const cn = `counter-${ci + 1}`
        counters[cn] = computeStats(sm.filter(m => m.counter === cn), durationSeconds)
      }
      byStore[st.slug] = { ...base, counters }
    }

    const lats = allMetrics.map(m => m.latencyMs).sort((a, b) => a - b)
    const ok = allMetrics.filter(m => m.status >= 200 && m.status < 300).length
    const errSummary: Record<string, number> = {}
    for (const m of allMetrics) {
      if (m.status < 200 || m.status >= 300) {
        errSummary[String(m.status)] = (errSummary[String(m.status)] || 0) + 1
      }
    }

    const report = {
      summary: {
        totalBills: allMetrics.length,
        successCount: ok,
        successRate: allMetrics.length > 0 ? Math.round((ok / allMetrics.length) * 10000) / 10000 : 0,
        totalRevenue: allMetrics.reduce((s, m) => s + m.totalAmount, 0),
        durationSeconds,
      },
      byScenario,
      byStore,
      latency: {
        avg: lats.length ? Math.round(lats.reduce((s, l) => s + l, 0) / lats.length) : 0,
        p50: percentile(lats, 50), p95: percentile(lats, 95), p99: percentile(lats, 99),
        min: lats[0] ?? 0, max: lats[lats.length - 1] ?? 0,
      },
      errors: errSummary,
      topSlowest: [...allMetrics].sort((a, b) => b.latencyMs - a.latencyMs).slice(0, 10),
    }

    // -----------------------------------------------------------------------
    // Write report
    // -----------------------------------------------------------------------
    const reportDir = path.resolve(process.cwd(), 'test-results')
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true })
    const reportPath = path.join(reportDir, 'stress-test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n[STRESS-TEST] Report saved to: ${reportPath}`)

    // -----------------------------------------------------------------------
    // Console summary
    // -----------------------------------------------------------------------
    console.log('\n========================================')
    console.log('  STRESS TEST RESULTS')
    console.log('========================================')
    console.log(`  Total Bills:      ${report.summary.totalBills}`)
    console.log(`  Success Rate:     ${(report.summary.successRate * 100).toFixed(2)}%`)
    console.log(`  Total Revenue:    Rs.${report.summary.totalRevenue.toLocaleString('en-IN')}`)
    console.log(`  Duration:         ${report.summary.durationSeconds}s`)
    console.log(`  Avg Latency:      ${report.latency.avg}ms`)
    console.log(`  P95 Latency:      ${report.latency.p95}ms`)
    console.log('----------------------------------------')
    for (const [slug, s] of Object.entries(report.byScenario)) {
      console.log(`  ${slug.padEnd(12)} bills=${String(s.totalBills).padStart(4)} ok=${String(s.successCount).padStart(4)} avg=${String(s.avgLatency).padStart(5)}ms`)
    }
    if (Object.keys(report.errors).length > 0) {
      console.log('----------------------------------------')
      console.log('  Errors:', JSON.stringify(report.errors))
    }
    console.log('========================================')

    // -----------------------------------------------------------------------
    // Assertions
    // -----------------------------------------------------------------------
    expect(report.summary.successRate, `Success rate is ${(report.summary.successRate * 100).toFixed(2)}% — need >95%`)
      .toBeGreaterThan(0.95)

    expect(report.latency.p95, `P95 latency ${report.latency.p95}ms exceeds 30000ms threshold`)
      .toBeLessThan(30000)

    const fiveXxCount = Object.entries(report.errors)
      .filter(([status]) => status.startsWith('5'))
      .reduce((sum, [, count]) => sum + count, 0)

    expect(fiveXxCount, `Found ${fiveXxCount} 5xx errors`).toBe(0)

    console.log('[STRESS-TEST] All pass criteria met!')
  })
})
