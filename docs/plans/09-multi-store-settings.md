# Day 9: Multi-Store, Settings & Polish

## Goal
A retailer with multiple stores can manage all stores from one dashboard. Settings page lets them configure the store exactly how they want it.

---

## Why This Day Matters
Multi-store support is a key differentiator for growing retailers. Settings ensure the app matches their business workflow, not the other way around.

---

## Tasks

### 9.1 Multi-Store Management (`/dashboard/stores`)
- [ ] Stores page exists. Enhance:
  - [ ] List all stores with status
  - [ ] Add Store button (for Pro+ plans)
  - [ ] Store card: name, code, address, type, status, user count, today's sales
  - [ ] Click store → store settings + dashboard for that store

### 9.2 Store Switcher
- [ ] In sidebar: store selector dropdown (already exists — enhance)
  - [ ] Show all stores user has access to
  - [ ] "All Stores" option for aggregated view
  - [ ] Quick-add store link at bottom

### 9.3 Inter-Store Transfers
- [ ] Create transfer: Source store → Destination store
- [ ] Select products + quantities
- [ ] Auto-reduce source store stock, increase destination
- [ ] Transfer approval workflow (optional for Enterprise)
- [ ] Transfer history + status

### 9.4 User Management (`/dashboard/settings?tab=users`)
- [ ] List all users in tenant
- [ ] Invite user: email/phone → send OTP or email invite
- [ ] Assign persona + store access
- [ ] Roles: Owner, Admin, Manager, Billing, Inventory (based on personas)
- [ ] Deactivate user (soft delete)
- [ ] Activity log per user

### 9.5 Persona Management
- [ ] Default personas created during onboarding
- [ ] "Manage Personas" → see all personas
- [ ] Add/Edit persona: name, description, permissions
- [ ] Permission matrix: toggle per module (Store, Products, Billing, etc.)
- [ ] Clone persona to create new one

### 9.6 Settings Page (`/dashboard/settings`)
- [ ] Tabs: General, GST, Billing, Inventory, Notifications, Users, Billing, Print
- [ ] **General**: Business name, logo, address, phone, email
- [ ] **GST**: GSTIN, PAN, FSSAI, invoice prefix, HSN codes
- [ ] **Billing**: Invoice format, receipt printer, decimal places, round-off
- [ ] **Inventory**: Low stock alert days, expiry alert days, default reorder level
- [ ] **Notifications**: Email/SMS alerts for low stock, expiry, new orders
- [ ] **Print**: Receipt printer config, paper width, characters per line, logo

### 9.7 Invoice Customization
- [ ] Invoice header: logo, business name, address, GSTIN
- [ ] Invoice footer: terms, notes, payment QR
- [ ] Invoice fields: show/hide fields, reorder
- [ ] Invoice format: A4, thermal (58mm/80mm)
- [ ] "Preview Invoice" button

### 9.8 Printer Configuration
- [ ] Add printer: name, type (receipt/kitchen), connection (network/USB/Bluetooth)
- [ ] Test print button
- [ ] Receipt template editor (basic)
- [ ] Kitchen ticket format

### 9.9 Store Settings API
- [ ] GET/PUT `/api/settings`: Tenant + store settings
- [ ] GET/PUT `/api/stores/[id]`: Individual store settings
- [ ] GET/PUT `/api/stores/[id]/settings`: Store-specific config
- [ ] POST `/api/users/invite`: Invite user
- [ ] GET/PUT `/api/personas`: Manage personas

### 9.10 Dashboard Polish
- [ ] Make dashboard feel alive with real data (not mock)
- [ ] Date contextual: "Saturday, 4 April 2026" not static
- [ ] Store name dynamic
- [ ] Alerts: low stock, expiring items, pending payments

---

## Deliverable
A retailer can manage multiple stores, configure settings, invite team members, and customize the app to their workflow — without calling support.

---

## Dependencies
- Day 3 (onboarding creates first store)
- Day 4 (POS needs store context)
- Day 7 (reports need multi-store filter)
