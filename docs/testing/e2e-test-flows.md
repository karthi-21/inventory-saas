# OmniBIZ End-to-End Test Flows

Last updated: 2026-04-15

## Purpose

This document defines **real-world user scenarios** for testing OmniBIZ end-to-end. Each scenario follows a complete stranger visiting the app, signing up, configuring their business, and using it day-to-day. These are not unit tests — they test the **full user journey** from landing page to daily operations.

## Test Bypass Strategy

E2E tests need authenticated users with pre-seeded data. Instead of going through the signup form every time, we use:

**Supabase Admin API** (`scripts/seed-test-scenario.ts`):
- `supabase.auth.admin.createUser()` — creates auth user without email confirmation
- Prisma transaction — creates tenant, stores, locations, products, inventory
- Outputs credentials `{ email, password }` for Playwright
- Called via: `SCENARIO=electronics npx tsx scripts/seed-test-scenario.ts`

**Playwright setup** (`e2e/setup/global-setup.ts`):
1. Runs the seed script for the target scenario
2. Uses Supabase admin to generate a session
3. Writes session cookies to Playwright `storageState` JSON
4. Each test file uses `test.use({ storageState: 'auth-electronics.json' })`

This means tests start **already logged in**, at the dashboard, with all data pre-populated.

---

## Gap Analysis: What's Broken Today

| Gap | Severity | Current State |
|-----|----------|---------------|
| No Location CRUD API | **Blocker** | `COUNTER` exists as LocationType enum but zero API routes or UI |
| No counter selector in POS | **Blocker** | POS auto-picks first store, no counter dropdown, no `currentLocationId` in Zustand |
| Store switcher is cosmetic | **High** | Sidebar dropdown renders stores but clicking does nothing |
| SalesInvoice has no locationId | **High** | No way to attribute a sale to a specific counter |
| No location management in Stores UI | **High** | Store edit dialog has no location sub-form |
| Dashboard ignores store scoping | **Medium** | Shows cross-store aggregates, header always shows first store |
| Billing list ignores store filter | **Medium** | Has `currentStoreId` but doesn't pass it as query param |
| Inventory has no location picker | **Medium** | API supports `locationId` filter but no UI dropdown |
| No onboarding counter creation | **Medium** | Onboarding creates 1 SHOWROOM per store |

---

## Scenario 1: Multi-Store Electronics Retailer (PRIMARY)

**Persona**: Rajesh Kumar, 45, owns 3 electronics showrooms in Chennai. He's evaluating OmniBIZ to replace his current Tally + manual billing setup.

**Business Profile**:
- 3 stores: "Chennai Main" (T Nagar), "Anna Nagar Showroom", "Velachery Outlet"
- Each store: 3 billing counters + 1 warehouse
- Staff: 12 total (Rajesh as owner, 3 store managers, 8 billing operators)
- Monthly revenue: ~15L per store
- GST-registered, needs E-invoicing

### Step-by-Step Flow

```
1. LANDING PAGE
   ─────────────
   Rajesh visits omnibiz.app
   → Sees hero: "Run your store like a pro"
   → Clicks "Start Free Trial"
   → Redirected to /signup

2. SIGNUP
   ───────
   → Selects "Grow" plan (3 stores, Rs 2,499/mo)
   → Enters: rajesh@kumar-electronics.in, password: Rajesh@2026
   → Supabase creates auth account
   → Redirected to /payment?plan=grow

3. PAYMENT
   ────────
   → Razorpay checkout opens
   → Pays Rs 2,499 via UPI
   → Payment verified
   → Redirected to /onboarding

4. ONBOARDING (4-step wizard)
   ───────────────────────────
   Step 1 - Business:
   ✓ Business Name: "Kumar Electronics"
   ✓ GSTIN: 33AABCK1234F1Z5
   ✓ PAN: AABCK1234F
   ✓ Email: rajesh@kumar-electronics.in
   ✓ Phone: +91 98765 43210

   Step 2 - Store:
   ✓ Store Type: ELECTRONICS
   ✓ Primary Store: "Chennai Main"
   ✓ Store Count: 3
   ✓ Personas: Owner/Admin ✓, Store Manager ✓, Billing Operator ✓

   Step 3 - Location:
   ✓ Address: "14, T Nagar Main Road, Chennai"
   ✓ State: Tamil Nadu
   ✓ PIN: 600017
   ✓ Inventory tracking: Batch ✓, Serial ✓, Multi-Store Transfers ✓

   Step 4 - Team:
   ✓ Owner/Admin persona selected
   ✓ Complete onboarding

   EXPECTED RESULT:
   - 3 stores created: "Chennai Main" (STR-001), "Store 2" (STR-002), "Store 3" (STR-003)
   - Each gets 1 default SHOWROOM location
   - Default categories: Mobiles, TVs, Accessories, Audio
   - Owner/Admin persona with all permissions
   - PRO subscription, 30-day trial

   ⚠️ GAP: No way to create COUNTER or WAREHOUSE locations during onboarding.
   Each store only gets 1 SHOWROOM. Rajesh needs 3 COUNTERs + 1 WAREHOUSE per store.

5. POST-ONBOARDING: ADD LOCATIONS (BROKEN TODAY)
   ──────────────────────────────────────────────
   Rajesh goes to /dashboard/stores
   → Clicks "Chennai Main" store card
   → Clicks "Manage Locations" (DOESN'T EXIST)
   → Adds:
     - "Counter 1" (COUNTER)
     - "Counter 2" (COUNTER)
     - "Counter 3" (COUNTER)
     - "Warehouse" (WAREHOUSE)
   → Repeats for other 2 stores

   ⚠️ BLOCKER: No Location CRUD API or UI exists.
   Workaround: Direct database insert or API call.

6. DASHBOARD
   ──────────
   → Sees aggregated stats: Today's Sales, Invoices, Low Stock
   → Header shows "Chennai Main" (first store name)
   → Clicks store dropdown to switch to "Anna Nagar Showroom"
   ⚠️ BROKEN: Dropdown renders but clicking does nothing

7. POS BILLING (COUNTER 2, ANNA NAGAR STORE)
   ────────────────────────────────────────────
   → Switches to "Anna Nagar Showroom" in sidebar (BROKEN)
   → Goes to /dashboard/billing/new
   → POS auto-picks "Chennai Main" (first store) — WRONG STORE
   → Needs to select "Anna Nagar Showroom" + "Counter 2"
   ⚠️ BLOCKER: No counter/location selector in POS

   What SHOULD happen:
   a) Select store: "Anna Nagar Showroom" from store dropdown
   b) Select counter: "Counter 2" from counter dropdown
   c) Add product: "Samsung Galaxy S24 Ultra" × 1
   d) Add customer: "Walk-in" (or search by phone)
   e) Apply discount: 5% on total
   f) Payment: UPI, Rs 1,29,999
   g) Print receipt
   h) Invoice saved with storeId=anna-nagar, locationId=counter-2

8. COUNTER-WISE SALES TRACKING
   ────────────────────────────
   → Go to /dashboard/reports
   → Filter by Store: "Anna Nagar Showroom"
   → Filter by Counter: "Counter 2"
   → See: 15 invoices, Rs 4.5L total
   ⚠️ BROKEN: Reports have no location/counter dimension

9. INVENTORY BY LOCATION
   ─────────────────────
   → Go to /dashboard/inventory
   → Select Store: "Anna Nagar Showroom"
   → Select Location: "Warehouse"
   → See: Samsung S24 Ultra — 25 units in warehouse
   → Select Location: "Counter 2"
   → See: Samsung S24 Ultra — 2 units at counter
   ⚠️ PARTIAL: API supports locationId but UI has no location dropdown

10. END-OF-DAY: SHIFT CLOSURE
    ──────────────────────────
    → Counter 2 operator closes shift
    → Opens cash drawer: Rs 50,000
    → Closes cash drawer: Rs 1,45,000
    → UPI total: Rs 3,20,000
    → Variance: Rs 0
    ⚠️ MISSING: Shift has no locationId (can't attribute to specific counter)

### Code Changes Required

| Change | Files | Priority |
|--------|-------|----------|
| Add `locationId` to `SalesInvoice` | `prisma/schema.prisma` | P0 |
| Add `locationId` to `Shift` | `prisma/schema.prisma` | P0 |
| Create Location CRUD API | New: `src/app/api/locations/route.ts`, `src/app/api/locations/[id]/route.ts` | P0 |
| Wire store switcher onClick | `src/app/(dashboard)/layout.tsx` | P0 |
| Add `currentLocationId` to Zustand | `src/stores/pos-store.ts` | P0 |
| Counter selector in POS | `src/app/(dashboard)/dashboard/billing/new/page.tsx` | P0 |
| Pass `locationId` in billing POST | `src/app/api/billing/route.ts` | P0 |
| Location management in Stores UI | `src/app/(dashboard)/dashboard/stores/page.tsx` | P1 |
| Store-aware dashboard queries | `src/app/(dashboard)/dashboard/page.tsx` | P1 |
| Store filter in billing list | `src/app/(dashboard)/dashboard/billing/page.tsx` | P1 |
| Location dropdown in inventory | `src/app/(dashboard)/dashboard/inventory/page.tsx` | P1 |
| Location dimension in reports | `src/app/api/reports/route.ts` | P2 |

### Playwright Test

```typescript
// e2e/scenarios/electronics-multi-store.spec.ts
test('Rajesh bills at Counter 2, Anna Nagar store', async ({ page }) => {
  // 1. Login as pre-seeded test user
  // 2. Switch store to "Anna Nagar Showroom" via sidebar
  // 3. Go to POS, select "Counter 2"
  // 4. Add product "Samsung Galaxy S24 Ultra" × 1
  // 5. Select payment: UPI
  // 6. Complete sale
  // 7. Verify invoice has storeId=anna-nagar-id, locationId=counter-2-id
  // 8. Go to reports, filter by Counter 2, verify invoice appears
})
```

---

## Scenario 2: Restaurant Chain

**Persona**: Priya Sharma, 38, runs 2 dine-in restaurants and 1 cloud kitchen in Bangalore.

**Business Profile**:
- 2 restaurants: "Priya's Fine Dine" (Indiranagar), "Priya's Bistro" (Koramangala)
- 1 cloud kitchen: "Priya's Kitchen" (HSR Layout)
- Each restaurant: 1 kitchen + 5 tables + 2 billing counters
- Cloud kitchen: 1 kitchen + 1 billing counter
- FSSAI licensed

### Step-by-Step Flow

```
1. SIGNUP + ONBOARDING
   ✓ Select RESTAURANT type, 3 stores, FSSAI number
   ✓ Onboarding creates KITCHEN location for each store (WORKS — only for RESTAURANT)

2. RESTAURANT TABLES
   → Navigate to /dashboard/tables (DOESN'T EXIST)
   → Add 5 tables with capacity 4 each to "Priya's Fine Dine"
   ⚠️ BLOCKER: RestaurantTable model exists, no UI or API route

3. BILLING COUNTERS
   → Add 2 COUNTER locations to each restaurant
   ⚠️ BLOCKER: Same as Scenario 1 — no location management

4. MENU MANAGEMENT
   → Add menu items: Paneer Butter Masala, Dal Makhani, Butter Naan, Biryani
   → Link to products with BOM (Bill of Materials)
   ⚠️ BLOCKER: MenuItem/BOM models exist, no UI

5. KOT FLOW (Kitchen Order Ticket)
   → Waiter takes order at Table 3
   → KOT sent to kitchen display
   → Kitchen marks items as PREPARING → READY
   → Waiter serves, marks SERVED
   → Generate bill from Counter 1
   ⚠️ BLOCKER: KOT/KOTItem models exist, no UI or API

6. COUNTER BILLING
   → Generate bill from Counter 1 for Table 3's order
   → Payment: CASH, Rs 1,850
   ⚠️ BLOCKER: No counter selection, no KOT-to-invoice linking
```

### Code Changes Required

| Change | Files | Priority |
|--------|-------|----------|
| Same as Scenario 1 (location/counter) | See Scenario 1 | P0 |
| Table management page + API | New: `dashboard/tables/page.tsx`, `api/tables/route.ts` | P2 |
| KOT management page + API | New: `dashboard/kot/page.tsx`, `api/kot/route.ts` | P2 |
| MenuItem management | New: `dashboard/menu/page.tsx`, `api/menu-items/route.ts` | P2 |
| KOT-to-invoice linking | `api/billing/route.ts` | P2 |
| Conditional nav items | `layout.tsx` | P2 |

### Playwright Test

```typescript
// e2e/scenarios/restaurant-chain.spec.ts (FUTURE — requires KOT/table features)
test('KOT flow: order at Table 3, kitchen prepares, bill from Counter 1', async ({ page }) => {
  // Requires: table management, KOT UI, counter selection — all missing
})
```

**Status**: Scenario 2 is **future scope**. Core restaurant features (KOT, tables, menu) are not yet built. Focus on Scenario 1 blockers first.

---

## Scenario 3: Wholesale Distributor

**Persona**: Amit Patel, 52, runs a wholesale electronics distribution business in Mumbai.

**Business Profile**:
- 1 showroom + 1 warehouse
- 2 billing counters in showroom
- B2B customers with GSTIN and credit limits
- Needs TAX_INVOICE (not RETAIL_INVOICE), purchase orders, credit management

### Step-by-Step Flow

```
1. SIGNUP + ONBOARDING
   ✓ Select WHOLESALE type, 2 stores

2. B2B CUSTOMER REGISTRATION
   → Add customer: "Sri Electronics" — WHOLESALE, GSTIN: 27AABCS1234F1Z5, Credit Limit: Rs 5,00,000
   ✓ WORKS: Customer form has type, GSTIN, creditLimit fields

3. TAX INVOICE
   → Go to POS, select showroom + Counter 1
   → Need to switch from RETAIL_INVOICE to TAX_INVOICE
   ⚠️ BLOCKER: POS always creates RETAIL_INVOICE, no invoice type selector

4. CREDIT SALE
   → Create TAX_INVOICE for 50 Samsung TVs, billing type: CREDIT
   → Verify: Customer creditBalance increases by invoice amount
   ✓ WORKS: Billing API handles CREDIT type

5. CREDIT PAYMENT
   → Customer pays Rs 2,00,000 against outstanding
   → Record payment, verify creditBalance decreases
   ⚠️ BLOCKER: No credit payment recording UI

6. PURCHASE ORDER
   → Create PO to "Samsung India" for 200 TVs
   → Receive partial shipment: 100 TVs
   → Verify inventory increments by 100
   ⚠️ BLOCKER: PurchaseOrder model exists, no UI or API
```

### Code Changes Required

| Change | Files | Priority |
|--------|-------|----------|
| Same as Scenario 1 (location/counter) | See Scenario 1 | P0 |
| Invoice type selector in POS | `billing/new/page.tsx` | P1 |
| Credit payment recording | New: `api/customers/[id]/payments/route.ts` + UI | P1 |
| Purchase Order page + API | New: `dashboard/purchase-orders/page.tsx`, `api/purchase-orders/route.ts` | P2 |

### Playwright Test

```typescript
// e2e/scenarios/wholesale-distributor.spec.ts
test('Amit creates B2B tax invoice on credit, customer pays down balance', async ({ page }) => {
  // 1. Login as pre-seeded wholesale test user
  // 2. Add B2B customer "Sri Electronics" with GSTIN + credit limit 5L
  // 3. Create TAX_INVOICE for 50 Samsung TVs, billing type CREDIT
  // 4. Verify customer creditBalance = invoice total
  // 5. Record partial payment of 2L against outstanding
  // 6. Verify creditBalance decreased by 2L
  // 7. View GST report showing the tax invoice
})
```

---

## Scenario 4: Fashion Multi-Brand

**Persona**: Meera Iyer, 35, owns 2 clothing stores in Bangalore.

**Business Profile**:
- 2 stores: "Meera's Couture" (MG Road), "Meera's Casual" (Whitefield)
- Each store: 2 billing counters + 1 stock room
- Products with size/color variants
- Customer loyalty program

### Step-by-Step Flow

```
1. SIGNUP + ONBOARDING
   ✓ Select CLOTHING type, 2 stores

2. VARIANT PRODUCTS
   → Add "Cotton Shirt" with 4 variants: Red-M, Red-L, Blue-M, Blue-L
   ✓ WORKS: ProductVariant model exists in schema
   ⚠️ NEEDS VERIFICATION: Variant creation UI may be incomplete

3. COUNTER + STOCK ROOM LOCATIONS
   → Add 2 COUNTER + 1 WAREHOUSE per store
   ⚠️ BLOCKER: Same as Scenario 1

4. POS WITH VARIANT SELECTION
   → At Counter 1, search "Cotton Shirt Red M", add to cart
   → Customer "Kavitha" has 500 loyalty points
   → Redeem 200 points (Rs 50 off)
   → Complete sale
   ✓ WORKS: Loyalty redemption in POS page

5. INVENTORY BY VARIANT
   → Check stock: Red-M = 10, Red-L = 15 at Stock Room
   → After sale of 1 Red-M, verify stock = 9
   ✓ WORKS: InventoryStock has variantId
```

### Code Changes Required

| Change | Files | Priority |
|--------|-------|----------|
| Same as Scenario 1 (location/counter) | See Scenario 1 | P0 |
| Verify variant creation UI | Products page | P1 |
| Product tags/seasons (future) | Schema + UI | P3 |

### Playwright Test

```typescript
// e2e/scenarios/fashion-multibrand.spec.ts (FUTURE — after counter features)
test('Meera sells variant product at Counter 1, redeems loyalty', async ({ page }) => {
  // Requires: counter selector + location management first
})
```

**Status**: Core variant + loyalty features work. Counter features needed from Scenario 1.

---

## Scenario 5: Grocery Supermarket

**Persona**: Suresh Reddy, 48, runs a large supermarket in Hyderabad.

**Business Profile**:
- 1 store: "Suresh's SuperMart"
- 4 billing counters, 1 cold storage, 1 warehouse
- Products with batch numbers and expiry dates
- Needs FIFO (first-expiry-first-out) for perishables
- Fast POS with barcode scanning

### Step-by-Step Flow

```
1. SIGNUP + ONBOARDING
   ✓ Select SUPERMARKET type, 1 store

2. LOCATIONS
   → Add 4 COUNTER + 1 COLD_STORAGE + 1 WAREHOUSE
   ⚠️ BLOCKER: Same as Scenario 1

3. BATCH/EXPIRY PRODUCTS
   → Receive: 100 "Amul Butter" batch B2026-04, expiry 2026-06-15 → cold storage
   → Receive: 50 "Amul Butter" batch B2026-03, expiry 2026-05-01 → cold storage
   ⚠️ PARTIAL: Schema has hasBatchNumber/hasExpiry flags, but no batch entry UI

4. EXPIRY ALERTS
   → Dashboard should show B2026-03 as "expiring soon" (within 30 days)
   ⚠️ BLOCKER: No expiry alert engine exists

5. FIFO BILLING
   → At Counter 3, add "Amul Butter" to cart
   → System should auto-select B2026-03 (earlier expiry) — FIFO
   ⚠️ BLOCKER: No batch selection logic in POS

6. FAST POS
   → Barcode scan to add items quickly
   → Search by barcode text works, but no hardware scanner integration
   ⚠️ PARTIAL: Text search works, hardware scanner is future
```

### Code Changes Required

| Change | Files | Priority |
|--------|-------|----------|
| Same as Scenario 1 (location/counter) | See Scenario 1 | P0 |
| Batch entry in purchase | `dashboard/purchases/page.tsx` | P2 |
| Batch selection in POS (FIFO) | `billing/new/page.tsx` | P2 |
| Expiry alert engine | `api/notifications/route.ts` or cron | P2 |
| Expiry dashboard widget | `dashboard/page.tsx` | P2 |

### Playwright Test

```typescript
// e2e/scenarios/grocery-supermarket.spec.ts (FUTURE — requires batch features)
test('Suresh bills at Counter 3, FIFO selects earliest-expiry batch', async ({ page }) => {
  // Requires: counter selector + batch/expiry features
})
```

---

## Implementation Priority

Based on what **unblocks the most scenarios**, the priority order is:

### Phase A: Counter/Location Foundation (Unblocks ALL 5 scenarios)
1. Schema: Add `locationId` to `SalesInvoice` + `Shift`
2. Location CRUD API
3. Wire global store context + sidebar switcher
4. Counter selector in POS
5. Location management in Stores page

### Phase B: Store-Aware Filtering (Improves ALL scenarios)
6. Store-aware dashboard queries
7. Store filter in billing list
8. Location dropdown in inventory
9. Location dimension in reports

### Phase C: Scenario-Specific Features
10. **Wholesale** (Scenario 3): Invoice type selector, credit payment UI, purchase orders
11. **Grocery** (Scenario 5): Batch/expiry entry, FIFO logic, expiry alerts
12. **Restaurant** (Scenario 2): KOT, table management, menu items
13. **Fashion** (Scenario 4): Variant UI verification, product tags

### Phase D: Test Automation
14. Test seeding script (Supabase Admin API)
15. Playwright scenario tests for electronics + wholesale
16. Playwright setup fixtures

---

## Verification Checklist

For **Scenario 1** (primary):

- [ ] Stranger visits `/`, clicks "Start Free Trial", signs up
- [ ] Onboarding creates 3 stores with default categories
- [ ] User can add COUNTER + WAREHOUSE locations to each store via UI
- [ ] Sidebar store switcher actually switches the active store
- [ ] POS page shows counter dropdown (filtered by COUNTER type)
- [ ] Creating an invoice at Counter 2 saves `locationId` on the invoice
- [ ] Billing list page filters by current store
- [ ] Inventory page filters by location
- [ ] Dashboard shows data for the selected store
- [ ] Reports can be filtered by counter/location
- [ ] Shift open/close tracks the counter location

For **automated testing**:

- [ ] `SCENARIO=electronics npx tsx scripts/seed-test-scenario.ts` runs cleanly
- [ ] Playwright logs in with seeded credentials without going through signup
- [ ] `npx playwright test e2e/scenarios/electronics-multi-store.spec.ts` passes