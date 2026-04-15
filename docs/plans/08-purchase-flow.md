# Day 8: Purchase Orders & Stock Replenishment

## Goal
A retailer can record purchases from vendors, receive stock, and track inventory replenishment. This keeps stock levels accurate for POS.

---

## Why This Day Matters
Inventory accuracy depends on purchase recording. Without this:
- POS shows wrong stock levels
- Retailer oversells or undersells
- GST input credit is missed

---

## Tasks

### 8.1 Purchase Orders Page (`/dashboard/inventory?tab=purchase`)
- [ ] Add "Purchase" tab to inventory section
- [ ] List: Purchase orders + invoices
- [ ] Status tabs: All, Pending, Received, Cancelled
- [ ] "New Purchase Order" button

### 8.2 Create Purchase Order
- [ ] Select vendor (from vendor list)
- [ ] Select store
- [ ] Add line items: Select product → qty → unit price → GST rate → auto-calculate totals
- [ ] Auto-fetch GST rate from product HSN
- [ ] Expected delivery date
- [ ] Notes
- [ ] Save as Draft / Send to Vendor / Create Invoice Directly

### 8.3 Goods Receipt Note (GRN)
- [ ] When goods arrive: open PO → "Receive Goods"
- [ ] Enter received qty (may differ from ordered qty)
- [ ] For partial receipts: create backorder automatically
- [ ] If all received: mark PO as "Received"

### 8.4 Purchase Invoice
- [ ] Create from PO (after receiving) or standalone
- [ ] Fields:
  - Vendor
  - Invoice number (from vendor)
  - Invoice date
  - Store
  - Line items (from PO or manual)
  - Batch/expiry dates (if applicable)
  - Subtotal, GST, total
- [ ] Match PO → Invoice → GRN (three-way matching)
- [ ] Record payment: Full, Partial, Credit

### 8.5 Stock Update on Purchase
- [ ] On purchase invoice creation → auto-update inventory stock:
  - Quantity increases
  - Location: primary store location
  - Batch/expiry: recorded per line item
  - LastStockUpdate timestamp
- [ ] Create stock movement record: PURCHASE

### 8.6 Vendor Payments
- [ ] Track outstanding payments to vendors
- [ ] "Pay Vendor" → record payment (cash, bank transfer)
- [ ] Vendor ledger: all invoices + payments

### 8.7 Purchase API
- [ ] GET `/api/purchases`: List orders + invoices
- [ ] POST `/api/purchase-orders`: Create PO
- [ ] PUT `/api/purchase-orders/[id]`: Update/receive
- [ ] POST `/api/purchase-invoices`: Create invoice
- [ ] POST `/api/purchase-invoices/[id]/receive`: GRN
- [ ] GET `/api/vendors/[id]/ledger`: Vendor account statement

### 8.8 Low Stock Alerts Integration
- [ ] Dashboard widget: "4 items below reorder level"
- [ ] Click → takes to purchase page with low-stock items pre-loaded
- [ ] "Create Purchase Order" from low-stock list

---

## Deliverable
A retailer can record purchases, receive stock, and maintain accurate inventory — ensuring POS always shows correct stock levels.

---

## Dependencies
- Day 5 (products catalog)
- Day 6 (vendors)
- Day 7 (reports)
