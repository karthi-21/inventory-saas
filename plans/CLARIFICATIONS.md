# Plan Clarifications & Loose Ends

This document fixes ambiguities found during review. Every plan should be read together with this file.

---

## Common Patterns

### File Creation Convention
When a plan says "Create `/api/X` route", create at:
```
src/app/api/X/route.ts        # GET, POST, PUT, DELETE handlers
src/app/api/X/[id]/route.ts   # For single resource: GET, PUT, DELETE by ID
```

### Component Creation Convention
When a plan says "Create component", place at:
```
src/components/{Domain}/{ComponentName}.tsx
# Examples:
src/components/pos/CartPanel.tsx
src/components/pos/ProductSearch.tsx
src/components/pos/PaymentDialog.tsx
src/components/billing/ReceiptTemplate.tsx
```

---

## Day 1 — Landing Page

### What Already Exists
- Hero section with headline, CTA buttons, trust badge
- Features section with 7 feature cards
- Pricing section with 3 plan cards
- Store types section with 6 type cards
- Footer with copyright

### What Needs to be Added (per plan)
- [ ] FAQ section below pricing (does NOT exist)
- [ ] Testimonials section (does NOT exist)
- [ ] "Powered by" logos in footer (does NOT exist)
- [ ] Security badges in footer (does NOT exist)
- [ ] "No credit card required" badge (does NOT exist)
- [ ] FAQ entries: "What happens after trial?", "Can I change plans?", "Is my data secure?"

### Analytics Implementation
Add to `src/app/layout.tsx` or create separate component:
```tsx
// Using Plausible (privacy-friendly)
import Script from 'next/script'
// Add in <head>: plausible.js script
```

---

## Day 2 — Signup & Payment

### Missing API Routes to Create

#### 1. `/api/auth/callback/route.ts`
```typescript
// Handles Google OAuth callback from Supabase
// 1. Exchange code for session
// 2. Create/update User record in Prisma
// 3. Redirect to /onboarding or /dashboard
```

#### 2. `/api/auth/get-user/route.ts`
```typescript
// GET: Returns current authenticated user with tenant info
// Used by React Query to check auth state
```

#### 3. `/api/payments/create-order/route.ts`
```typescript
// POST: Creates Razorpay order
// Input: { planId: 'launch' | 'grow' | 'scale', email: string, phone: string }
// Creates tenant record (if new), then Razorpay order
// Returns: { orderId, amount, currency }
```

#### 4. `/api/payments/verify/route.ts`
```typescript
// POST (webhook): Verifies Razorpay payment
// Input: razorpay_signature, razorpay_order_id, razorpay_payment_id
// 1. Verify signature
// 2. Create/update Subscription in Prisma
// 3. Send welcome email
// Returns: { success: true }
```

### Auth Flow Clarification

```
1. User clicks "Sign up with Google"
2. Redirect to Supabase Google OAuth
3. Supabase redirects to /api/auth/callback?code=xxx
4. /api/auth/callback:
   a. Exchange code for Supabase session
   b. Check if User exists in Prisma by supabase_user_id
   c. If not, create User record linked to new Tenant
   d. Set session cookie
   e. Redirect to /onboarding
```

### Payment Flow Clarification

```
1. User completes signup → lands on plan confirmation page
2. User clicks "Pay ₹2,499"
3. POST /api/payments/create-order
   → Creates Tenant (if not exists)
   → Creates Subscription (status: PENDING)
   → Creates Razorpay order
   → Returns { orderId, amount }
4. Show Razorpay checkout (embedded or redirect)
5. On success:
   → Razorpay webhook fires to /api/payments/verify
   → Update Subscription status: ACTIVE
   → Send welcome email
   → Redirect to /onboarding
6. On failure:
   → Show error, allow retry
   → Subscription remains PENDING (cleanup job later)
```

### UPI QR Code Clarification
- For v1: **Static QR** — display store's UPI ID as QR code image
- UPI ID stored in TenantSettings
- No dynamic QR generation yet (phase 2)

---

## Day 3 — Onboarding Wizard

### Existing Code Issue
The `handleComplete` function in `src/app/(onboarding)/page.tsx` (line 108-113) has a TODO:
```typescript
// TODO: Submit to API / Supabase
```
**This must be implemented.** POST to `/api/onboarding` with all form data.

### Onboarding State Persistence
- Use **localStorage** with key: `omnibiz_onboarding_state`
- Store: currentStep, formData, selectedStoreType, selectedPersonas
- On page load: check if state exists → show "Continue where you left off?"
- On successful submit: clear localStorage state

### Onboarding Completion Flow
```
1. User clicks "Complete Setup"
2. POST /api/onboarding with all wizard data
3. On success:
   a. Update Supabase session/user metadata with tenantId
   b. Clear onboarding state from localStorage
   c. Show "🎉 You're all set!" screen for 2 seconds
   d. Redirect to /dashboard
4. On error:
   a. Show error toast
   b. Don't redirect
   c. Allow retry
```

### What to Do If Onboarding API Fails
- Show inline error: "Something went wrong. Please try again."
- Keep data in form (don't clear)
- "Save & Exit Later" → saves to localStorage, redirects to /dashboard with banner "Complete setup to unlock all features"

### Missing Route: `/api/gstin/validate`
```typescript
// GET/POST: Basic GSTIN validation
// For v1: Format validation only (15 chars, valid state code)
// Input: { gstin: string }
// Returns: { valid: boolean, errors: string[] }
```

---

## Day 4 — POS Screen

### File Structure to Create
```
src/app/(pos)/
  layout.tsx          # POS layout (no sidebar, minimal chrome)
  /new/
    page.tsx         # Main POS screen

src/components/pos/
  ProductSearch.tsx   # Search bar + results grid
  CartPanel.tsx       # Cart items, totals, actions
  CustomerSelector.tsx # Customer search dialog
  PaymentDialog.tsx    # Payment method selection + numpad
  ReceiptPreview.tsx   # Receipt preview before print
```

### POS Layout (`/dashboard/billing/new`)
```
┌─────────────────────────────────────────────────────────────┐
│  [Store Name]  │  New Sale  │  06 Apr 2026 10:30 AM  │ ⚙ │
├─────────────────────────────────┬───────────────────────────┤
│                                 │  Customer                │
│  [🔍 Search products...]       │  Walk-in Customer [✏️] │
│  [📷 Scan barcode]             ├───────────────────────────┤
│                                 │                         │
│  [Category buttons]             │  Cart Items              │
│                                 │  ─────────────────────   │
│  ┌─────┐ ┌─────┐ ┌─────┐      │  Item 1    ×2   ₹500    │
│  │Prod1│ │Prod2│ │Prod3│      │  Item 2    ×1   ₹200    │
│  │ ₹100│ │ ₹200│ │ ₹150│      │  Item 3    ×1   ₹150    │
│  └─────┘ └─────┘ └─────┘      │                         │
│  ┌─────┐ ┌─────┐ ┌─────┐      ├───────────────────────────┤
│  │Prod4│ │Prod5│ │Prod6│      │  Subtotal:    ₹850      │
│  │ ₹300│ │ ₹250│ │ ₹180│      │  GST (18%):   ₹153      │
│  └─────┘ └─────┘ └─────┘      │  Discount:    -₹50       │
│                                │  ─────────────────────   │
│                                │  TOTAL:       ₹953      │
│                                │                         │
│                                │  [    PAY ₹953    ]     │
│                                │  [ Hold Bill ]          │
└────────────────────────────────┴───────────────────────────┘
```

### Receipt Template Format (ESC/POS)
```typescript
// Use `escpos` library or raw ESC/POS commands
// For v1: Browser print dialog (window.print())
// Receipt must include:
// - Store name, address, GSTIN
// - Invoice number, date, time
// - Customer name (if registered) or "Walk-in"
// - Item lines: name, qty, rate, amount
// - Subtotal, GST breakdown, discount, total
// - Payment method
// - QR code (for GST invoice verification)
// - Footer: "Thank you!" + store phone
```

### Keyboard Shortcuts Implementation
```typescript
// In POS page component (useEffect)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'F1') { e.preventDefault(); searchRef.current?.focus(); }
    if (e.key === 'F2') { e.preventDefault(); openCustomerSelector(); }
    if (e.key === 'F3') { e.preventDefault(); openPayment(); }
    if (e.ctrlKey && e.key === 'h') { e.preventDefault(); holdBill(); }
    if (e.ctrlKey && e.key === 'n') { e.preventDefault(); newSale(); }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Day 5 — Products Catalog

### CSV Import UI Location
CSV import is a **modal dialog** opened from the Products page:
```
Products page → "Import CSV" button → Modal dialog
  - Step 1: Upload CSV file (drag & drop)
  - Step 2: Preview first 5 rows
  - Step 3: Column mapping (if needed)
  - Step 4: Validation results
  - Step 5: Import progress + completion
```

### Missing Routes to Create
- `src/app/api/products/[id]/route.ts` — GET, PUT, DELETE single product
- `src/app/api/products/import/route.ts` — POST: bulk CSV import

### Product Not Found in POS
When scanning/barcode search in POS returns no results:
- Show toast: "Product not found"
- Show inline link: "Add this product now"
- Click → opens quick-add product dialog (inline in POS, not redirect)

---

## Day 6 — Customers & Vendors

### Missing Routes to Create
- `src/app/api/customers/[id]/route.ts` — GET, PUT, DELETE
- `src/app/api/customers/[id]/redeem-points/route.ts` — POST: redeem loyalty points
- `src/app/api/vendors/[id]/route.ts` — GET, PUT, DELETE
- `src/app/api/vendors/[id]/ledger/route.ts` — GET: vendor account statement

### Walk-in Customer
Create a system customer record in seed data:
```
id: "WALKIN"
firstName: "Walk-in"
lastName: "Customer"
phone: "WALKIN"
isSystem: true  (add this field)
```

---

## Day 7 — Reports & GST

### Reports API Implementation
Can be ONE route with query parameters OR separate routes:

**Option A (simpler — single route):**
```
GET /api/reports?type=sales&from=...&to=...
GET /api/reports?type=gst&from=...&to=...
GET /api/reports?type=gstr1&from=...&to=...
```

**Option B (cleaner — separate routes):**
```
GET /api/reports/sales
GET /api/reports/gst
GET /api/reports/gstr1
GET /api/reports/inventory
GET /api/reports/export?type=sales&format=excel
```

**Recommendation: Option B** — cleaner, easier to cache, more RESTful.

### GSTR-1 Excel Format
Must follow government-specified format:
- Sheet 1: B2B invoices (GSTIN-wise)
- Sheet 2: B2C large (≥₹2.5L)
- Sheet 3: B2C small (aggregate by rate + state)
- Use `xlsx` library with proper column widths and number formats

---

## Day 8 — Purchase Flow

### Missing Routes to Create
- `src/app/api/purchase-orders/route.ts` — GET, POST
- `src/app/api/purchase-orders/[id]/route.ts` — GET, PUT
- `src/app/api/purchase-invoices/route.ts` — GET, POST
- `src/app/api/purchase-invoices/[id]/route.ts` — GET, PUT
- `src/app/api/purchase-invoices/[id]/receive/route.ts` — POST: GRN

### Low Stock → Purchase Flow
```
Dashboard alert "4 items below reorder level" → Click
→ /dashboard/inventory?tab=purchase&createFromLowStock=true
→ Pre-selects low-stock products in purchase order form
→ Retailer adjusts quantities, selects vendor
→ Creates Purchase Order
```

---

## Day 9 — Multi-Store & Settings

### Settings Page Tabs
Current: `/dashboard/settings/page.tsx` — single page, no tabs
Need to add tabs:
- General (business info)
- GST (GSTIN, invoice prefix)
- Billing (format, round-off)
- Inventory (alerts)
- Notifications
- Printers
- Team/Users

### Missing Routes
- `src/app/api/stores/[id]/route.ts` — GET, PUT store
- `src/app/api/users/invite/route.ts` — POST: invite user
- `src/app/api/personas/route.ts` — GET, POST personas
- `src/app/api/personas/[id]/route.ts` — GET, PUT, DELETE

---

## Day 10 — Backend & Testing

### Database Migration Commands
```bash
# Development
npx prisma migrate dev --name init

# Production (run on Supabase)
npx prisma migrate deploy

# Seed data (after migrate)
npx prisma db seed
```

### Test Commands (Vitest)
```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### Test File Location
```
src/__tests__/
  billing.test.ts      # GST calculation, invoice creation
  inventory.test.ts    # Stock movements
  permissions.test.ts  # RBAC checks
  gst.test.ts         # GST calculation edge cases
```

---

## Day 11 — Deployment

### Vercel Deploy Action (Correct Syntax)
```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    vercel-args: '--prod'
```

### Secrets to Add in GitHub
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Domain Setup
1. Buy domain from GoDaddy/Namecheap
2. Add domain in Vercel project settings
3. Update DNS:
   - A record: Vercel load balancer IP
   - CNAME: `cname.vercel-dns.com`
4. Enable SSL (automatic in Vercel)

---

## Day 12 — Notifications

### WhatsApp Message Templates (Pre-approved by Meta)
Need to create templates for:
- Invoice receipt
- Payment received
- Loyalty points earned
- Low stock alert (internal)

### Email Templates (Resend)
- Welcome email
- Invoice receipt (PDF attached)
- Payment confirmation
- Trial ending reminder (3 days before)

---

## Day 13 — Restaurant Mode

### Restaurant Files to Create
```
src/app/(dashboard)/restaurant/
  /tables/page.tsx      # Floor plan + table management
  /kot/page.tsx        # Kitchen display
  /menu/page.tsx       # Menu management

src/app/api/restaurant/
  /tables/route.ts
  /tables/[id]/route.ts
  /kot/route.ts
  /kot/[id]/route.ts
  /menu/route.ts
  /bill/route.ts
```

---

## Day 14 — Polish

### Lighthouse Targets
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

---

## Dependency Summary

### Missing API Routes (By Day)

**Day 2:**
- `/api/auth/callback` — OAuth
- `/api/auth/get-user` — Session
- `/api/payments/create-order` — Razorpay
- `/api/payments/verify` — Webhook

**Day 3:**
- `/api/gstin/validate` — Validation

**Day 4:**
- `/api/print/receipt` — Receipt

**Day 5:**
- `/api/products/[id]`
- `/api/products/import`

**Day 6:**
- `/api/customers/[id]`
- `/api/customers/[id]/redeem-points`
- `/api/vendors/[id]`
- `/api/vendors/[id]/ledger`

**Day 7:**
- `/api/reports/sales`
- `/api/reports/gst`
- `/api/reports/gstr1`
- `/api/reports/inventory`

**Day 8:**
- `/api/purchase-orders`
- `/api/purchase-orders/[id]`
- `/api/purchase-invoices`
- `/api/purchase-invoices/[id]`
- `/api/purchase-invoices/[id]/receive`

**Day 9:**
- `/api/stores/[id]`
- `/api/users/invite`
- `/api/personas`
- `/api/personas/[id]`

**Day 13:**
- `/api/restaurant/tables`
- `/api/restaurant/tables/[id]`
- `/api/restaurant/kot`
- `/api/restaurant/kot/[id]`
- `/api/restaurant/menu`
- `/api/restaurant/bill`

---

## Environment Variables Required

```bash
# .env.local (development)
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # For server-side only
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RESEND_API_KEY=re_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Razorpay Webhook Secret (for verify route)
RAZORPAY_WEBHOOK_SECRET=xxx

# WhatsApp (when implemented)
WHATSAPP_BUSINESS_TOKEN=xxx
```

---

*This document is part of the plan. Read together with all day plans.*
