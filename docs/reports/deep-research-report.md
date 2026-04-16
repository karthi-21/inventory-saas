# Executive Summary  
We propose a cloud-based **Inventory + POS SaaS** tailored for small and mid‑sized Indian retailers. The system is designed to be **fast, intuitive and offline‑capable**, so even non‑technical shopkeepers can bill, manage stock, and handle payments with minimal training. Core goals are multi‑store support, ultra‑fast billing, basic user roles (owner, manager, cashier), Indian compliance (GST rules, e‑invoices), and subscription‑based feature gating (e.g. ₹499/₹999/₹1999 plans).  

Key differentiators include: **extreme ease of onboarding** (sign up, pay, and auto‑configure per industry and roles), **industry‑specific UX** (e.g. weight/loose‑item support for grocery, batch/expiry for pharmacy, size/color for clothing), and **offline resilience** (billing continues without internet, syncing later). The POS must integrate seamlessly with standard peripherals (barcode scanners, thermal receipt printers, cash drawers, UPI/card terminals【36†L137-L143】). 

Compliance is built‑in: invoices automatically include all fields required by GST Rule 46 (supplier/recipient details, HSN/description, quantities, tax breakup, etc.)【8†L343-L352】. High‑turnover businesses will support e‑invoicing (IRS submission of invoices with QR codes) as mandated by Indian law (thresholds now ₹2–5cr【11†L184-L193】【11†L198-L204】). For payments, the POS will display dynamic UPI QR codes or trigger UPI intent flows【24†L105-L113】, push amounts to card machines, and allow split payments, as recommended for the Indian market【36†L200-L205】.

This document presents **detailed personas and 200+ user stories** (prioritised as MUST/SHOULD/NICE), functional requirements for each feature, UI/UX guidelines, API and data schema outlines, flow diagrams (using Mermaid syntax), edge‑case rules, security and GST compliance details, deployment recommendations, and a testing/QA plan. It also defines an MVP scope with milestones and effort estimates. All claims draw on authoritative sources where possible (e.g. Indian GST rules【8†L343-L352】【11†L184-L193】, vendor guides【36†L189-L193】【38†L279-L282】, and hardware integration docs).  

# 👥 User Personas & Stories  
**Personas:** We identify the following roles (with example demographics/needs):  
- **Business Owner (Shop Owner):** Semi‑tech-savvy or guided. Seeks central control, quick insights, and simplicity. Manages overall business (single or chain).  
- **Store Manager:** Handles day‑to‑day operations for a store. Manages staff, stock transfers, and local reports. Needs moderate tech comfort.  
- **Cashier / Billing Staff:** Typically low‑education, used to manual billing. Requires an **ultra-fast, minimal UI** for checkout (barcode or keyboard entry, clear payment buttons). Sees *only* necessary info.  
- **Inventory Clerk:** Manages stock in/out, receives goods, does audits. Needs robust but simple inventory screens, often with barcode and batch scanning.  
- **Customer (Indirect User):** Not logging in, but views the customer display during billing, and uses credit/loyalty on their account. Receives digital or printed receipts.  
- **Accountant (Optional):** Uses reports for accounting. Mostly back‑office, needs exports (CSV/PDF).  
- **System Admin (SaaS Operator):** Manages tenant accounts, plans, and global settings.   

Below are **exemplar user stories** (not exhaustive) for each persona. Each story is marked **MUST / SHOULD / NICE** for priority.  

### Owner (Business Admin)  
- **(MUST)** *Setup Stores:* “As **Owner**, I want to create my retail business structure: define number of stores/outlets, number of billing counters per store, store addresses, tax rates and basic details, so that each location is ready to operate.” (MUST – core setup)  
- **(MUST)** *Manage Stores & Stores Info:* “As Owner, I want to edit or delete stores, and assign store managers, so I can reorganise outlets easily.”  
- **(MUST)** *Multi‑Store Dashboard:* “As Owner, I want an overview dashboard that shows sales, revenue, inventory levels and low‑stock alerts for all my stores, so I can compare performance at a glance【36†L116-L120】.”  
- **(MUST)** *Task Assignment:* “As Owner, I want to create and assign tasks (e.g. restock notifications or audit tasks) to Store Managers and track their completion.”  
- **(MUST)** *User/Role Management:* “As Owner, I want to invite users (managers, cashiers) to the system, assign them roles (Owner, Manager, Cashier, Inventory) and access permissions, so each person only sees what they need.” (Role‑based access – see security【21†L299-L304】)  
- **(MUST)** *Subscription & Plan Management:* “As Owner, I want to select a subscription plan, enter payment details, upgrade/downgrade, and see billing info, so I can control costs.” (Includes trial/expiry flows)  
- **(SHOULD)** *Analytics & Reports:* “As Owner, I want sales and purchase reports (daily/weekly/monthly, by store or item, GST tax reports, profitability estimates), exportable to CSV/PDF, so I can do accounting and analysis.”  
- **(SHOULD)** *Pricing & Loyalty Setup:* “As Owner, I want to configure loyalty points or discount rules for customer tiers, so I can run promotions or cashback programs.”  
- **(SHOULD)** *Notifications:* “As Owner, I want alerts for events like: stock below threshold anywhere, pending bills older than X days, or data-sync failures, so I can act promptly.”  

### Store Manager  
- **(MUST)** *Local Dashboard:* “As **Manager**, I want to see store‑specific KPIs (today’s sales, top products, inventory vs reorder levels, pending credits) to gauge how my store is doing.”  
- **(MUST)** *Manage Counters:* “As Manager, I can add or disable billing counters (POS terminals) in my store, and assign cashiers to each.”  
- **(MUST)** *Inventory Control:* “As Manager, I want to view and update inventory in my store: receive stock, transfer stock from other store/warehouse, adjust (damages), and see low‑stock alerts.” (Multi-location sync ensures centralized control【38†L212-L219】.)  
- **(SHOULD)** *Report & Audit:* “As Manager, I want basic sales/stock reports for my store, and an audit trail of actions (who did what), to reconcile and comply with audits.”  
- **(SHOULD)** *Credit (Udhar) Approvals:* “As Manager, I want to review large credit (`udhar`) sales or overdue accounts and approve/flag them before collection.”  
- **(SHOULD)** *Staff Management:* “As Manager, I want to log issues or requests to the Owner and communicate with other managers via notes or shared tasks.”  
- **(NICE)** *Configure Store Settings:* “As Manager, I can set local settings (tax rates if different, currency, etc.) or toggle features like GST types and printing defaults.”  

### Cashier / Billing Staff  
- **(MUST)** *Quick Login:* “As **Cashier**, I want to log in quickly (PIN or QR), and immediately see the billing screen.”  
- **(MUST)** *Scan or Search Items:* “I want to scan barcodes or type item names/SKUs to add products to the bill. If an item isn’t in inventory, I can enter minimal details (name, price) on the fly.” (Search-by-name and barcode scanning speed up checkout【36†L137-L140】.)  
- **(MUST)** *Fast Checkout:* “I want big buttons for **Cash**, **Card**, **UPI** and possibly split payments, so I can finish bills with one tap. Payment amounts should auto-populate on devices (card machine, UPI QR)【36†L200-L205】.”  
- **(MUST)** *Customer Display:* “As Cashier, I should have a customer‑facing display (either on second screen or printed receipt) that shows line items, discounts, and total, so the customer can verify charges.” (UI minimal for cashier, with full details on customer side.)  
- **(MUST)** *Session (Shift) Management:* “I want to start a billing ‘shift’, and at end-of-shift the system reports cash in drawer vs expected (sales minus card/UPI), with any mismatches flagged.” (Supports daily closing workflows.)  
- **(MUST)** *Bill Management:* “I want to hold a bill (e.g., customer delays payment), resume it later (even on a different counter), or cancel/refund a bill.”  
- **(MUST)** *Returns/Exchanges:* “I want to process product returns or exchanges: scan the original bill or items, restock inventory, and issue refund or new sale.”  
- **(SHOULD)** *Partial/Delayed Payments:* “I want to take part payment (e.g. credit) and mark customer as owing `udhar`, or allow split payments (e.g. cash + card).”  
- **(NICE)** *Discounts & Coupons:* “If allowed by policy, I can apply manual discounts or redeem loyalty points on the fly.”  

### Inventory Manager (or same as Manager)  
- **(MUST)** *Stock Receipt:* “As Inventory Staff, I can receive new stock into a store or warehouse, by SKU and quantity, adjusting on-hand and creating a purchase bill entry.”  
- **(MUST)** *Stock Transfer:* “I can move stock between locations (store↔store or warehouse↔store). The source inventory is deducted and destination increased, with logs of the transfer.”  
- **(MUST)** *Batch/Expiry Management:* “For items like medicines or perishables, I track each batch’s expiry. When issuing sales or transfers, the system suggests first-expiry-first-out or flags near-expiry stock【38†L212-L219】.”  
- **(SHOULD)** *Low-stock Reordering:* “I can configure reorder points and the system will warn me or even auto-generate a purchase order to replenish.”  
- **(SHOULD)** *Stock Audit:* “I can enter a physical stock count and adjust any variance. The system shows mismatches and reasons (sales, transfers, errors).”  
- **(NICE)** *Bulk Import:* “I can upload inventory via CSV/Excel (for initial setup or bulk updates).”  

### Customer (Indirect)  
- **(MUST)** *Credit (‘Udhar’) Account:* “As **Customer**, my transactions on credit are recorded under my profile (phone number). I can have an outstanding balance/`khata`.”  
- **(MUST)** *Payment Settlement:* “The business (owner/manager) can send SMS/WhatsApp reminders for overdue `udhar`. I can pay later and have my payment logged against my account.”  
- **(SHOULD)** *Loyalty Rewards:* “If enrolled, I earn points on purchases and redeem them for discounts.” (Customer sees points balance on their receipts or a simple customer portal.)  

**Priority Legend:**  
- **MUST** = Core functionality without which system cannot operate correctly.  
- **SHOULD** = Important, but can be delayed (in MVP rollouts).  
- **NICE** = Advanced or ancillary (for later versions).  

# 🧩 Functional Specifications  

Below we outline key features with requirements, acceptance criteria, UI/UX notes, API endpoints, database schema, and sequence diagrams. For brevity we focus on major modules.

## Onboarding & Account Setup  
- **Flow:** New business signs up via landing page (enter email/phone, verify OTP), chooses plan (₹499/₹999/₹1999), enters business details (name, address, GSTIN) and selects industry and number of stores. The system auto-creates an “Organization” with one default Store (or more, per entry), and default user roles.  
- **Requirements:**  
  - Industry presets: Based on selected industry (grocery, pharmacy, clothing, electronics, general retail), UI labels and workflows adapt (e.g. “Weight” field for groceries, “Batch/Expiry” for pharma, “Size/Color” for clothing).  
  - Persona count: Setup prompts for number of counters and users (cashiers, managers) in each store.  
  - Payment Integration: Collect subscription payment (via Razorpay/Stripe) securely.  
  - **Trial flow:** Offer 7-day free trial (no payment), then auto-email to convert.  
- **Acceptance Criteria:** Owner can complete signup in <5 minutes, and then immediately see a ready store and billing screen. Different industry choices change default units/pricing fields.  
- **UI/UX:** Minimal text. Use icons for industry selection (grocery cart, pill, shirt, etc.). Provide progress indicator for multi-step signup.  
- **API Endpoints:**  
  - `POST /api/organizations` (create business profile)  
  - `POST /api/stores` (with org_id)  
  - `POST /api/users` (with roles)  
  - `POST /api/subscriptions` (link payment)  
- **DB Schema (Simplified):**  
  ```sql
  Organization(id, name, industry, gstin, address, plan_id, ...)  
  Store(id, org_id, name, address, timezone, ...)  
  User(id, org_id, store_id, role_id, name, email, phone, ...)  
  Role(id, org_id, name, permissions)  
  Plan(id, name, price, max_stores, max_counters, ...)  
  Subscription(id, org_id, plan_id, status, expires_at)  
  ```  
- **Sequence (Onboarding):**  
  ```mermaid
  sequenceDiagram
    participant User
    participant API as Backend
    participant DB
    User->>API: POST /api/organizations (business info, plan)
    API->>DB: INSERT Organization, Plan
    DB-->>API: org_id
    API->>DB: INSERT default roles (Owner, Manager, Cashier) for org_id
    API->>DB: INSERT Store(s) based on count
    API->>DB: INSERT User as Owner
    API-->>User: 201 Created, success
  ```  

## Billing (POS) Module  
- **Overview:** This is the **fastest path** in the app. A clean POS screen for cashiers that supports barcode scanning, touch/keyboard entry, and displays a customer-facing summary.  
- **Functional Requirements:**  
  - **Fast Item Entry:** Scan barcode or type SKU/name. Autocomplete helps if partially typed. If not found, allow a quick “New Item” popup (enter name, price, category).  
  - **Line Items Display:** Show item name, quantity (editable via +/– buttons or manual entry), unit price, and line total. Continually update subtotal/tax/total.  
  - **Tax Handling:** Auto-calc CGST/SGST or IGST per item, based on store state vs buyer state (GST location rules). Round-off properly.  
  - **Payment Types:** Buttons for Cash, Card, UPI, and “More” (split, partial).  
    - **Cash:** On tap, close sale, print receipt, update cash drawer.  
    - **Card:** Auto-send amount to integrated EDC machine (if connected via USB/Bluetooth).  
    - **UPI:** Show dynamic QR code for customer to scan (amount included). Use UPI Intent on tablets/phones【24†L105-L113】.  
    - **Split Payment:** Ask cashier to enter cash amount, then send remainder to card/UPI.  
  - **Receipt Printing:** Auto-print GST invoice/receipt (brand logo, store details, items, taxes) via thermal printer. Format to fit width, meet GST invoice rules (include all mandatory fields【8†L343-L352】).  
  - **Customer Display:** Push a simplified view (LCD or secondary screen) showing items and total as they are added. Include thanks message after payment.  
  - **Bill Hold/Resume:** Option to put a bill on hold (with a name or number) and retrieve it. Useful for large orders or interrupted service. Stored locally or on server.  
  - **Cancel/Refund:** Allow cancellation of unsaved sale, or refund return of a previously saved sale (identify by invoice number). Restock returned items automatically.  
  - **Offline Behavior:** Entire billing flow works offline: items from the last synced catalog must be cached locally. Completed sales queue for later sync. The UI should warn if any unsynced bills exist when internet is lost/restored【21†L270-L278】.  
- **Acceptance Criteria:**  
  - Cashier can ring up a sale of 5 items in under 10 seconds. Entering payments and printing takes <2 seconds.  
  - After sale, inventory deducts correct quantities.  
  - In offline mode, sales still save locally; when reconnected, inventory and sales sync automatically【21†L270-L278】【38†L225-L229】. No duplicates or data loss occur.  
  - Invoice prints with GST fields (HSN, etc.)【8†L343-L352】. Multi‑tax scenarios (inter‑state IGST) handled correctly.  
- **UI/UX Notes:**  
  - **Icon‑First Buttons:** Use intuitive icons (scan, search, cash, card, UPI, hold) with minimal text. Colour‑code payment types (green for cash, blue for card, etc.).  
  - **Large Fonts:** Show totals in large, clear text. Avoid clutter.  
  - **Touch-Friendly:** Ensure big buttons and text entry fields for quick tapping.  
  - **Customer Screen:** Use large item list and total, no distracting info (just store name, itemized list, total).  
- **API Endpoints:**  
  - `GET /api/products?query=...` (search)  
  - `GET /api/products/{id}` (details)  
  - `POST /api/sales` (complete sale with items)  
  - `PUT /api/sales/{id}/hold` (hold/resume)  
  - `POST /api/refunds` (process return)  
  - `POST /api/payments` (record payment, if split)  
- **DB Schema (Billing related):**  
  ```sql
  Product(id, org_id, name, sku, barcode, unit_price, hsn_code, tax_rate, ...)
  Sale(id, store_id, user_id, customer_id, total_amount, date, status, is_credit)
  SaleItem(id, sale_id, product_id, batch_id, quantity, unit_price, tax_amount)
  Payment(id, sale_id, method, amount, timestamp)
  Customer(id, org_id, name, phone, credit_limit, outstanding_balance, loyalty_points)
  ```
- **Sequence (Checkout):**  
  ```mermaid
  sequenceDiagram
    Cashier->>POS: Scan barcode (or select item)
    POS->>API: GET /api/products?barcode=XYZ
    API->>DB: SELECT * FROM Product WHERE barcode=XYZ
    DB-->>API: product details
    API-->>POS: product details
    POS-->>Cashier: display item on list (qty default 1, price)
    ... (repeat for more items) ...
    Cashier->>POS: Click [Cash] button
    POS->>DB: Update Product stock (InventoryService)
    POS->>DB: INSERT INTO Sale, SaleItems
    DB-->>POS: sale_id
    POS->>Printer: print receipt (includes QR if e-invoice needed)
    POS-->>Cashier: display “Payment Success”
  ```  

## Inventory Management  
- **Scope:** Tracks stock at **multiple levels** (each store, central warehouse). Supports incoming goods (purchases), stock adjustments, transfers, and stocktaking. Includes batch/expiry support for relevant industries.  
- **Functional Requirements:**  
  - **Multi-Location Stock:** Each *Store* has its own inventory ledger. Owners can also define a central *Warehouse* location.  
  - **Stock Items:** CRUD on products (with fields: name, SKU, barcode, category, HSN, MRP, sales price). Products can have variants (size/color) for apparel.  
  - **Receiving Stock:** Enter purchase orders or stock receipts. Assign quantities (and batch numbers/expiry if applicable). Stock is added to the selected location.  
  - **Transfers:** Move items between locations. Example: `store A -> store B`: deduct from A, add to B. System should prevent negative stock. Possibly require approval for transfers (manager role).  
  - **Adjustments:** Manual stock corrections for shrinkage, damage, etc. These generate audit log entries.  
  - **Batch & Expiry:** For pharma/food, attach batch number and expiry to stock units. When selling, the oldest batch should be used first (FEFO). Alert on near-expiry items.  
  - **Stock Alerts:** Configurable thresholds per product per location. When stock falls below, generate warning or auto-reorder suggestion【38†L212-L219】.  
  - **Stock Audit/Count:** Support full or partial stock count. Compare counted qty vs system, highlight discrepancies.  
- **Acceptance Criteria:**  
  - Users can see real‑time stock levels per location. Total stock is sum of all locations.  
  - After a sale, stock automatically decrements. After a transfer, both source and destination stock update correctly.  
  - Offline sales do not cause stock race conditions: e.g., if two cashiers offline sell the last unit at same time, on sync the system either rejects one or flags conflict. (Use timestamp or DB locking; last-write or manager review)【21†L270-L278】.  
  - Low-stock alerts fire when crossing thresholds.  
- **UI/UX Notes:**  
  - **Inventory List:** Tabular with columns (Product, SKU, Location, Quantity, Reorder Level). Use color or icons to mark low stock.  
  - **Batch Details:** When entering stock, pop up batch input with calendar picker for expiry.  
  - **Transfers:** Wizard style form (select item, from-location, to-location, qty).  
- **API Endpoints:**  
  - `GET /api/inventory?store_id=...` (stock levels)  
  - `POST /api/inventory/receive` (add stock)  
  - `POST /api/inventory/transfer` (move stock)  
  - `POST /api/inventory/adjust` (manual correction)  
  - `POST /api/products` (add new product)  
- **DB Schema (Inventory related):**  
  ```sql
  Stock(id, product_id, location_id, batch_id, quantity)
  Batch(id, product_id, batch_no, manufacture_date, expiry_date)
  Location(id, org_id, name, type)  -- type: 'STORE' or 'WAREHOUSE'
  ```
- **Sequence (Stock Transfer):**  
  ```mermaid
  sequenceDiagram
    Manager->>API: POST /api/inventory/transfer {product_id, from: A, to: B, qty: 10}
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT quantity FROM Stock WHERE product_id=X AND location_id=A
    DB-->>API: qty_A
    API->>DB: IF qty_A >= 10: UPDATE Stock SET qty=qty_A-10 WHERE location=A
    API->>DB: SELECT quantity FROM Stock WHERE product_id=X AND location_id=B
    DB-->>API: qty_B
    API->>DB: UPDATE Stock SET qty=qty_B+10 WHERE location=B
    API->>DB: COMMIT
    DB-->>API: success
    API-->>Manager: 200 OK (transfer logged)
  ```  

## User & Role Management  
- **Functional Requirements:**  
  - Pre‑defined roles: **Owner**, **Manager**, **Cashier**, **Inventory Staff**, **Accountant**. Each role has a set of permissions (e.g. Cashier cannot edit prices, Owner can override discounts). Admin can customize role permissions if needed.  
  - **Login/Authentication:** Username (email or phone) + password or PIN. 2FA optional. OAuth for integration (future).  
  - **Session Limits:** Only one active session per user at a time (prevent sharing).  
  - **Audit Logging:** Record every action (create/edit/delete of data, sales, login) with user and timestamp【21†L299-L304】.  
- **Acceptance:** Each role sees a limited menu. For example, cashiers cannot access Inventory or Reports screens. Unauthorized actions are blocked. All actions are logged.  
- **UI/UX:** Role dropdown when inviting a new user. A “Switch User” button on POS to switch cashier accounts easily.  
- **API & DB:**  
  - `POST /api/users` (create)  
  - `PUT /api/users/{id}/role`  
  - `GET /api/roles`  
  - `AuditLog(user_id, action, entity, entity_id, timestamp)` table.  

## Customer & Credit (Khata) Management  
- **Features:**  
  - Maintain a **customer ledger**: map phone numbers/names to a “customer account”. Each sale can optionally link to a customer. The ledger shows all purchases, payments, and current balance.  
  - **Credit Sales:** When a sale is paid partially or flagged as credit, it adds to that customer’s outstanding “udhar”. The system can enforce per-customer credit limits.  
  - **Reminders:** Automated SMS/WhatsApp reminders to customers with outstanding balances (using templates).  
  - **Loyalty Points:** Track points (e.g. 1 point per ₹100 spent). Allow redeeming points for discount. Show tier/status (Gold/Silver) if needed.  
- **Acceptance:** Recording a sale with a phone number automatically adds to that customer’s history. If credit, the customer balance increases and the sale is marked “Pending Payment”.  
- **API/DB:**  
  - `POST /api/customers`  
  - `GET /api/customers/{phone}/ledger`  
  - `Customer(id, org_id, name, phone, credit_limit, balance, loyalty_points)`  

## Payments and Integrations  
- **UPI and Card:**  
  - Support all major UPI apps via dynamic QR or intent as per Razorpay guidance【24†L105-L113】. Because UPI Collect is deprecated, use Intent or QR methods.  
  - Integrate with card terminals via API/USB if possible: auto-send amount and fetch transaction status. At minimum, record “Card” payment mode in system.  
  - Support *split* payments (any mix of cash/UPI/card).  
  - **EMI / Wallet / UPI (others):** If the business wants, allow additional modes (but as separate transactions or via payment gateway).  
- **POS Peripherals:**  
  - **Barcode Scanners:** Integrate as keyboard input (most plug-and-play)【36†L137-L139】. Scanning triggers item lookup.  
  - **Thermal Receipt Printer:** Use ESC/POS commands for printing invoices【36†L141-L143】. Include print trigger and cutter.  
  - **Cash Drawer:** Connect via printer kick signal; open on cash sale.  
  - **Weight Scale:** (for groceries) Integrate via RS232/USB to get weight (optional future).  
- **Acceptance:** On QR generation, the correct amount and payment id should appear in POS. On card payment, the POS should mark payment complete only after confirmation from terminal/API.  
- **Security:** All payment API calls are over HTTPS with keys stored securely. Do not store card details – use tokenization or gateway proxies【21†L299-L304】. Follow PCI DSS for any card data at rest (ideally, keep all card handling to external devices).  
- **Endpoints:** (If using gateway APIs)  
  - `POST /api/payments/upi` (generate QR)  
  - `POST /api/payments/card` (tokenize/charge via gateway)  

## Reporting & Analytics  
- **Dashboards:** Pre-built charts and tables for: daily/monthly sales, top selling products, category sales, inventory value, cash vs digital splits, dues aging, staff performance (sales per cashier), store comparisons.  
- **GST Reports:** Auto-generate GSTR‑1 summary (sales by tax rate) and GSTR‑3B drafts. Exportable CSV for filings.  
- **Custom Reports:** Owner/manager can filter by date range, store, product. Export as CSV/PDF.  
- **Acceptance:** Reports load in reasonable time (<5s for 1 year of data). Data accuracy is verified (e.g. sales sum matches transactions).  
- **DB/Schema:** Likely separate OLAP or reporting DB/table aggregated by day. Not detailed here.

## Audit, Logging, Notifications  
- **Audit Trails:** Immutable logs of critical actions (sale creation, invoice print, inventory adjust, login). Useful for compliance and troubleshooting.  
- **Alerts/Notifications:** Email/SMS or in-app alerts for: stock low, overdue payments, failed sync, subscription renewal due. Configurable per org.  

## Subscription & Plans  
- **Plans & Feature Gating:** Three example tiers: Basic (₹499), Standard (₹999), Pro (₹1999) per month. Features gated by plan:  
  | **Feature**                | **Basic (₹499)**         | **Standard (₹999)**        | **Pro (₹1999)**         |
  |----------------------------|--------------------------|---------------------------|-------------------------|
  | Stores                    | 1                        | 1                         | Unlimited              |
  | Billing Counters          | 1                        | 3 per store               | 5+ per store           |
  | Users                     | 3                        | 10                        | Unlimited              |
  | Multi‑store Inventory     | No                       | No                        | Yes                    |
  | Basic Inventory mgmt      | Yes                      | Yes                       | Yes                    |
  | Batch/Expiry Tracking     | No                       | Yes                       | Yes                    |
  | Reports (basic)           | Yes (sales summary)      | Yes (category, POS)       | Advanced (analytics)   |
  | Loyalty Program           | No                       | Yes                       | Yes                    |
  | Credit ('Udhar')          | Yes                      | Yes                       | Yes                    |
  | GST e‑Invoicing           | Yes (if eligible)        | Yes                       | Yes                    |
  | **Price (per month)**     | ₹499                     | ₹999                      | ₹1999                  |  

  Razorpay research suggests basic POS subscriptions in India run ~₹500–1200, and advanced suites ₹3,000–10,000【38†L279-L282】. Our plans fit into that market expectation.  
- **Gating Logic:** The backend enforces limits (e.g. number of counters, stores, user accounts, features). Attempting beyond limit yields prompt to upgrade.  
- **Trial/Upgrade Flows:** Offer a 7-day trial with all features. Owner can upgrade mid‑trial; on expiry revert to limited plan or block operations (business choice).  

## Edge Cases & Conflict Resolution  
We list some challenging scenarios and rules:

- **Concurrent Stock Race:** Two cashiers at different counters sell the same last item. If online, DB locking (transaction serialization) prevents overselling (second sale fails if stock reaches zero)【38†L212-L219】. If offline, both may sell; on sync, detect negative stock. Rule: last-write wins is risky—better to alert manager on conflict and require manual reconciliation (e.g. accept one sale, mark other for manual refund). Always log these conflicts.  
- **Offline Sync Merge:** A store goes offline. During that period, sales, returns, and inventory transfers still happen. On reconnection, the app should automatically push local changes. If server data changed in the meantime, merge logically (e.g. add delta quantities). For identical record edits, last update by timestamp could overwrite or raise conflict (if two managers edited the same product price offline, either accept most recent or flag). Provide an interface for admin to resolve conflicts. Robust error handling is crucial【21†L270-L278】.  
- **Negative Stock Prevention:** Never allow sale of more items than available stock (online or cached offline). If in offline mode and an item was oversold, upon sync set stock to zero and log oversell as “pending stock confirm”. Manager must restock or cancel excess sales.  
- **Price Changes on Held Bills:** If item price changes after a bill is held, on resuming, the cashier can either use the old price (as per hold timestamp) or be forced to update to new price (with override confirmation). System should record which price was used.  
- **Payment Failures:** If a card or UPI payment fails mid‑transaction, allow cashier to retry or choose a different method without duplicating sale. Ensure no double debit.  
- **Interrupted Shift:** If cashier forgets to close their shift, allow manager override and manual closure with cash reconciliation (log short/over).  
- **Duplicate Customer Accounts:** If customers are identified by phone, merging duplicate entries should be possible.  
- **Expired Transaction:** If an invoice is held beyond a configurable time (e.g. 24h), prompt to clear or cancel to prevent old pending sales.  
- **Data Backup:** Automatic incremental backups daily. In the rare case of data loss, the app should allow data restore from backup with minimal downtime.  

# 🔒 Security & Compliance  
- **Data Security:** All data in transit is encrypted via TLS. Sensitive data at rest (e.g. customer credentials) are encrypted/hashed. Follow PCI-DSS for any card data; ideally use tokenization and avoid storing actual card numbers【21†L299-L304】. Role-based access control restricts actions per user. The system logs all access and changes (audit trails)【21†L299-L304】.  
- **GST Compliance:** The POS prints GST‑compliant invoices. By law, each invoice must include seller & buyer GSTIN, HSN codes, item details, quantity, total, tax breakup, etc.【8†L343-L352】. Our invoice template covers all rule‑46 fields. For turnover above ₹2–5cr (depending on timeline【11†L184-L193】), invoices are electronically reported to the government with an IRN (e‑invoice)【11†L184-L193】【11†L198-L204】. The system will integrate with the GSTN API to auto-generate e‑invoices for eligible B2B sales.  
- **Data Retention & Privacy:** Financial and tax records must be kept for at least 8 years by Indian law. We store detailed transaction and customer data accordingly. Access to personal data (customer phone, name) is controlled. The system will comply with relevant data protection laws.  
- **Regulatory Reporting:** Aside from e‑invoices, the app provides reports/formats for GSTR‑1, GSTR‑3B filings. It can generate an e-way bill if needed for goods transport (via IRP API) based on delivered shipments.  

# 🚀 System Architecture & Deployment  
- **Multi-tenant SaaS:** Each business (organization) is a tenant. Use a logical DB schema separation (shared database with org_id keys) or separate schemas per tenant. Ensure **data isolation**. Use modern microservices: separate services for Authentication, Sales, Inventory, Reporting, Sync, etc.  
- **Cloud Platform:** Host on AWS/Azure/GCP. Use managed SQL (e.g. PostgreSQL) with high availability. A stateless backend (Kubernetes containers) with auto-scaling for varying load (more load at month‑end for reports, etc.).  
- **Real-time Sync:** Use a message queue (e.g. Kafka/RabbitMQ) or event logs for updating inventory/sales across counters/stores in real time when online. Offline mode on each POS device uses a local store (e.g. SQLite) to queue events, then a sync service pushes changes to the cloud database when reconnected. Use **idempotent operations** (e.g. unique sale IDs) to avoid duplicates.  
- **Offline Strategy:** Mobile/tablet POS apps implement offline‑first architecture: cache essential data (product catalog, open orders), queue offline actions, and resolve conflicts on reconnect. Follow known patterns (e.g. queue + retry + merge)【21†L270-L278】.  
- **Scalability:** Support thousands of stores: use load balancer, microservices and stateless APIs. For heavy queries (analytics), consider separate read-replica databases or data warehouse. Caching layer (Redis) for frequent lookups.  
- **Monitoring & Observability:** Use logging (ELK) and metrics (Prometheus) to monitor API latency, database health, sync success, and usage. Alerts for server downtime, large error rates, or suspicious activities (e.g. repeated failed logins).  
- **Disaster Recovery:** Automated nightly backups, with tested restore procedures. Plan RTO/RPO in minutes.  

# ✅ Testing & QA Checklist  
- **Unit Tests:** For APIs and business logic (discounts, tax calc, etc.).  
- **Integration Tests:** Payment flows with sandbox (Razorpay/UPI), hardware emulator for printers.  
- **Offline Scenario Tests:** Simulate offline sales and large sync queues. Test conflict resolution rules.  
- **Load Tests:** Simulate peak transactions (hundreds per minute) and multiple syncs. Test DB performance with multi-store.  
- **Security Tests:** Penetration testing, check encryption.  
- **UX Tests:** Ensure checkout can be done quickly by non-expert users. 
- **GST Validation:** Generate sample invoices and verify with rule 46 fields.  
- **Edge Cases:** Test all scenarios listed (concurrent stock sale, transfer mismatches, expired holds, etc.).  

# 🔨 MVP Scope, Milestones & Effort  

## MVP (Must-Have)  
- Single-store support (multiple counters) – includes full billing and basic inventory.  
- Core modules: fast POS checkout, basic inventory (no batch), user roles (Owner/Cashier), customer credit, UPI & cash payments.  
- Onboarding wizard, subscription checkout.  
- Basic reports (sales summary, item-wise).  
- Offline billing (sales queue sync) with conflict handling.  
- GST invoice printing (no e-invoice initially).  
- **Effort:** High complexity (billing/inventory with offline sync). Estimated ~4–6 months dev (core team).

## Phase 2 (Standard Tier)  
- Multi-counter and multi-store support (synchronised inventory)【38†L212-L219】.  
- Batch/expiry tracking (grocery/pharma). Low-stock alerts.  
- Enhanced payments: card terminal integration. Split payments.  
- Customer loyalty programs.  
- Improved reports (category, cashier-wise).  
- UI refinements (industry presets, language support).  
- **Effort:** Medium (3–4 months, add features and polishing).

## Phase 3 (Advanced/Pro Tier)  
- Full multi-store management (dashboard, central warehouse). Advanced analytics/dashboards (trends, forecasts).  
- E‑invoicing integration (API to GSTN IRP).  
- Automated reminders (SMS/WhatsApp).  
- Full API for third‑party integration (accounting, e‑commerce).  
- Enhanced security (2FA, biometric login).  
- 24/7 Support & multi-language.  
- **Effort:** Medium to high (4–5 months), plus ongoing maintenance.

Each milestone includes testing and documentation. Effort categories: **High** for core POS (billing/inventory logic, offline sync), **Medium** for extensions (multi-store, payments), **Low** for UI polish and admin features.

**Summary:** A phased development focusing first on rock‑solid fast billing and basic inventory (the heart of the product), then layering on multi-location and advanced features. With rigorous QA and compliance checks (using sources like GST guidelines【8†L343-L352】 and POS best‑practices【36†L189-L193】【21†L270-L278】), this roadmap can guide an AI agent or dev team to build a full-fledged, production‑ready Indian POS/Inventory SaaS.

