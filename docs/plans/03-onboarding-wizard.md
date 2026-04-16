# Day 3: Store Onboarding Wizard (Zero to Ready)

## Goal
A non-technical retailer configures their store in 5 minutes. They answer simple questions, and the system auto-configures everything: GST settings, inventory tracking, default categories, personas. No IT knowledge needed.

---

## Why This Day Matters
This is where the **"under 10 minutes" promise** is fulfilled. The onboarding must:
1. Feel guided, not overwhelming
2. Make smart defaults (they can change later)
3. Auto-detect sensible settings based on store type
4. End with a "You're ready!" celebration screen → go to dashboard

---

## Customer Journey
```
[Payment Success] → [Step 1: Business Details] → [Step 2: Store Type] → [Step 3: Location] → [Step 4: Team] → [Done! → Dashboard]
```

---

## Tasks

### 3.1 Onboarding Page Polish (already exists — needs completion)
- [ ] The 4-step wizard already exists. Audit each step:
  - **Step 1: Business** — Business name, GSTIN (auto-validate format), PAN, phone, email, FSSAI (if food)
  - **Step 2: Store Type** — Visual cards (Electronics, Grocery, etc.) with icons. Selecting one auto-enables relevant features.
  - **Step 3: Location** — Address, state (dropdown with all Indian states), PIN (auto-validate 6-digit), inventory tracking toggles
  - **Step 4: Team** — Suggested personas based on store type. Toggle on/off. Default: Owner/Admin only for small stores.
- [ ] Add **progress indicator** with step names
- [ ] "Back" and "Continue" buttons — Back should remember data
- [ ] "Save & Exit" — save partial progress, resume later
- [ ] On "Complete Setup" → POST to `/api/onboarding` (already exists — verify it works)

### 3.2 Auto-Detection & Smart Defaults
- [ ] When store type = ELECTRONICS:
  - Auto-enable serial number tracking
  - Create default categories: Mobiles, TVs, Appliances, Audio, Accessories
  - Set default GST rates: 18% for most electronics
- [ ] When store type = GROCERY/SUPERMARKET:
  - Auto-enable batch + expiry tracking
  - Create default categories: Food Grains, Dairy, Beverages, Snacks, Personal Care
  - Enable FSSAI field (required for food businesses)
- [ ] When store type = RESTAURANT:
  - Auto-enable table management
  - Create default categories: Starters, Main Course, Desserts, Beverages, Combos
  - Skip serial/batch tracking
- [ ] When state selected:
  - Auto-set intra-state GST (CGST+SGST) vs inter-state (IGST) in settings

### 3.3 Onboarding API Completion
- [ ] The `/api/onboarding` route already exists. Verify and fix:
  - Creates tenant
  - Creates user linked to tenant
  - Creates store with locations
  - Creates default categories (based on store type)
  - Creates personas with permissions
  - Creates tenant settings
  - Creates trial subscription
  - Links user to store
- [ ] Add `isOnboardingComplete` flag to tenant/user
- [ ] After onboarding → redirect to `/dashboard` not `/onboarding`

### 3.4 GSTIN Validation (API)
- [ ] Create `/api/gstin/validate` route
- [ ] Use ClearTax API or government GST portal API for validation
- [ ] Validate: 15-character format, valid state code, company name matches
- [ ] Show green checkmark when valid, red X with message when invalid
- [ ] For v1, do **basic format validation only** (no API call yet — phase 2)

### 3.5 State & PIN Auto-Fill
- [ ] When PIN entered → auto-fill city and state (use India Post API or simple lookup table)
- [ ] Validate PIN is numeric, 6 digits
- [ ] Show city name after PIN entry: "Chennai, Tamil Nadu"

### 3.6 Onboarding Completion Screen
- [ ] "🎉 You're all set!" celebration screen
- [ ] Show summary: Store name, plan, store type, features enabled
- [ ] "Go to Dashboard" button (large, prominent)
- [ ] "Add your first product" quick action card
- [ ] Send welcome email with:
  - Store details summary
  - "Your first 5 minutes" guide
  - Link to add products
  - Support contact

### 3.7 Partial Onboarding Recovery
- [ ] If user exits mid-onboarding, save state
- [ ] Next login → detect incomplete onboarding → redirect back to wizard at last step
- [ ] "Continue where you left off?" prompt

---

## Deliverable
A retailer with zero technical knowledge completes onboarding in 5 minutes and lands on the dashboard ready to add products and start billing.

---

## What Already Exists (Read Before Starting)
- Onboarding page at `src/app/(onboarding)/page.tsx`
- 4-step wizard UI (Business, Store Type, Location, Team)
- `/api/onboarding` route — fully implemented (creates tenant, store, categories, personas, settings)
- `/api/gstin/validate` route — basic 15-char format validation (state code, PAN, checksum)
- `src/app/(onboarding)/page.tsx` — `handleComplete` calls the API, shows success screen

## ✅ COMPLETED

### 3.1 Onboarding Page Polish
- [x] Progress indicator with step names (4 steps)
- [x] "Back" and "Continue" buttons — data remembered via localStorage
- [x] "Save & Exit" — saves state to localStorage, user can resume later
- [x] "Complete Setup" → POST to `/api/onboarding`, then shows celebration screen

### 3.3 Onboarding API Completion
- [x] `/api/onboarding/route.ts` — fully implemented (creates tenant, store, locations, categories, personas, settings, subscription)
- [x] Onboarding page `handleComplete` — calls API, shows success screen, redirects to dashboard
- [x] localStorage key `ezvento_onboarding_state` — persists step, formData, selectedStoreType, selectedPersonas

### 3.4 GSTIN Validation (API)
- [x] `/api/gstin/validate` route — validates 15-char GSTIN format (state code 01-37, PAN, entity, Z, checksum)
- [x] No external API call — basic format validation only

### 3.6 Onboarding Completion Screen
- [x] "You're all set!" celebration screen with green checkmark
- [x] "Go to Dashboard" button
- [x] "Add Your First Product" quick action button

### 3.7 Partial Onboarding Recovery
- [x] State persisted to `ezvento_onboarding_state` on every change
- [x] On page load, state restored from localStorage (step, form data, store type, personas)
- [x] "Save & Exit" button to leave mid-onboarding and resume later

## Remaining (Phase 2)
- PIN auto-fill (city/state from India Post API or lookup table) — needs external data source
- GSTIN live validation via ClearTax/GST portal API — Phase 2
- Welcome email with store summary — needs Resend email integration
- `isOnboardingComplete` flag on tenant/user — already created via onboarding

## localStorage Key for State Persistence
```
Key: 'ezvento_onboarding_state'
Shape: {
  currentStep: number,
  formData: {...},
  selectedStoreType: string | null,
  selectedPersonas: string[],
  selectedState: string,
  lastSaved: ISO timestamp
}
```

## Dependencies
- Day 2 (signup + payment flow)
- Existing `/api/onboarding` route (fully implemented)
- Prisma schema (already has all models)
