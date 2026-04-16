# T087: Remaining UX Features — Barcode, Multi-Store Onboarding, Excel Export, 2FA, Mobile

**Priority**: P2 (important for polish, not blocking first customer)
**Status**: todo
**Size**: XL (aggregate of 5 features)
**Depends on**: T082 (build fix), T080 (PhonePe — for UPI QR)

## Problem

Several UX features from the gap analysis are half-built or missing. This ticket covers five remaining items that improve the product experience but aren't blocking for first customer:

1. **Barcode Scanner Integration** — Scan icon exists but is decorative
2. **Multi-Store Setup in Onboarding** — Currently limited to 1 store
3. **Excel Export** — Button says "coming soon"
4. **2FA Toggle** — Button says "coming soon"
5. **Mobile Responsiveness** — Tables overflow on small screens

## 1. Barcode Scanner Integration

### Current State
- POS has a `Scan` icon in the search bar area
- Clicking it does nothing (decorative)
- No camera/scanner integration

### Requirements

**Option A: USB Barcode Scanner (Recommended)**
USB barcode scanners act as keyboard input — they type the barcode and press Enter. This is the most common scanner type in Indian retail and requires no special code:
- Auto-detect barcode input by listening for rapid keypress sequences ending in Enter
- When a barcode is scanned, auto-search the product and add to cart
- If product found: add to cart with quantity 1
- If product not found: show toast "Product not found — add it?"
- Configuration: Settings > Hardware > "Barcode Scanner Enabled" toggle

**Option B: Camera QR/Barcode (Future, Not This Ticket)**
Camera-based scanning requires a library like `html5-qrcode` and is out of scope for now. We'll add a "Scan with Camera" button as a future enhancement placeholder.

### Implementation
- Add barcode listener hook: `src/lib/use-barcode-scanner.ts`
  - Listens for rapid keypress sequences (typical scan: < 50ms between chars, ends with Enter)
  - Debounces to avoid false positives from regular typing
  - Calls `onScan(barcode)` callback
- In POS page: use the hook, on scan → search product API → add to cart
- Add toggle in Settings > Hardware for enabling/disabling scanner

### Test Scenarios
1. Plug in USB barcode scanner, scan a product → product added to cart
2. Type barcode manually in search → product found (existing behavior)
3. Scan unknown barcode → toast "Product not found"
4. Disable scanner in Settings → scans are ignored
5. Rapid typing (not a scan) → not interpreted as barcode (debounce works)

---

## 2. Multi-Store Setup in Onboarding

### Current State
- Onboarding wizard creates only 1 store
- Multi-store management exists in Settings > Stores
- No way to add stores during onboarding

### Requirements
- After creating first store in onboarding, show "Add another store?" option
- For PRO plan users: allow up to 3 stores during onboarding
- For ENTERPRISE: unlimited stores
- Each additional store: name, type, address
- Skip adding more stores → go to dashboard
- After onboarding: Settings > Stores for ongoing management (already exists)

### Implementation
- Modify `src/app/(onboarding)/page.tsx` or `src/app/onboarding/page.tsx`
- Add step 5: "Add More Stores?" (optional)
- POST `/api/onboarding/create-store` for each additional store
- Check plan limits before allowing additional stores

### Test Scenarios
1. New user on STARTER plan → onboarding creates 1 store, "Add more stores" shows upgrade prompt
2. New user on PRO plan → creates 1st store, clicks "Add another" → creates 2nd store → option for 3rd
3. User skips "Add more" → goes straight to dashboard
4. Dashboard shows all stores created during onboarding

---

## 3. Excel Export

### Current State
- CSV export works via `src/lib/export.ts`
- Excel button in Reports shows toast "Excel export coming soon!"
- `xlsx` package is already installed

### Requirements
- Replace "coming soon" toast with actual Excel download
- Use `xlsx` library (already in package.json)
- Export functions for:
  - Sales report → .xlsx with multiple sheets (Summary, Details, GST)
  - Inventory report → .xlsx with stock levels
  - Outstanding report → .xlsx with customer-wise breakdown
  - GSTR-1 → .xlsx with B2B, B2C, HSN sheets
  - GSTR-3B → .xlsx with summary tables

### Implementation
Create `src/lib/export-excel.ts`:
```typescript
import * as XLSX from 'xlsx'

export function exportToExcel(data: {
  sheets: Array<{ name: string; headers: string[]; rows: any[][] }>
}, filename: string) {
  const wb = XLSX.utils.book_new()
  for (const sheet of data.sheets) {
    const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows])
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  }
  XLSX.writeFile(wb, filename)
}
```

Update Reports page: Replace toast with `exportToExcel()` call.

### Test Scenarios
1. Go to Reports > Sales → click "Export Excel" → .xlsx downloads
2. Open .xlsx in Excel/LibreOffice → has "Summary" and "Details" sheets
3. Data matches what's shown on screen
4. GSTR-1 Excel has B2B, B2C, HSN tabs
5. Export with date filter → only filtered data in Excel

---

## 4. Two-Factor Authentication (2FA) Toggle

### Current State
- Settings page has a "Two-Factor Authentication" button that shows `toast.info('coming soon')`
- Supabase Auth supports TOTP (authenticator app) natively

### Requirements
- Add 2FA enrollment flow:
  1. User clicks "Enable 2FA" in Settings
  2. Supabase generates TOTP secret and QR code
  3. User scans QR with authenticator app (Google Authenticator, Authy)
  4. User enters 6-digit code to verify
  5. 2FA is enabled for the user
- Login flow: after email/password, show 2FA code entry screen
- Disable 2FA: user enters current code, 2FA is removed
- Recovery codes: generate 10 one-time codes for backup

### Implementation
- Use Supabase Auth's `enroll()` and `challenge()` APIs
- Create `src/app/(auth)/verify-2fa/page.tsx` — 2FA verification page
- Create `src/app/api/auth/2fa/enroll/route.ts` — Start 2FA enrollment
- Create `src/app/api/auth/2fa/verify/route.ts` — Verify 2FA code
- Update `src/middleware.ts` — Check if user has 2FA enabled, redirect to verify page
- Update Settings page: "Enable 2FA" button → enrollment flow

### Test Scenarios
1. User enables 2FA → QR code appears → scans with authenticator → enters code → 2FA enabled
2. User logs in → enters email/password → redirected to 2FA page → enters code → logged in
3. User disables 2FA → enters current code → 2FA removed
4. User loses authenticator → uses recovery code → logged in → can re-enroll or disable 2FA
5. User without 2FA → normal login, no 2FA page

---

## 5. Mobile Responsiveness

### Current State
- Several tables overflow on small screens (billing list, inventory, reports)
- POS page is not optimized for tablet/portrait mode
- Navigation sidebar doesn't collapse well on mobile

### Requirements

**Tables**: 
- Add horizontal scroll wrapper for all data tables on mobile
- Or switch to card-based layout on small screens
- Minimum viewport width for full table: 1024px

**POS Page**:
- On screens < 768px: stack cart below product grid
- Product grid: 2 columns on mobile (instead of 4)
- Payment buttons: full width on mobile
- Customer search: expandable instead of always visible

**Navigation**:
- Bottom tab bar on mobile (5 items: POS, Inventory, Customers, Reports, More)
- Hamburger menu for "More" items
- Current Sheet-based mobile nav works but could be smoother

**Settings/Forms**:
- Single column layout on mobile
- Larger touch targets (min 44px)
- Scrollable tab bars on mobile

### Implementation
- Add responsive breakpoints to all dashboard pages
- Use Tailwind's `md:` and `lg:` prefixes
- Create `src/components/mobile-nav.tsx` — bottom tab bar component
- Update `src/app/(dashboard)/layout.tsx` — conditionally render mobile nav

### Test Scenarios
1. Open billing list on iPhone 14 (390px) → table scrolls horizontally, no overflow
2. Open POS on iPad (768px portrait) → cart below product grid, 3 columns
3. Open POS on iPhone (375px) → 2 column grid, stacked cart, full-width buttons
4. Open inventory on Android → card-based layout instead of table
5. Navigate between pages using bottom tab bar on mobile

---

## Files to Create/Modify

### New Files
- `src/lib/use-barcode-scanner.ts` — Barcode scanner hook
- `src/lib/export-excel.ts` — Excel export utility
- `src/app/(auth)/verify-2fa/page.tsx` — 2FA verification page
- `src/app/api/auth/2fa/enroll/route.ts` — 2FA enrollment
- `src/app/api/auth/2fa/verify/route.ts` — 2FA verification
- `src/components/mobile-nav.tsx` — Mobile bottom tab bar

### Modified Files
- `src/app/(dashboard)/dashboard/billing/new/page.tsx` — Add barcode scanner hook
- `src/app/(dashboard)/dashboard/reports/page.tsx` — Replace "coming soon" with Excel export
- `src/app/(dashboard)/dashboard/settings/page.tsx` — Replace 2FA "coming soon" with actual flow
- `src/app/(onboarding)/page.tsx` — Add multi-store step
- `src/app/(dashboard)/layout.tsx` — Add mobile nav, responsive layout
- `src/middleware.ts` — Check 2FA status
- `prisma/schema.prisma` — Add 2FA fields to User model
- `src/app/(dashboard)/dashboard/billing/page.tsx` — Responsive tables
- `src/app/(dashboard)/dashboard/inventory/page.tsx` — Responsive tables
- `src/app/(dashboard)/dashboard/customers/page.tsx` — Responsive tables

## Acceptance Criteria

### Barcode Scanner
- [ ] USB barcode scanner input is detected and adds product to cart
- [ ] Unknown barcode shows "Product not found" toast
- [ ] Scanner can be enabled/disabled in Settings
- [ ] Manual typing in search bar still works

### Multi-Store Onboarding
- [ ] After creating first store, user can add more stores (if plan allows)
- [ ] STARTER plan shows "upgrade to add more stores" prompt
- [ ] All stores created during onboarding appear in dashboard
- [ ] Skip option works correctly

### Excel Export
- [ ] Sales report exports to .xlsx with multiple sheets
- [ ] Inventory report exports to .xlsx
- [ ] GSTR reports export to .xlsx with correct tabs
- [ ] Outstanding report exports to .xlsx
- [ ] "Coming soon" toast is removed from all report pages

### 2FA
- [ ] User can enroll in 2FA via authenticator app
- [ ] Login flow includes 2FA verification step for enrolled users
- [ ] 2FA can be disabled by entering current code
- [ ] Recovery codes are generated and shown during enrollment
- [ ] Settings page shows 2FA status (enabled/disabled)

### Mobile Responsiveness
- [ ] All tables scroll horizontally on mobile without overflow
- [ ] POS page is usable on 375px width (iPhone)
- [ ] Bottom tab bar appears on mobile
- [ ] Settings forms are single-column on mobile
- [ ] All buttons have minimum 44px touch targets
