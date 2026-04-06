# Day 6: Customers, Vendors & Data Management

## Goal
A retailer can manage their customer list (for loyalty/credit) and vendor list (for purchases). Walk-in customers auto-register on first sale.

---

## Why This Day Matters
Even if a retailer only sells to walk-ins, having customer management enables:
- GST-compliant B2B invoices (need customer GSTIN)
- Customer loyalty points
- Credit sales tracking
- Purchase history

---

## Tasks

### 6.1 Customers Page (`/dashboard/customers`)
- [ ] The customers page exists. Audit and enhance:
  - List view: name, phone, type (retail/wholesale), credit balance, loyalty points
  - Search by phone (most common search)
  - "Add Customer" button
  - Filter: All, Retail, Wholesale, Has Outstanding
  - Export to CSV

### 6.2 Add/Edit Customer Dialog
- [ ] Fields:
  - First Name (required)
  - Last Name
  - Phone (required, unique) — used as primary identifier
  - Email
  - GSTIN (optional, validated if provided)
  - Customer Type: Retail / Wholesale
  - Credit Limit (₹) — max credit allowed
  - Address, City, State, PIN
  - Loyalty Points (readonly, earned from purchases)
  - Notes
- [ ] GSTIN auto-validate format (15 chars, valid state code)

### 6.3 Walk-In Customer Auto-Registration
- [ ] When creating invoice without customer selection → use "Walk-in Customer"
- [ ] Walk-in customer: id = "WALKIN", name = "Walk-in Customer" (system record, not deletable)
- [ ] If retailer wants to convert walk-in to registered: from invoice → "Register this customer" action

### 6.4 Customer GSTIN for B2B Invoices
- [ ] If customer has GSTIN → enable B2B invoice type
- [ ] Show GSTIN on invoice (required for GSTR-1)
- [ ] Validate GSTIN format before allowing B2B sale

### 6.5 Customer Credit Management
- [ ] Show outstanding balance on customer card
- [ ] In POS: if credit customer selected → show "Outstanding: ₹X" warning
- [ ] "Pay Outstanding" button → record payment received
- [ ] Customer statement: list of all invoices + payments

### 6.6 Loyalty Points
- [ ] Each sale: earn points = (total amount × loyalty multiplier) / 100
- [ ] Default multiplier: 1 point per ₹100 (configurable in settings)
- [ ] Redeem points: 1 point = ₹1 (configurable)
- [ ] "Redeem Points" in POS: apply as discount
- [ ] Customer card shows: Points balance, Points value (₹)

### 6.7 Vendors Page (`/dashboard/vendors`)
- [ ] The vendors page exists. Enhance:
  - List view: name, phone, email, GSTIN, outstanding balance
  - "Add Vendor" button
  - Search + filter
  - Export to CSV

### 6.8 Add/Edit Vendor Dialog
- [ ] Fields:
  - Name (required)
  - Phone, Email
  - GSTIN, PAN
  - Address, City, State, PIN
  - Bank Name, Account Number, IFSC
  - Credit Period (days) — default payment terms
  - Notes

### 6.9 Vendors API
- [ ] GET `/api/vendors`: List with pagination, search
- [ ] POST `/api/vendors`: Create
- [ ] PUT `/api/vendors/[id]`: Update
- [ ] DELETE `/api/vendors/[id]`: Soft delete

### 6.10 Customers API
- [ ] GET `/api/customers`: List with pagination, search, filter
- [ ] POST `/api/customers`: Create
- [ ] PUT `/api/customers/[id]`: Update
- [ ] DELETE `/api/customers/[id]`: Soft delete
- [ ] GET `/api/customers/[id]`: Get with invoice history
- [ ] POST `/api/customers/[id]/redeem-points`: Redeem loyalty points

---

## Deliverable
A retailer can manage customers (retail + wholesale) with GSTIN for B2B invoicing and credit tracking. Vendors are ready for purchase orders.

---

## Dependencies
- Day 4 (POS needs customer selector)
- Day 5 (products needed for purchases)
- Existing customer/vendor pages
