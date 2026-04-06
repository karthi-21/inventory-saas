# Day 4: POS Screen — The Heart of the App

## Goal
A retailer can add products to cart, apply discounts, select customer, complete payment, and print/email receipt — all in under 60 seconds per transaction.

---

## Why This Day Matters
The POS screen is **where the money happens**. If billing is slow or confusing, the retailer abandons the app and goes back to their old Excel-based system. This must be:
- Fast: <3 seconds per transaction
- Familiar: Looks like a traditional billing machine, but digital
- Reliable: Never loses a transaction

---

## Customer Journey
```
[Dashboard] → [New Sale] → [Search/Add Products] → [Apply Discounts] → [Select Customer] → [Payment] → [Receipt]
```

---

## Tasks

### 4.1 POS Screen Layout (`/dashboard/billing/new`)
- [ ] Create the `/dashboard/billing/new/page.tsx` file
- [ ] Layout: Split screen
  - **Left (60%)**: Product search + cart
  - **Right (40%)**: Customer selection + payment summary
- [ ] Header: Store name + "New Sale" + current date/time

### 4.2 Product Search & Add to Cart
- [ ] Search bar at top — auto-focus on page load
- [ ] Search by: name, SKU, barcode (scanner input)
- [ ] Search results appear as cards (image, name, price, stock qty)
- [ ] Click/tap to add to cart — no drag/drop
- [ ] Barcode scanner input: auto-add product when scanned
- [ ] If product not found: "Product not found? Add it now" link
- [ ] Quick category buttons below search bar for fast filtering

### 4.3 Cart Panel
- [ ] Show cart items: name, qty, unit price, discount, total
- [ ] Inline quantity +/- buttons
- [ ] Swipe left to delete item (mobile) or X button (desktop)
- [ ] Tap item to edit: quantity, discount (%), discount (₹)
- [ ] Running subtotal, GST, and total displayed prominently
- [ ] "Hold Bill" button — saves cart to recall later
- [ ] "Clear Cart" with confirmation

### 4.4 Customer Selection
- [ ] "Walk-in Customer" as default (already selected)
- [ ] "Select Customer" button → opens customer search dialog
- [ ] Search by phone (most common) or name
- [ ] Show customer name + outstanding balance
- [ ] If customer has credit outstanding → show warning
- [ ] "Add New Customer" quick link in dialog

### 4.5 Discounts
- [ ] Per-item discount: Tap item → edit modal with % and ₹ discount
- [ ] Bill-level discount: "Add Bill Discount" button
  - Toggle: % or ₹
  - Input field
  - Applied after GST calculation
- [ ] Permission check: Only roles with DISCOUNT_GLOBAL can apply bill discount

### 4.6 Payment Screen
- [ ] After cart ready → "Payment" button (shows total amount prominently)
- [ ] Payment method selector: Cash, UPI (QR), Card, Credit, Mixed
- [ ] **Cash**: Numpad for amount tendered → auto-calculate change
- [ ] **UPI**: Show QR code on screen (static QR for store UPI)
- [ ] **Card**: "Card payment received" checkbox (no card machine integration yet)
- [ ] **Credit**: Requires customer selected with credit balance available
- [ ] **Mixed**: Split payment UI — cash + UPI, etc.

### 4.7 Invoice Creation & Receipt
- [ ] On payment → POST to `/api/billing` (already exists — verify)
- [ ] Generate invoice number automatically (format: `INV-YYYYMM-XXXXX`)
- [ ] Show success screen with invoice number
- [ ] **Print Receipt**: Opens print dialog for thermal printer (58mm or 80mm)
  - Receipt format: Store name, address, GSTIN, invoice #, date, items, totals, QR code
- [ ] **Email Receipt**: Send to customer email if registered
- [ ] **WhatsApp Receipt**: Send to customer phone (using WhatsApp Business API)
- [ ] "New Sale" button → clears cart, ready for next customer

### 4.8 POS State Management (Zustand)
- [ ] The `pos-store.ts` already exists with cart logic
- [ ] Enhance it to handle:
  - Hold/recall bills
  - Split bill payments
  - Real-time stock check (don't oversell)
- [ ] Persist cart state to localStorage (prevent data loss on accidental refresh)

### 4.9 Thermal Printer Integration
- [ ] Create receipt template (ESC/POS commands)
- [ ] Support 58mm and 80mm paper widths
- [ ] Create `/api/print/receipt` route
- [ ] For v1: Browser print dialog (no hardware SDK yet)
- [ ] QR code on receipt for GST invoice verification

### 4.10 Quick Actions & Keyboard Shortcuts
- [ ] F1: Focus search bar
- [ ] F2: Open customer selector
- [ ] F3: Open payment
- [ ] F4: Print last receipt
- [ ] Ctrl+H: Hold bill
- [ ] Ctrl+N: New sale
- [ ] Number keys 1-9: Add qty of first 9 search results

### 4.11 POS Dashboard Quick Access
- [ ] On dashboard → "New Sale" prominent card (already exists)
- [ ] "Recent Sales" list with "New Sale" per row
- [ ] Quick stock alert widget

---

## Deliverable
A retailer can complete a sale in under 60 seconds: scan barcode → total appears → collect cash → print receipt. Zero training required.

---

## What Already Exists (Read Before Starting)
- Dashboard at `src/app/(dashboard)/dashboard/page.tsx`
- "New Sale" button linking to `/dashboard/billing/new`
- `src/stores/pos-store.ts` with cart state management
- `/api/billing` route for creating invoices (POST + GET)
- `/api/products` route (GET with search, category filter)
- `/api/customers` route (GET with search)

## ✅ COMPLETED

### 4.1 POS Screen Layout ✅
- [x] `/dashboard/billing/new/page.tsx` — full split-screen layout (60/40)
- [x] Header with "Current Bill" + item count badge
- [x] Customer badge when customer selected

### 4.2 Product Search & Add to Cart ✅
- [x] Search bar auto-focuses on page load (`ref={searchRef}`)
- [x] Searches by name, SKU, barcode via `/api/products?search=`
- [x] Category filter badges from API response
- [x] Click product card to add to cart
- [x] Debounced search (300ms)
- [x] Shows loading spinner and "no products" empty state
- [x] "Add products in catalog first" message when no results

### 4.3 Cart Panel ✅
- [x] Shows: name, SKU, qty +/-, unit price, discount, total
- [x] Swipe/delete via X button, qty via +/-
- [x] Running subtotal, GST, discount, total displayed
- [x] "Hold Bill" button → opens hold dialog
- [x] "Clear Cart" with confirmation (instant clear, no dialog)

### 4.4 Customer Selection ✅
- [x] Walk-in Customer as default
- [x] "Select Customer" button → opens dialog
- [x] Search by phone via `/api/customers?search=`
- [x] Shows customer name, phone, outstanding balance warning
- [x] "Walk-in Customer" button to deselect

### 4.5 Discounts ✅
- [x] Bill-level discount input with ₹/% toggle
- [x] Discount applied after GST (proportional)

### 4.6 Payment Screen ✅
- [x] Payment dialog shows total amount prominently
- [x] Payment mode selector: Cash, UPI, Card, Mixed
- [x] Payment note field
- [x] Loyalty points display (if customer selected)

### 4.7 Invoice Creation & Receipt ✅
- [x] On payment → POST to `/api/billing` with full cart data
- [x] Invoice number auto-generated via `generateInvoiceNumber`
- [x] Success screen with green checkmark
- [x] Receipt preview dialog after sale
- [x] Print button opens browser print dialog
- [x] "New Sale" clears everything for next customer

### 4.8 POS State Management ✅
- [x] Zustand store already exists with cart logic
- [x] Hold/recall bills via `holdBill`, `recallBill`, `deleteHeldBill`
- [x] Cart persists via `persist` middleware
- [x] Partial persists `currentStoreId`, `currentUserId`, `heldBills`

### 4.9 Thermal Printer ✅
- [x] `/api/print/receipt` route — generates 80mm HTML receipt
- [x] Store name, address, GSTIN header
- [x] Invoice number, date, customer details
- [x] Items table: name, qty, rate, amount
- [x] Subtotal, discount, GST, round-off, total
- [x] Payment method + reference
- [x] Footer: "Thank you" + OmniBIZ branding
- [x] 80mm print CSS media query

### 4.10 Keyboard Shortcuts ✅
- [x] F1: Focus search bar
- [x] F2: Open customer selector
- [x] F3: Open payment (when cart has items)
- [x] F4: Open receipt (when invoice created)
- [x] Ctrl+H: Hold bill (when cart has items)
- [x] Ctrl+N: New sale (clear cart)
- [x] Enter in customer search: triggers search

## Remaining (Phase 2)
- Barcode scanner hardware integration
- Real numpad for cash amount tendered + auto-change calculation
- Split payment UI (Mixed mode)
- QR code on receipt for GST invoice verification
- WhatsApp receipt via WhatsApp Business API
- Email receipt via Resend
- Per-item discount edit modal (tap item → edit)
- Real-time stock check (don't oversell)
- POS dashboard widget with quick access and recent sales

## File Structure Created
```
src/app/(dashboard)/billing/new/page.tsx  # Main POS screen (rewritten)
src/app/api/print/receipt/route.ts        # Receipt HTML generator
```

See [CLARIFICATIONS.md](./CLARIFICATIONS.md) for:
- ASCII layout diagram
- Keyboard shortcut implementation
- Receipt template format

## Dependencies
- Day 3 (onboarding creates store + user)
- Day 5 (products must exist in catalog for POS to find them)
- Existing `/api/billing` route (POST + GET)
- Existing `/api/products` route (GET with search/category)
- Existing `/api/customers` route (GET with search)
- Existing `pos-store.ts` (Zustand)
