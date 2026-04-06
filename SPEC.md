# OmniBIZ - Multi-Tenant POS & Billing SaaS

## 1. Product Vision

A **cloud-first, subscription-based SaaS** enabling Indian retailers (electronics, clothing, groceries incl. fresh items) to:
- Spin up a fully configured store in **minutes, not days**
- Manage **multiple storefronts/locations** under one account
- Configure **customizable role-based personas** without IT overhead
- Handle **GST-compliant billing**, inventory, and operations

---

## 2. SaaS Architecture

### 2.1 Multi-Tenant Model
| Concern | Design |
|---|---|
| Isolation | Row-level isolation with RLS (Row Level Security) |
| Subscription | Per-store pricing tiers (Starter, Pro, Enterprise) |
| White-label | Optional custom domain / branding per tenant |
| Data residency | India region |

### 2.2 Subscription Tiers
- **Launch** (₹999/mo): 1 store, 3 users, basic billing, GST billing, inventory tracking
- **Grow** (₹2,499/mo): 3 stores, 10 users, full inventory, multi-payment, customer management, reports
- **Scale** (Custom): Unlimited stores/users, API access, custom roles, white-label, franchise mode

---

## 3. Onboarding & Setup

### 3.1 Website → Signup → Store Activation
```
Landing Page → Plan Selection → Payment (Razorpay/UPI/Net Banking)
→ Store Wizard → Role Config → Ready in <10 mins
```

### 3.2 Store Creation Wizard

**Store Type:**
- Electronics showroom
- Clothing boutique / apparel
- Supermarket / Grocery (with/without fresh items)
- Multi-category retail
- Wholesale / Distributor
- Restaurant / Food Service

**Store Details:**
- Business name, PAN, GSTIN (validated via GST API)
- Address, State, PIN
- FSSAI license (for food/grocery/restaurant)
- Store timing, contact

**Inventory Mode:**
- Electronics → serial number + warranty tracking
- Clothing → size/color matrix, variants
- Grocery → batch + expiry date, unit conversion (kg/pieces/liters)
- Fresh items → mandatory expiry tracking with alerts
- Restaurant → menu with variants, combo meals, table management, KOT

### 3.3 Persona Configuration Engine

**Pre-configured Persona Sets:**

| Persona | Electronics | Grocery | Clothing | Wholesale | Restaurant |
|---|---|---|---|---|---|
| Owner/Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Store Manager | ✅ | ✅ | ✅ | ✅ | ✅ |
| Billing Operator | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inventory Manager | ✅ | ✅ | ✅ | — | ✅ |
| Vendor Manager | ✅ | ✅ | — | ✅ | ✅ |
| Vendor/Supplier | — | — | — | — | — |
| Customer Relations | ✅ | ✅ | ✅ | ✅ | ✅ |
| Warehouse Staff | ✅ | ✅ | ✅ | ✅ | — |
| Kitchen Staff | — | — | — | — | ✅ |
| Table Host | — | — | — | — | ✅ |
| Delivery Partner | — | — | — | — | ✅ |

---

## 4. Core Module Requirements

### 4.1 Store & Location Management
- Add/edit/archive stores
- Each store = independent inventory ledger, POS terminal config
- Sub-locations within store: sections, racks, cold storage, tables, kitchen stations
- Inter-store transfer

### 4.2 User & Access Management
- User invitation via email/SMS/WhatsApp OTP
- Assign persona + store access
- MFA enabled by default
- Activity audit log

### 4.3 Inventory Management

**Product Catalog:**
- Multi-category hierarchy
- Variant matrix: Size × Color × Material × Storage
- HSN/SAC code master with auto GST rate
- Barcode (EAN/UPC) generation
- Images, description, MRP, cost price, margin %

**Stock Operations:**
- Purchase Entry
- Stock Opening
- Stock Transfer
- Stock Adjustment with reason codes
- Stock Return (customer/vendor)
- Batch + Expiry Tracking
- Serial/Warranty Tracking

**Restaurant-specific:**
- Menu item with preparation time
- Combo/套餐 meals
- Ingredient-level BOM (Bill of Materials)
- Table management ( dine-in / takeaway / delivery)
- KOT (Kitchen Order Ticket) system
- Recipe management

### 4.4 Billing & Invoicing

**Invoice Types:**
- Tax Invoice (B2C / B2B)
- Retail Invoice
- Proforma Invoice
- Quotation / Estimate
- Credit Note / Debit Note
- Cash Memo
- Restaurant Bill / KOT

**GST Compliance:**
- GSTIN validation before B2B invoicing
- CGST/SGST or IGST based on state
- HSN-wise summary
- GSTR-1, GSTR-3B export (CSV/Excel)
- E-invoice generation (Phase 2)
- E-way bill (Phase 2)

**Payment Modes:**
- Cash, UPI (Google Pay, PhonePe, Paytm, BHIM), Card, Bank Transfer, Credit/Partial, Wallet
- Split payments

**Invoice Features:**
- Auto-print on thermal printer (58mm / 80mm)
- WhatsApp/Email invoice delivery
- QR code on invoice
- Multi-language (English, Hindi, Tamil, Telugu, Kannada, Malayalam)
- Round-off to nearest rupee

### 4.5 POS Interface

**Operations:**
- Quick search (barcode / name / SKU)
- Manual price override (with permission)
- Discount (% or flat — per item or per bill)
- Hold Bill / Recall Bill
- Split Bill
- Customer selection (walk-in or registered)

**Hardware Integration:**
- Thermal receipt printer
- Barcode scanner
- Cash drawer
- Weighing scale
- Second display

### 4.6 Supplier / Vendor Management
- Vendor profile
- Purchase Order
- GRN vs Purchase Invoice matching
- Vendor ledger
- Return to vendor

### 4.7 Customer Management
- Walk-in vs Registered
- Phone / WhatsApp as identifier
- Customer type: Retail / Wholesale
- Purchase history
- Outstanding / Credit
- Loyalty points
- Credit limit

### 4.8 Reporting
- Sales by store / day / shift / operator
- Sales by category / SKU
- Payment mode breakdown
- GST summary
- Stock movement
- Expiry report
- Low stock report
- Revenue trend
- Top selling items
- Export to Excel / CSV

---

## 5. Integration Requirements

| Category | Integration |
|---|---|
| Payments | Razorpay, Cashfree, Paytm, UPI QR |
| WhatsApp | Message template API |
| SMS | OTP, alerts |
| Email | Invoices, reports |
| Printer | Epson, Star, Esc/Pos printers |
| Hardware | Barcode scanner, scale, cash drawer |
| GST | ClearTax API |
| Food License | FSSAI verification |

---

## 6. Localization
- **Language**: English + Hindi + Tamil + Telugu + Kannada + Malayalam
- **Currency**: INR (₹)
- **Number format**: Indian numbering (lakhs, crores)
- **Date format**: DD/MM/YYYY
- **Fiscal year**: April → March

---

## 7. Data & Security
- Encryption at rest + in transit
- Daily backups (30-day retention)
- Role-based data isolation
- DPDP compliance (data export)
- Session management, device logging

---

## 8. Non-Functional Requirements
- **Uptime**: 99.9% SLA
- **Offline POS**: Local sync when internet drops
- **Startup time**: Store wizard → ready in <10 minutes
- **POS billing**: <3 seconds per transaction

---

## 9. Out of Scope
- Accounting GL / P&L (export to Excel/CSV instead)
- Multi-currency

---

## 10. Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS + Radix UI primitives
- **State Management**: Zustand (POS state) + React Query (server state)
- **Forms**: React Hook Form + Zod

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email, phone, OTP)
- **ORM**: Prisma
- **Realtime**: Supabase Realtime (POS live updates)
- **Storage**: Supabase Storage (product images, documents)
- **Edge Functions**: Supabase Edge Functions (Deno)
- **File Export**: Edge Functions for Excel/CSV generation

### Infrastructure
- **Hosting**: Vercel (frontend) + Supabase Cloud
- **Payments**: Razorpay
- **SMS/WhatsApp**: Twilio / MSG91

### Development
- **Monorepo**: Turbo (optional, for future micro-frontends)
- **Testing**: Vitest + Playwright
- **Linting**: ESLint
- **Prettier**: Code formatting
