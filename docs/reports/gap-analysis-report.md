# OmniBIZ Gap Analysis Report

**Generated**: 2026-04-15  
**Based on**: `docs/reports/deep-research-report.md` vs current codebase state

## Executive Summary

The deep research report defined 200+ user stories across 7 personas. The current codebase covers approximately **45% of MVP requirements**. Core billing and inventory CRUD works, but several critical flows are incomplete: returns/refunds, split payments, stock transfers, credit settlement, role-based UI, and offline support are all missing or half-baked.

---

## Feature-by-Feature Status

### Legend
- ✅ **Done** — Fully functional
- 🔶 **Half-baked** — UI exists but backend/flow incomplete  
- ❌ **Missing** — Not implemented at all

| # | Feature | Status | Priority | Notes |
|---|---------|--------|----------|-------|
| **POS / Billing** | | | | |
| 1 | Product grid + cart + checkout | ✅ | MUST | Working |
| 2 | Hold / Recall bills | ✅ | MUST | Zustand-persisted |
| 3 | Keyboard shortcuts (F1-F4, Ctrl+H) | ✅ | SHOULD | Working |
| 4 | Product search by name/SKU/barcode | ✅ | MUST | Working |
| 5 | Category filtering | ✅ | SHOULD | Working |
| 6 | GST calculation per line item | ✅ | MUST | Working |
| 7 | Bill-level discount (flat/percentage) | ✅ | SHOULD | Working |
| 8 | Payment modes (Cash/UPI/Card) | ✅ | MUST | Working |
| 9 | Customer search from POS | ✅ | MUST | Working |
| 10 | Loyalty points redemption | ✅ | SHOULD | Working |
| 11 | Store/counter selector | ✅ | MUST | Working |
| 12 | Receipt print dialog | ✅ | MUST | Working via window.print() |
| 13 | Thermal receipt HTML (80mm) | ✅ | MUST | Working via /api/print/receipt |
| 14 | **Split/mixed payments** | 🔶 | MUST | MIXED type exists in schema, no multi-payment UI |
| 15 | **Cancel/void invoice** | ❌ | MUST | No API or UI. SalesReturn model exists |
| 16 | **Returns/exchanges** | ❌ | MUST | No API or UI |
| 17 | **UPI dynamic QR** | ❌ | SHOULD | No upi://pay? QR generation |
| 18 | **Barcode scanning** | ❌ | SHOULD | Scan icon is decorative, no camera/scanner integration |
| 19 | **Customer-facing display** | ❌ | SHOULD | No second-screen support |
| 20 | **Offline billing** | ❌ | SHOULD | No PWA/service worker, all flows require live API |
| **Inventory** | | | | |
| 21 | Product CRUD + search + pagination | ✅ | MUST | Working |
| 22 | Category CRUD | ✅ | MUST | Working |
| 23 | Stock adjustments (damage/theft/expiry) | ✅ | MUST | Working |
| 24 | CSV import | ✅ | SHOULD | Working |
| 25 | Product variants | ✅ | SHOULD | Schema + UI working |
| 26 | Batch/expiry display columns | ✅ | SHOULD | Working |
| 27 | Low/out-of-stock alerts | ✅ | MUST | Working |
| 28 | Stock movements log | ✅ | SHOULD | Working |
| 29 | Export to CSV | ✅ | SHOULD | Working |
| 30 | **Batch management workflow** | 🔶 | SHOULD | Fields exist, no batch tracking UI/FIFO enforcement |
| 31 | **Low-stock reorder** | 🔶 | SHOULD | reorderLevel field exists, no auto-reorder or PO creation |
| 32 | **Stock transfers** | ❌ | MUST | TransferIn/Out enum exists, no UI or API |
| 33 | **Stock audit/physical count** | ❌ | SHOULD | No count workflow |
| **Customer / Credit (Khata)** | | | | |
| 34 | Customer CRUD + search | ✅ | MUST | Working |
| 35 | Credit balance tracking | ✅ | MUST | creditBalance on Customer model |
| 36 | Customer search from POS | ✅ | MUST | Working |
| 37 | Loyalty points earn/redeem | ✅ | SHOULD | Working in billing flow |
| 38 | Outstanding report | ✅ | SHOULD | Working in Reports |
| 39 | Customer types (retail/wholesale) | ✅ | SHOULD | Working |
| 40 | **Credit limit enforcement** | 🔶 | MUST | creditLimit field exists, not enforced in billing |
| 41 | **Payment settlement UI** | ❌ | MUST | No "record payment" against credit dues |
| 42 | **SMS/WhatsApp reminders** | ❌ | SHOULD | No messaging integration |
| 43 | **Loyalty management UI** | ❌ | NICE | No page for points history/adjustment |
| **User / Role Management** | | | | |
| 44 | Team CRUD + invite | ✅ | MUST | Working |
| 45 | Role/persona CRUD | ✅ | MUST | Working with granular permissions |
| 46 | Store access assignment | ✅ | MUST | Working |
| 47 | Activity logging (all API routes) | ✅ | SHOULD | logActivity() in all routes |
| 48 | **Role-based menu filtering** | 🔶 | MUST | Permissions exist, frontend ignores them |
| 49 | **Audit log viewer** | ❌ | SHOULD | Logs written to DB, no UI to view them |
| 50 | **PIN/quick login** | ❌ | SHOULD | Not implemented |
| 51 | **Session management** | ❌ | NICE | No active session tracking |
| **Payment Integration** | | | | |
| 52 | Razorpay subscription billing | ✅ | MUST | Working for SaaS plans |
| 53 | **Split payment UI** | ❌ | MUST | Data model ready, no multi-payment dialog |
| 54 | **UPI QR for in-store payments** | ❌ | SHOULD | No upi://pay? integration |
| 55 | **Card terminal integration** | ❌ | NICE | Not implemented |
| 56 | **Invoice payment gateway** | ❌ | NICE | Not implemented |
| **Reports** | | | | |
| 57 | Sales report (daily) | ✅ | MUST | Working |
| 58 | GST summary (HSN-wise) | ✅ | MUST | Working |
| 59 | Inventory report | ✅ | SHOULD | Working |
| 60 | Outstanding report | ✅ | SHOULD | Working |
| 61 | Sales by product | ✅ | SHOULD | API exists, used in dashboard |
| 62 | Sales by category | ✅ | SHOULD | API exists |
| 63 | Store + date filters | ✅ | MUST | Working |
| 64 | CSV export | ✅ | SHOULD | Working |
| 65 | **Excel export** | 🔶 | SHOULD | Button shows "coming soon" |
| 66 | **PDF export** | ❌ | SHOULD | Not implemented |
| 67 | **Staff performance report** | ❌ | SHOULD | No sales-by-user report |
| 68 | **Store comparison** | ❌ | SHOULD | No multi-store comparison |
| 69 | **Profitability report** | ❌ | SHOULD | costPrice exists, not used in reports |
| 70 | **GSTR-1 / GSTR-3B** | ❌ | MUST | No formatted GST return reports |
| **Onboarding** | | | | |
| 71 | Single store setup | ✅ | MUST | Working |
| 72 | Auto-redirect if store exists | ✅ | MUST | Working |
| 73 | **Industry presets** | 🔶 | SHOULD | storeType in schema, not in onboarding |
| 74 | **Multi-store setup** | ❌ | MUST | Only one store in onboarding |
| 75 | **Counter setup in onboarding** | ❌ | SHOULD | Not in onboarding flow |
| 76 | **User invitation in onboarding** | ❌ | SHOULD | Not in onboarding flow |
| **Notifications** | | | | |
| 77 | In-app notifications API | ✅ | SHOULD | Working (low stock, pending payments, new customers) |
| 78 | **Notification bell UI** | ✅ | SHOULD | Working in dashboard layout |
| 79 | **SMS alerts** | ❌ | SHOULD | No integration |
| 80 | **WhatsApp alerts** | ❌ | SHOULD | No integration |
| 81 | **Email alerts** | ❌ | SHOULD | No transactional email |
| 82 | **Notification preferences** | ❌ | NICE | No settings UI |
| **Settings** | | | | |
| 83 | Business details (GSTIN, PAN, etc.) | ✅ | MUST | Working |
| 84 | Invoice settings (prefix, language) | ✅ | MUST | Working |
| 85 | Inventory alert settings | ✅ | SHOULD | Working |
| 86 | Password change | ✅ | MUST | Working via Supabase |
| 87 | **2FA** | 🔶 | SHOULD | Button shows "coming soon" |
| 88 | **Printer configuration** | ❌ | SHOULD | PrinterConfig model exists, no UI |
| 89 | **Tax configuration** | ❌ | SHOULD | No GST rate management |
| 90 | **Payment method toggle** | ❌ | NICE | No per-store payment config |
| **Audit / Compliance** | | | | |
| 91 | Activity logging | ✅ | MUST | Working in all API routes |
| 92 | **Audit log viewer** | ❌ | SHOULD | No UI |
| 93 | **E-invoicing** | ❌ | MUST | No GSTN/IRN integration |
| 94 | **Shift management** | 🔶 | MUST | Shift model exists, no UI or API |
| 95 | **Data backup/export** | ❌ | SHOULD | No full data export |

---

## UX/UI Issues Found During Testing

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| U1 | Both stores named "Chennai Main Store" — confusing in dropdowns | Medium | Store creation |
| U2 | SelectValue bug pattern across all Radix Select dropdowns (shows raw values) | Medium | All pages — FIXED |
| U3 | Top Selling products showed blank names (wrong field mapping) | High | Dashboard — FIXED |
| U4 | Inventory page showed 0 products initially (not syncing with global store) | High | Inventory — FIXED |
| U5 | Reports store filter showed empty dropdown (React Query cache mismatch) | High | Reports — FIXED |
| U6 | No confirmation dialogs for destructive actions (delete customer, void invoice) | Medium | All CRUD pages |
| U7 | No loading skeletons on settings page | Low | Settings |
| U8 | Notification bell shows count but no way to mark as read | Low | Dashboard layout |
| U9 | No pagination on billing list (loads all invoices) | Medium | Billing list |
| U10 | POS grid doesn't show product images | Low | POS page |
| U11 | No empty state illustrations on several pages (just text) | Low | Various |
| U12 | Receipt print uses window.print() — not thermal printer integration | Medium | POS |
| U13 | No dark mode toggle despite having dark: classes in CSS | Low | Global |
| U14 | Mobile responsiveness — several tables overflow on small screens | Medium | Billing, Inventory, Reports |