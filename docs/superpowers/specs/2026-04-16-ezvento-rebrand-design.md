# Ezvento Rebrand Design

## Overview

Rebrand the OmniBIZ codebase to **Ezvento**, following the branding guide (`docs/ezvento_branding_guide.md`) and product requirements (`docs/ezvento_product_requirements.md`).

**Approach**: Layered phases — (1) Colors + theme, (2) Name + copy, (3) Identifiers + domain. Each phase is a separate commit and test cycle.

**Rationale**: Smaller reviewable diffs, can ship the visual change immediately, avoids a single massive PR.

---

## Phase 1: Colors + Theme

**Goal**: Replace the indigo/violet color system with Ezvento's blue/green/orange palette. No text changes in this phase — only visual tokens.

### Color Mapping

| Role | Current (OmniBIZ) | New (Ezvento) | Usage |
|------|-------------------|---------------|-------|
| Primary | `#6366F1` (indigo-500) | `#2563EB` (blue-600) | Buttons, links, sidebar accent |
| Primary hover | `#4F46E5` (indigo-600) | `#1D4ED8` (blue-700) | Hover states |
| Primary light | `#E0E7FF` (indigo-100) | `#DBEAFE` (blue-100) | Badges, backgrounds |
| Primary 50 | `#EEF2FF` (indigo-50) | `#EFF6FF` (blue-50) | Subtle backgrounds |
| CTA / Success | `#10B981` (emerald-500) | `#10B981` (emerald-500) | No change — already matches |
| CTA hover | `#059669` (emerald-600) | `#059669` (emerald-600) | No change |
| Accent / Action | `#8B5CF6` (violet-500) | `#F97316` (orange-500) | Highlight actions, important buttons |
| Accent light | `#EDE9FE` (violet-100) | `#FED7AA` (orange-100) | Accent backgrounds |
| Hero gradient | `#667eea → #764ba2 → #f093fb` | `#2563EB → #3B82F6 → #60A5FA` | Landing hero |
| Text gradient | `#6366F1 → #8B5CF6 → #EC4899` | `#2563EB → #3B82F6 → #10B981` | Landing headings |
| Sidebar dark | `oklch(0.488 0.243 264.376)` | `oklch(0.45 0.2 255)` | Dashboard sidebar accent |
| Dark primary | `oklch(0.922 0 0)` | no change | Dark mode |

### Files to Change

1. **`src/app/globals.css`**
   - Update `--indigo-*` custom properties to `--blue-*` equivalents (rename variables + change hex values)
   - Update `--violet-500` → `--orange-500`, `--violet-100` → `--orange-100`
   - Update `.gradient-hero` background gradient
   - Update `.text-gradient` to blue-to-green
   - Update `.animate-pulse-glow` keyframe colors from indigo to blue
   - Update `.gradient-mesh` radial gradients from violet to blue
   - Keep `--emerald-*` properties as-is (they match Ezvento's green)

2. **`public/manifest.json`**
   - `theme_color`: `#4F46E5` → `#2563EB`
   - `background_color`: keep `#ffffff`

3. **`src/app/layout.tsx`**
   - `themeColor`: `#4F46E5` → `#2563EB`

4. **`src/lib/emails.ts`**
   - All `color:#4F46E5` → `color:#2563EB`
   - All `color:#7C3AED` (violet) → `color:#EA580C` (orange-600)
   - Gradient in subscription email: `#4F46E5` → `#2563EB`

5. **`public/offline.html`**
   - Button color `#4F46E5` → `#2563EB`

6. **`docs/design-system/omnibiz/MASTER.md`**
   - Rename directory from `omnibiz/` to `ezvento/`
   - Update all color references in the doc

### Tailwind Class Updates

The project uses Tailwind v4 with `@theme inline` in globals.css. The CSS custom properties feed into Tailwind utilities. Since we're renaming `--indigo-*` to `--blue-*`, all Tailwind classes referencing `indigo` need updating:

| Old class pattern | New class pattern |
|---|---|
| `from-indigo-500` | `from-blue-600` |
| `to-violet-600` | `to-blue-500` |
| `bg-indigo-600` | `bg-blue-600` |
| `text-indigo-600` | `text-blue-600` |
| `shadow-indigo-500/25` | `shadow-blue-500/25` |
| `border-indigo-200` | `border-blue-200` |
| `ring-indigo-500` | `ring-blue-500` |
| `hover:bg-indigo-700` | `hover:bg-blue-700` |
| `bg-gradient-to-br from-indigo-500 to-violet-600` | `bg-gradient-to-br from-blue-600 to-blue-400` |

This affects: landing page, auth pages, onboarding, dashboard layout, subscription page, and various card/button components. Full list from the audit: ~40+ class references across ~15 files.

### What Does NOT Change in Phase 1

- No brand name changes ("OmniBIZ" stays for now)
- No copy/terminology changes
- No domain/email changes
- No code identifier renames
- Logo icon remains `<Store>` from lucide (to be updated in Phase 2)

---

## Phase 2: Name + Copy

**Goal**: Replace all user-facing "OmniBIZ" with "Ezvento", update terminology (Inventory → Stock, SKU → Product Code, remaining Invoice → Bill), update tagline, update metadata.

### Name Replacement Map

| Old | New | Scope |
|-----|-----|-------|
| OmniBIZ | Ezvento | All UI text, emails, meta tags, manifest, offline page |
| OmniBIZ Team | Ezvento Team | Email footers |
| OmniBIZ Store | Ezvento Store | PhonePe fallback merchant name |
| omnibiz.in | ezvento.karthi-21.com | Email domains, URLs (until ezvento.com is ready) |
| omnibiz.app | ezvento.karthi-21.com | E2E test URLs |
| omnibiz@ybl | ezvento@ybl | UPI VPA |
| app.omnibiz.in | app.ezvento.karthi-21.com | Email links, test URLs |

### Terminology Replacement Map

| Old | New | Context |
|-----|-----|---------|
| Inventory | Stock | UI labels, nav items, page titles (not code variables/schema) |
| SKU | Product Code | User-facing column headers, search placeholders |
| Invoice # | Bill # | Email templates, receipt headers |
| View Full Invoice | View Full Bill | Email button text |
| Invoice Settings | Bill Settings | Settings page heading (if not already changed) |
| Inventory Alerts | Stock Alerts | Settings, email subjects |
| Inventory Manager | Stock Manager | Onboarding persona names |
| Inventory Tracking | Stock Tracking | Plan features, onboarding |
| Advanced Inventory | Advanced Stock | Plan features |
| Run your shop easily | Simplifying how you run your store | Landing hero (matches Ezvento tagline) |

### Tagline Update

Current landing page hero: "Run your shop easily"
New hero: "Simplifying how you run your store" (from branding guide tagline)

### Files to Change (Name + Copy)

**UI Pages** (~15 files):
- `src/app/page.tsx` — landing page: hero, nav, footer, feature cards, FAQ
- `src/app/layout.tsx` — meta title, description, appleWebApp title
- `src/app/(auth)/login/page.tsx` — "Sign in to your OmniBIZ account"
- `src/app/(auth)/signup/page.tsx` — terms link
- `src/app/(auth)/terms/page.tsx` — legal text, contact email
- `src/app/(auth)/privacy/page.tsx` — legal text, contact email
- `src/app/(dashboard)/layout.tsx` — sidebar brand
- `src/app/(dashboard)/dashboard/inventory/page.tsx` — page title "Inventory" → "Stock"
- `src/app/(dashboard)/dashboard/reports/page.tsx` — report labels
- `src/app/(dashboard)/dashboard/settings/page.tsx` — receipt issuer, settings labels
- `src/app/(dashboard)/dashboard/billing/page.tsx` — TypeScript interface comments
- `src/app/(dashboard)/dashboard/billing/new/page.tsx` — POS text
- `src/app/onboarding/page.tsx` — welcome text, persona names
- `src/app/(onboarding)/page.tsx` — welcome text, persona names
- `src/app/payment/page.tsx` — contact email
- `src/app/payment/success/page.tsx` — brand name

**Backend/Emails** (~8 files):
- `src/lib/emails.ts` — all email templates (brand name, tagline, colors already updated in Phase 1)
- `src/lib/pdf-generator.ts` — "Powered by OmniBIZ" → "Powered by Ezvento"
- `src/lib/phonepe.ts` — merchant name fallback
- `src/lib/dodo.ts` — metadata source
- `src/lib/plan-limits.ts` — comment
- `src/app/api/print/receipt/route.ts` — receipt footer
- `src/app/api/onboarding/create-store/route.ts` — email subject
- `src/app/api/emails/send-reminder/route.ts` — email content
- `src/app/api/customers/[id]/send-reminder/route.ts` — email content

**Config/Manifest** (~4 files):
- `public/manifest.json` — name, short_name, description
- `public/offline.html` — title and body text
- `public/sw.js` — cache name (deferred to Phase 3 for code identifiers)
- `.env.local.example` — RESEND_FROM_EMAIL, RESEND_REPLY_TO, NEXT_PUBLIC_APP_NAME

**Tests** (~2 files):
- `src/__tests__/lib/emails.test.ts` — URL assertions, brand name assertions
- `e2e/auth.spec.ts` — demo email

### What Does NOT Change in Phase 2

- Code identifiers (class names, DB names, localStorage keys) — deferred to Phase 3
- Color values — already done in Phase 1
- Prisma schema table/column names — those stay as-is (code identifiers)
- API route paths — stay as-is

---

## Phase 3: Identifiers + Domain

**Goal**: Rename all internal code identifiers from omnibiz/omnibiz to ezvento/ezvento. Update the domain configuration.

### Code Identifier Replacement Map

| Old | New | File |
|-----|-----|------|
| `OmniBIZOfflineDB` | `EzventoOfflineDB` | `src/lib/offline-db.ts` |
| `omnibiz_offline` (IndexedDB name) | `ezvento_offline` | `src/lib/offline-db.ts` |
| `omnibiz-v1` (SW cache name) | `ezvento-v1` | `public/sw.js` |
| `omnibiz_onboarding_state` (localStorage) | `ezvento_onboarding_state` | `src/app/(onboarding)/page.tsx` |
| `__OMNIBIZ_TEST_AUTH_USER__` | `__EZVENTO_TEST_AUTH_USER__` | `src/__tests__/api/helpers.ts` |
| `__OMNIBIZ_TEST_PRISMA_DATA__` | `__EZVENTO_TEST_PRISMA_DATA__` | `src/__tests__/api/helpers.ts` |
| `omnibiz` (Dodo metadata source) | `ezvento` | `src/lib/dodo.ts` |
| `omnibiz@ybl` (PhonePe VPA) | `ezvento@ybl` | `src/components/billing/upi-payment-dialog.tsx` |

### Domain Configuration

Update `.env.local.example` and `.env.local`:
- `NEXT_PUBLIC_APP_URL`: `https://ezvento.karthi-21.com`
- `NEXT_PUBLIC_APP_NAME`: `Ezvento`
- `RESEND_FROM_EMAIL`: `Ezvento <billing@ezvento.karthi-21.com>`
- `RESEND_REPLY_TO`: `support@ezvento.karthi-21.com`
- `PHONEPE_CALLBACK_URL`: update to new domain
- `DODO_REDIRECT_URL`: update to new domain

**Migration note**: When `ezvento.com` is purchased, only `.env` values need updating — no code changes.

### Files to Change

- `src/lib/offline-db.ts` — class name, DB name
- `public/sw.js` — cache name
- `src/app/(onboarding)/page.tsx` — localStorage key
- `src/__tests__/api/helpers.ts` — test auth constants
- `src/__tests__/api/stores.test.ts` — test auth constants
- `src/__tests__/api/products.test.ts` — test auth constants
- `src/__tests__/api/billing.test.ts` — test auth constants
- `src/__tests__/api/tenant-isolation.test.ts` — test auth constants
- `src/lib/dodo.ts` — metadata source
- `src/components/billing/upi-payment-dialog.tsx` — VPA fallback
- `.env.local.example` — all brand-related env vars
- `.env.local` — all brand-related env vars (if exists)
- `scripts/seed-test-scenario.ts` — title comment

### Logo / Favicon

Create minimal placeholder assets:
- `public/favicon.svg` — Simple "E" or "Ez" monogram in blue (#2563EB)
- `public/icon-192.png` — Generated from SVG (or placeholder)
- `public/icon-512.png` — Generated from SVG (or placeholder)
- Update `src/app/layout.tsx` icon reference if needed

### What Does NOT Change in Phase 3

- Prisma schema (table names, column names stay as-is — they're internal data layer)
- API route paths (staying as `/api/billing`, `/api/stores`, etc.)
- Database data (tenant names, store names in seed data)
- Environment variable names (only values change)

---

## Phase Dependencies

```
Phase 1 (Colors) ──→ Phase 2 (Name+Copy) ──→ Phase 3 (Identifiers+Domain)
     │                      │                        │
     └─ Can ship alone      └─ Requires Phase 1     └─ Requires Phase 2
```

Phase 1 can ship independently — the app will look like Ezvento but still say "OmniBIZ" in text. Phase 2 requires Phase 1 (so colors and text update together, avoiding odd combinations). Phase 3 requires Phase 2 (so all text is consistent before we update identifiers).

## Verification Per Phase

### Phase 1 Verification
1. Start dev server, load landing page — hero gradient is blue (not indigo/violet)
2. Dashboard sidebar — accent color is blue
3. All buttons that were indigo are now blue
4. All emerald/green colors are unchanged
5. Orange accent appears on action buttons/highlights
6. PWA manifest theme_color is `#2563EB`
7. Email template colors are blue + orange

### Phase 2 Verification
1. Browser Ctrl+F on every page for "OmniBIZ" — zero results in user-visible text
2. Browser Ctrl+F for "omnibiz" in user-visible text — zero results
3. Landing page hero says "Simplifying how you run your store"
4. Landing page footer says "Ezvento"
5. Login page says "Sign in to your Ezvento account"
6. Nav sidebar says "Ezvento"
7. "Inventory" label replaced with "Stock" everywhere in UI
8. "SKU" replaced with "Product Code" in user-visible text
9. Email subjects say "Ezvento" not "OmniBIZ"
10. Terms/privacy pages updated with new brand and domain
11. Manifest name is "Ezvento"

### Phase 3 Verification
1. IndexedDB name is `ezvento_offline` (check DevTools > Application)
2. Service worker cache name is `ezvento-v1`
3. localStorage key is `ezvento_onboarding_state`
4. All test constants use `__EZVENTO_*__`
5. Dodo metadata source is `ezvento`
6. UPI VPA fallback is `ezvento@ybl`
7. Favicon loads correctly (check browser tab)
8. `.env.local` has ezvento domain values

## Scope Exclusions

These are explicitly NOT part of this rebrand:
- Prisma schema/table/column renames (too risky, no user-visible impact)
- API route path renames (breaking change, no user-visible impact)
- Database data migrations (seed data, tenant names)
- Google OAuth/Supabase project name changes (infrastructure)
- Vercel project rename (infrastructure)
- Documentation files in `docs/` outside the design system (low priority, can be done separately)